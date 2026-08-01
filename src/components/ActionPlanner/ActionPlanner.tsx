import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialIcon } from '../MaterialIcon';
import { Plan, Step } from '../../types/planner';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { createPlan } from '../../ai/planner';

type ViewMode = 'dashboard' | 'calendar';
type CalendarViewMode = '2-week' | 'month';

interface ActionPlannerProps {
  onBackToChat?: () => void;
  onToggleDrawer?: () => void;
}

export default function ActionPlanner({ onBackToChat, onToggleDrawer }: ActionPlannerProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [calendarMode, setCalendarMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddDate, setQuickAddDate] = useState('');
  const [goalPrompt, setGoalPrompt] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiProgressStatus, setAiProgressStatus] = useState('');
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);

  const [selectedEventDate, setSelectedEventDate] = useState<string | null>(null);

  // Debounced save
  const saveTimeoutRef = React.useRef<{[id: string]: NodeJS.Timeout}>({});

  // Load from DB instead of local storage
  useEffect(() => {
    fetch('/api/goals')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPlans(data);
        }
      })
      .catch(console.error);
  }, []);

  const saveGoal = async (goal: Plan) => {
    // Clear existing timeout for this goal
    if (saveTimeoutRef.current[goal.id]) {
      clearTimeout(saveTimeoutRef.current[goal.id]);
    }
    
    // Set a new timeout
    saveTimeoutRef.current[goal.id] = setTimeout(async () => {
      try {
        await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goal)
        });
      } catch (e) {
        console.error("Failed to save goal", e);
      }
    }, 1000); // 1s debounce
  };

  const deleteGoalApi = async (id: string) => {
    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error("Failed to delete goal", e);
    }
  };

  const generatePlan = async () => {
    if (!goalPrompt) return;
    setLoading(true);
    setAiProgressStatus('Initializing local AI engine...');
    try {
      const generated = await createPlan(goalPrompt, (status) => {
        setAiProgressStatus(status);
      });

      const startDate = new Date();
      const newSteps: Step[] = [];
      let stepCounter = 1;

      if (generated.days && Array.isArray(generated.days)) {
        generated.days.forEach(d => {
          const dayOffset = Math.max(0, (d.day || 1) - 1);
          const targetDateStr = format(addDays(startDate, dayOffset), 'yyyy-MM-dd');
          
          if (d.tasks && Array.isArray(d.tasks) && d.tasks.length > 0) {
            d.tasks.forEach(taskText => {
              newSteps.push({
                id: crypto.randomUUID(),
                step_number: stepCounter++,
                task: d.title ? `${d.title}: ${taskText}` : taskText,
                scheduled_date: targetDateStr,
                completed: false
              });
            });
          } else if (d.title) {
            newSteps.push({
              id: crypto.randomUUID(),
              step_number: stepCounter++,
              task: d.title,
              scheduled_date: targetDateStr,
              completed: false
            });
          }
        });
      }

      const totalDays = generated.estimatedDays || (generated.days ? generated.days.length : 7);
      const newGoalPlan: Plan = {
        id: crypto.randomUUID(),
        goal_title: generated.title || goalPrompt,
        category: 'Learning',
        priority: 'High',
        status: 'Active',
        main_deadline: format(addDays(startDate, totalDays), 'yyyy-MM-dd'),
        path_of_least_resistance: generated.description || "Client-side AI plan generated with Llama 3.2 1B Instruct.",
        steps: newSteps,
        reminders: email ? [{
          send_date: format(addDays(startDate, 1), 'yyyy-MM-dd'),
          message: `Daily reminder for: ${generated.title || goalPrompt}`
        }] : []
      };

      setPlans(prev => [...prev, newGoalPlan]);
      saveGoal(newGoalPlan);
      setIsAddingGoal(false);
      setGoalPrompt('');
    } catch (err: any) {
      console.error('Local AI Planner Error:', err);
      alert(err?.message || 'Failed to generate plan with local AI engine.');
    } finally {
      setLoading(false);
      setAiProgressStatus('');
    }
  };

  const toggleStep = (planId: string, stepId: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const updatedPlan = {
        ...p,
        steps: p.steps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s)
      };
      saveGoal(updatedPlan);
      return updatedPlan;
    }));
  };

  const changeStepDate = (planId: string, stepId: string, newDate: string) => {
    if (!newDate) return;
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const updatedPlan = {
        ...p,
        steps: p.steps.map(s => s.id === stepId ? { ...s, scheduled_date: newDate } : s)
      };
      saveGoal(updatedPlan);
      return updatedPlan;
    }));
  };
  
  const handleQuickAdd = () => {
    if (!quickAddTitle || !quickAddDate) return;
    
    // Check if a "Quick Tasks" goal exists
    const quickTaskGoalIndex = plans.findIndex(p => p.goal_title === 'Quick Tasks' && p.category === 'Other');
    let quickTaskGoal: Plan;
    
    const newStep = {
      id: crypto.randomUUID(),
      step_number: Date.now(),
      task: quickAddTitle,
      scheduled_date: quickAddDate,
      completed: false
    };

    if (quickTaskGoalIndex >= 0) {
      quickTaskGoal = {
        ...plans[quickTaskGoalIndex],
        steps: [...plans[quickTaskGoalIndex].steps, newStep]
      };
      setPlans(prev => prev.map((p, i) => i === quickTaskGoalIndex ? quickTaskGoal : p));
    } else {
      quickTaskGoal = {
        id: crypto.randomUUID(),
        goal_title: 'Quick Tasks',
        category: 'Other',
        status: 'Active',
        priority: 'Medium',
        main_deadline: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
        steps: [newStep],
        reminders: []
      };
      setPlans(prev => [...prev, quickTaskGoal]);
    }
    
    saveGoal(quickTaskGoal);
    setQuickAddTitle('');
    setIsQuickAdding(false);
  };

  const editStepTitle = (planId: string, stepId: string, newTitle: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const updatedPlan = {
        ...p,
        steps: p.steps.map(s => s.id === stepId ? { ...s, task: newTitle } : s)
      };
      saveGoal(updatedPlan);
      return updatedPlan;
    }));
  };

  const deleteStep = (planId: string, stepId: string) => {
    if (!confirm("Delete this task?")) return;
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const updatedPlan = {
        ...p,
        steps: p.steps.filter(s => s.id !== stepId)
      };
      saveGoal(updatedPlan);
      return updatedPlan;
    }));
  };

  const deletePlan = (planId: string) => {
    if (confirm("Are you sure you want to delete this goal and all its steps?")) {
      setPlans(prev => prev.filter(p => p.id !== planId));
      deleteGoalApi(planId);
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Job Search': return 'bg-blue-500';
      case 'Health': return 'bg-green-500';
      case 'Learning': return 'bg-purple-500';
      case 'Personal': return 'bg-orange-500';
      case 'Finance': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const renderDashboard = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todaySteps = plans.flatMap(p => p.steps.filter(s => s.scheduled_date === todayStr).map(s => ({ ...s, planId: p.id, planTitle: p.goal_title, category: p.category })));
    const overdueSteps = plans.flatMap(p => p.steps.filter(s => s.scheduled_date < todayStr && !s.completed).map(s => ({ ...s, planId: p.id, planTitle: p.goal_title, category: p.category })));
    
    const categoryCounts: Record<string, number> = {};
    plans.forEach(p => {
      const cat = p.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Overdue */}
            {overdueSteps.length > 0 && (
              <div className="bg-error-container/20 rounded-2xl p-5 border border-error/20">
                <h3 className="text-title-medium font-bold text-error flex items-center gap-2 mb-4">
                  <MaterialIcon name="warning" /> Overdue Tasks
                </h3>
                <div className="space-y-3">
                  {overdueSteps.map(step => (
                    <div key={step.id} className="flex items-center justify-between bg-surface-container-lowest p-3 rounded-xl border border-error/10">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleStep(step.planId, step.id)}
                          className="w-6 h-6 rounded-md border-2 border-outline-variant text-transparent hover:border-primary flex items-center justify-center transition-colors"
                        >
                          <MaterialIcon name="check" className="text-body-small" />
                        </button>
                        <div>
                          <p className="font-bold text-body-medium text-on-surface">{step.task}</p>
                          <p className="text-body-small text-on-surface-variant flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${getCategoryColor(step.category)}`}></span>
                            {step.planTitle} • {step.scheduled_date}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-title-medium font-bold text-on-surface flex items-center gap-2">
                  <MaterialIcon name="today" className="text-primary" /> Today's Action Plan
                </h3>
                <button 
                  onClick={() => setIsQuickAdding(true)}
                  className="text-primary text-label-large font-bold hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <MaterialIcon name="add" className="text-[18px]" /> Quick Task
                </button>
              </div>
              
              {todaySteps.length === 0 ? (
                <div className="text-center py-8 bg-surface-container-low rounded-xl">
                  <p className="text-on-surface-variant text-body-medium">No tasks scheduled for today.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySteps.map(step => (
                    <div key={step.id} className="flex items-center justify-between bg-surface-container p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleStep(step.planId, step.id)}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                            step.completed ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant text-transparent hover:border-primary'
                          }`}
                        >
                          <MaterialIcon name="check" className="text-body-small" />
                        </button>
                        <div>
                          <p className={`font-bold text-body-medium transition-all ${step.completed ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                            {step.task}
                          </p>
                          <p className="text-body-small text-on-surface-variant flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${getCategoryColor(step.category)}`}></span>
                            {step.planTitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Category summary */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant">
              <h3 className="text-title-medium font-bold text-on-surface mb-4">Life Balance</h3>
              <div className="space-y-3">
                {Object.entries(categoryCounts).length === 0 && <p className="text-body-small text-on-surface-variant">No goals yet.</p>}
                {Object.entries(categoryCounts).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${getCategoryColor(cat)}`}></span>
                      <span className="text-body-medium font-medium text-on-surface">{cat}</span>
                    </div>
                    <span className="text-body-medium font-bold text-on-surface-variant">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Review prompt */}
            <div className="bg-primary/10 rounded-2xl p-5 border border-primary/20">
              <h3 className="text-title-medium font-bold text-primary flex items-center gap-2 mb-2">
                <MaterialIcon name="insights" /> Weekly Review
              </h3>
              <p className="text-body-small text-on-surface-variant mb-4">Check on stale goals and align your focus for the week ahead.</p>
              <button 
                onClick={() => setShowWeeklyReview(true)}
                className="w-full bg-primary text-on-primary font-bold text-label-large py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                Start Review
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    let start, end;
    if (calendarMode === '2-week') {
      start = startOfWeek(currentDate);
      end = endOfWeek(addDays(currentDate, 7));
    } else {
      start = startOfWeek(startOfMonth(currentDate));
      end = endOfWeek(endOfMonth(currentDate));
    }
    
    const days = eachDayOfInterval({ start, end });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex gap-1.5 p-1 bg-surface-container-low rounded-lg border border-outline-variant/30">
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${calendarMode === '2-week' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              onClick={() => setCalendarMode('2-week')}
            >2-Week</button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${calendarMode === 'month' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              onClick={() => setCalendarMode('month')}
            >Month</button>
          </div>
          <h3 className="font-bold text-title-large text-on-surface">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentDate(addDays(currentDate, calendarMode === '2-week' ? -14 : -30))}
              className="p-2 rounded-full border border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
            >
              <MaterialIcon name="chevron_left" />
            </button>
            <button 
              onClick={() => setCurrentDate(addDays(currentDate, calendarMode === '2-week' ? 14 : 30))}
              className="p-2 rounded-full border border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
            >
              <MaterialIcon name="chevron_right" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {weekDays.map(d => (
            <div key={d} className="text-center text-label-large font-bold text-on-surface-variant py-2 uppercase tracking-wider">
              {d}
            </div>
          ))}
          {days.map((d, i) => {
            const dateStr = format(d, 'yyyy-MM-dd');
            
            // Gather items for this day across all plans
            const dayDeadlines = plans.filter(p => p.main_deadline === dateStr);
            const daySteps = plans.flatMap(p => p.steps.filter(s => s.scheduled_date === dateStr).map(s => ({ ...s, planTitle: p.goal_title, category: p.category })));
            
            // Group dots by category
            const categories = Array.from(new Set(daySteps.map(s => s.category)));

            return (
              <div 
                key={i} 
                onClick={() => setSelectedEventDate(dateStr)}
                className={`calendar-day min-h-[100px] md:min-h-[120px] p-2 flex flex-col transition-all cursor-pointer
                  ${!isSameMonth(d, currentDate) && calendarMode === 'month' ? 'text-on-surface-variant/50' : 'text-on-surface'} 
                  ${isSameDay(d, new Date()) ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                  hover:bg-primary/5
                `}
              >
                <div className={`text-right text-label-large font-bold mb-2 ${isSameDay(d, new Date()) ? 'text-primary' : ''}`}>
                  {format(d, 'd')}
                </div>
                
                <div className="flex flex-col gap-1 overflow-y-auto">
                  {dayDeadlines.map(p => (
                    <div key={`deadline-${p.id}`} className="bg-primary text-on-primary text-[10px] md:text-xs p-1.5 px-2 rounded-md font-bold truncate flex items-center gap-1 shadow-sm" title={`Deadline: ${p.goal_title}`}>
                      <MaterialIcon name="flag" className="text-[12px] md:text-[14px]" />
                      {p.goal_title}
                    </div>
                  ))}
                  
                  {/* Category dots */}
                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 px-1">
                      {categories.map((cat, idx) => (
                        <div 
                          key={idx} 
                          className={`w-2 h-2 rounded-full ${getCategoryColor(cat)}`} 
                          title={cat || 'Task'}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b-2 border-outline-variant bg-surface-container-lowest sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {onToggleDrawer && (
            <button 
              onClick={onToggleDrawer}
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors"
            >
              <MaterialIcon name="menu" className="text-title-medium" />
            </button>
          )}
          <h2 className="text-title-medium font-bold text-on-surface flex items-center gap-2">
            <MaterialIcon name="event_note" className="text-primary" />
            Action Calendar
          </h2>
        </div>
        {onBackToChat && (
          <button 
            onClick={onBackToChat}
            className="text-body-medium font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Done
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-headline-medium font-bold text-on-surface tracking-tight flex items-center gap-2">
                <MaterialIcon name="event_note" className="text-primary" />
                AI Action Calendar
              </h1>
              <p className="text-title-medium text-on-surface-variant mt-1">
                Your goals and daily actionable steps mapped out.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              {/* View Toggle */}
              <div className="flex gap-1.5 p-1 bg-surface-container-low rounded-lg border border-outline-variant/30 mr-2">
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === 'dashboard' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                  onClick={() => setViewMode('dashboard')}
                >
                  <div className="flex items-center gap-1.5"><MaterialIcon name="dashboard" className="text-body-large" /> Dashboard</div>
                </button>
                <button 
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === 'calendar' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                  onClick={() => setViewMode('calendar')}
                >
                  <div className="flex items-center gap-1.5"><MaterialIcon name="calendar_month" className="text-body-large" /> Calendar</div>
                </button>
              </div>

              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plans, null, 2));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", "goals_backup.json");
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}
                className="flex items-center justify-center gap-1 bg-surface-container-high text-on-surface px-4 py-3 rounded-xl font-bold text-title-small hover:bg-surface-container-highest transition-colors shadow-sm border-0"
              >
                <MaterialIcon name="download" />
                Export
              </button>
              <label className="flex items-center justify-center gap-1 bg-surface-container-high text-on-surface px-4 py-3 rounded-xl font-bold text-title-small hover:bg-surface-container-highest transition-colors shadow-sm cursor-pointer border-0">
                <MaterialIcon name="upload" />
                Import
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      try {
                        const importedPlans = JSON.parse(event.target?.result as string);
                        if (Array.isArray(importedPlans)) {
                          setPlans(importedPlans);
                          await fetch('/api/goals', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(importedPlans)
                          });
                        }
                      } catch (err) {
                        alert("Invalid JSON file");
                      }
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }} 
                />
              </label>
              <button 
                onClick={() => setShowWeeklyReview(true)}
                className="flex items-center justify-center gap-2 bg-secondary text-on-secondary px-5 py-3 rounded-xl font-bold text-title-small hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap border-0"
              >
                <MaterialIcon name="insights" />
                Weekly Review
              </button>
              <button 
                onClick={() => setIsAddingGoal(true)}
                className="flex items-center justify-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-bold text-title-small hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap border-0"
              >
                <MaterialIcon name="add" />
                Plan New Goal
              </button>
            </div>
          </div>

          {/* Active Goals Overview */}
          {plans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {plans.map(p => (
                <div key={p.id} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm relative group">
                  <button 
                    onClick={() => deletePlan(p.id)}
                    className="absolute top-4 right-4 p-1.5 rounded-md text-on-surface-variant hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Goal"
                  >
                    <MaterialIcon name="delete" className="text-body-large" />
                  </button>
                  <h3 className="font-bold text-title-medium text-on-surface pr-8">{p.goal_title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-body-small text-on-surface-variant">
                    <MaterialIcon name="flag" className="text-body-medium text-primary" />
                    Target: <span className="font-semibold">{p.main_deadline}</span>
                  </div>
                  {p.path_of_least_resistance && (
                    <div className="mt-3 p-3 bg-secondary-container/30 rounded-xl border border-secondary-container text-body-small text-on-surface">
                      <strong className="block text-secondary mb-1">Path of Least Resistance:</strong>
                      {p.path_of_least_resistance}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between text-body-small font-medium text-on-surface-variant">
                    <span>{p.steps.filter(s => s.completed).length} / {p.steps.length} Steps Completed</span>
                    <div className="w-1/2 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${(p.steps.filter(s => s.completed).length / Math.max(p.steps.length, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'calendar' ? renderCalendar() : renderDashboard()}
        </div>
      </div>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {isQuickAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsQuickAdding(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface-container-lowest w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl border border-outline-variant p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-title-large font-bold text-on-surface">Quick Task</h3>
                <button onClick={() => setIsQuickAdding(false)} className="p-2 bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors">
                  <MaterialIcon name="close" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-label-large font-bold text-on-surface mb-2">Task</label>
                  <input 
                    type="text"
                    value={quickAddTitle}
                    onChange={e => setQuickAddTitle(e.target.value)}
                    placeholder="e.g. Call UNISA on Tuesday"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-label-large font-bold text-on-surface mb-2">Date</label>
                  <input 
                    type="date"
                    value={quickAddDate}
                    onChange={e => setQuickAddDate(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <button 
                  onClick={handleQuickAdd}
                  disabled={!quickAddTitle || !quickAddDate}
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Add Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly Review Modal */}
      <AnimatePresence>
        {showWeeklyReview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowWeeklyReview(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface-container-lowest w-full max-w-2xl rounded-[28px] overflow-hidden shadow-2xl border border-outline-variant max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b border-outline-variant flex justify-between items-center shrink-0">
                <h3 className="text-headline-small font-bold text-on-surface flex items-center gap-2">
                  <MaterialIcon name="insights" className="text-primary" /> Weekly Review
                </h3>
                <button onClick={() => setShowWeeklyReview(false)} className="p-2 bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors">
                  <MaterialIcon name="close" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {plans.length === 0 ? (
                  <p className="text-on-surface-variant text-center py-8">No active goals to review.</p>
                ) : (
                  <div className="space-y-6">
                    {plans.map(p => {
                      const completed = p.steps.filter(s => s.completed).length;
                      const total = p.steps.length;
                      const percent = total === 0 ? 0 : (completed / total) * 100;
                      
                      return (
                        <div key={`review-${p.id}`} className="bg-surface-container p-4 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-title-medium text-on-surface">{p.goal_title}</h4>
                            <span className="text-label-small font-bold px-2 py-1 bg-surface-container-high rounded-md">{Math.round(percent)}%</span>
                          </div>
                          
                          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                const updated = {...p, status: 'Active' as const};
                                setPlans(prev => prev.map(pl => pl.id === p.id ? updated : pl));
                                saveGoal(updated);
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-label-small font-bold transition-colors ${p.status === 'Active' ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-highest/80'}`}
                            >
                              Active
                            </button>
                            <button 
                              onClick={() => {
                                const updated = {...p, status: 'Paused' as const};
                                setPlans(prev => prev.map(pl => pl.id === p.id ? updated : pl));
                                saveGoal(updated);
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-label-small font-bold transition-colors ${p.status === 'Paused' ? 'bg-secondary text-on-secondary' : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-highest/80'}`}
                            >
                              Pause
                            </button>
                            <button 
                              onClick={() => deletePlan(p.id)}
                              className="flex-1 py-1.5 rounded-lg text-label-small font-bold bg-error-container text-on-error-container hover:bg-error-container/80 transition-colors"
                            >
                              Abandon
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {isAddingGoal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && setIsAddingGoal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface-container-lowest w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-outline-variant p-6 md:p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-headline-small font-bold text-on-surface">Plan with AI</h2>
                  <p className="text-body-medium text-on-surface-variant mt-1">Break down your prompt into structured goals and steps.</p>
                </div>
                <button onClick={() => !loading && setIsAddingGoal(false)} className="p-2 bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors">
                  <MaterialIcon name="close" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-title-small font-bold text-on-surface">What do you want to achieve?</label>
                  <textarea 
                    value={goalPrompt}
                    onChange={e => setGoalPrompt(e.target.value)}
                    placeholder="e.g., I want to run a marathon in 6 months, and I also need to finish my React course by next week."
                    className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-0 outline-none transition-all resize-none min-h-[120px] text-body-large"
                  />
                  <p className="text-body-small text-on-surface-variant">Powered by client-side WebLLM (Llama 3.2 1B). No API key needed.</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-title-small font-bold text-on-surface">Email for automated reminders (optional)</label>
                  <div className="relative">
                    <MaterialIcon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input 
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-surface-container-low text-on-surface pl-12 pr-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-0 outline-none transition-all text-body-large"
                    />
                  </div>
                </div>

                {loading && aiProgressStatus && (
                  <div className="p-3 bg-primary-container text-on-primary-container rounded-xl text-body-small flex items-center gap-2">
                    <MaterialIcon name="sync" className="animate-spin text-primary" />
                    <span className="font-medium">{aiProgressStatus}</span>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4">
                  <button 
                    onClick={() => setIsAddingGoal(false)}
                    disabled={loading}
                    className="px-6 py-3 rounded-xl font-bold text-title-small text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={generatePlan}
                    disabled={loading || !goalPrompt}
                    className="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-title-small hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm min-w-[160px]"
                  >
                    {loading ? (
                      <>
                        <MaterialIcon name="autorenew" className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <MaterialIcon name="auto_awesome" />
                        Generate Plan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day View Modal */}
      <AnimatePresence>
        {selectedEventDate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedEventDate(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface-container-lowest w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl border border-outline-variant flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-outline-variant flex justify-between items-center shrink-0">
                <h3 className="text-headline-small font-bold text-on-surface">
                  {format(parseISO(selectedEventDate), 'MMMM d, yyyy')}
                </h3>
                <button onClick={() => setSelectedEventDate(null)} className="p-2.5 bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors shrink-0">
                  <MaterialIcon name="close" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Deadlines */}
                {plans.filter(p => p.main_deadline === selectedEventDate).length > 0 && (
                  <div>
                    <h4 className="text-label-large font-bold text-on-surface-variant uppercase tracking-wider mb-3">Deadlines Today</h4>
                    <div className="space-y-3">
                      {plans.filter(p => p.main_deadline === selectedEventDate).map(p => (
                        <div key={`dl-${p.id}`} className="flex items-center gap-4 p-4 bg-primary text-on-primary rounded-xl shadow-sm">
                          <div className="p-2 bg-white/20 rounded-full shrink-0">
                            <MaterialIcon name="emoji_events" className="text-title-medium" />
                          </div>
                          <p className="font-bold text-title-medium">{p.goal_title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Steps */}
                <div>
                  <h4 className="text-label-large font-bold text-on-surface-variant uppercase tracking-wider mb-3">Action Steps</h4>
                  <div className="space-y-3">
                    {plans.map(p => {
                      const stepsForDay = p.steps.filter(s => s.scheduled_date === selectedEventDate);
                      if (stepsForDay.length === 0) return null;
                      
                      return (
                        <div key={`plan-steps-${p.id}`} className="space-y-2">
                          <p className="text-body-small font-semibold text-primary px-1">{p.goal_title}</p>
                          {stepsForDay.map(step => (
                            <div 
                              key={step.id} 
                              className={`flex flex-col gap-2 p-4 border-2 rounded-xl transition-all ${
                                step.completed 
                                  ? 'border-outline-variant bg-surface-container-low/50' 
                                  : 'border-outline-variant bg-surface-container-lowest shadow-sm'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div 
                                  onClick={() => toggleStep(p.id, step.id)}
                                  className={`mt-0.5 shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer ${
                                  step.completed 
                                    ? 'bg-primary border-primary text-on-primary' 
                                    : 'border-outline-variant text-transparent hover:border-primary'
                                }`}>
                                  <MaterialIcon name="check" className="text-body-small" />
                                </div>
                                <div className="flex-1 flex gap-2">
                                  <input 
                                    type="text"
                                    value={step.task}
                                    onChange={(e) => editStepTitle(p.id, step.id, e.target.value)}
                                    className={`flex-1 font-bold text-body-large bg-transparent outline-none border-b border-transparent focus:border-primary transition-all ${
                                      step.completed ? 'text-on-surface-variant line-through' : 'text-on-surface'
                                    }`}
                                  />
                                  <button onClick={() => deleteStep(p.id, step.id)} className="text-on-surface-variant hover:text-error transition-colors p-1">
                                    <MaterialIcon name="delete" className="text-[18px]" />
                                  </button>
                                </div>
                              </div>
                              <div className="pl-9 flex items-center gap-2">
                                <span className="text-body-small text-on-surface-variant font-medium">Reschedule:</span>
                                <input 
                                  type="date" 
                                  value={step.scheduled_date}
                                  onChange={e => changeStepDate(p.id, step.id, e.target.value)}
                                  className="text-body-small bg-surface-container-low border border-outline-variant rounded-md px-2 py-1 text-on-surface outline-none focus:border-primary"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    
                    {plans.flatMap(p => p.steps).filter(s => s.scheduled_date === selectedEventDate).length === 0 && (
                      <div className="text-center py-8 px-4 bg-surface-container-low rounded-xl">
                        <MaterialIcon name="event_available" className="text-headline-small text-on-surface-variant mb-2" />
                        <p className="text-body-medium text-on-surface-variant">No tasks scheduled for today.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
