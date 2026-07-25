import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialIcon } from '../MaterialIcon';
import { Plan, Step } from '../../types/planner';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO } from 'date-fns';

type ViewMode = '2-week' | 'month';

interface ActionPlannerProps {
  onBackToChat?: () => void;
  onToggleDrawer?: () => void;
}

export default function ActionPlanner({ onBackToChat, onToggleDrawer }: ActionPlannerProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [addMode, setAddMode] = useState<'ai' | 'manual'>('ai');
  const [goalPrompt, setGoalPrompt] = useState('');
  const [email, setEmail] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDeadline, setManualDeadline] = useState('');
  const [manualPath, setManualPath] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedEventDate, setSelectedEventDate] = useState<string | null>(null);
  const [newStepTask, setNewStepTask] = useState('');
  const [selectedPlanForStep, setSelectedPlanForStep] = useState<string>('');
  
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('ai_action_plans');
    if (saved) {
      try {
        setPlans(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Auto Save to local storage
  useEffect(() => {
    localStorage.setItem('ai_action_plans', JSON.stringify(plans));
  }, [plans]);

  const handleManualSave = () => {
    localStorage.setItem('ai_action_plans', JSON.stringify(plans));
    showNotification("Action Planner data successfully saved!");
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plans, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `action_planner_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification("Exported backup JSON file!");
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setPlans(imported);
          localStorage.setItem('ai_action_plans', JSON.stringify(imported));
          showNotification("Imported plans successfully!");
        } else {
          alert("Invalid JSON format. Expected an array of plans.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const addManualGoal = () => {
    if (!manualTitle || !manualDeadline) return;
    const newPlan: Plan = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      goal_title: manualTitle,
      main_deadline: manualDeadline,
      path_of_least_resistance: manualPath || undefined,
      steps: [],
      reminders: []
    };
    setPlans(prev => [...prev, newPlan]);
    setManualTitle('');
    setManualDeadline('');
    setManualPath('');
    setIsAddingGoal(false);
    showNotification("New goal saved to Action Planner!");
  };

  const addStepToSelectedDate = () => {
    if (!newStepTask || !selectedEventDate) return;
    let targetPlanId = selectedPlanForStep;
    if (!targetPlanId && plans.length > 0) {
      targetPlanId = plans[0].id;
    }

    if (!targetPlanId) {
      // Create a default general goal if none exists
      const defaultGoalId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      const defaultPlan: Plan = {
        id: defaultGoalId,
        goal_title: "General Planner Tasks",
        main_deadline: selectedEventDate,
        steps: [
          {
            id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + 1),
            step_number: 1,
            task: newStepTask,
            scheduled_date: selectedEventDate,
            completed: false
          }
        ],
        reminders: []
      };
      setPlans(prev => [...prev, defaultPlan]);
    } else {
      setPlans(prev => prev.map(p => {
        if (p.id !== targetPlanId) return p;
        const newStep = {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          step_number: p.steps.length + 1,
          task: newStepTask,
          scheduled_date: selectedEventDate,
          completed: false
        };
        return { ...p, steps: [...p.steps, newStep] };
      }));
    }

    setNewStepTask('');
    showNotification("Task added to " + selectedEventDate);
  };

  const generatePlan = async () => {
    if (!goalPrompt || !email) return;
    setLoading(true);
    try {
      const existingGoals = plans.map(p => ({
        title: p.goal_title,
        deadline: p.main_deadline
      }));

      const res = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: goalPrompt, email, existingGoals })
      });
      const data = await res.json();
      if (data.success && data.goals) {
        setPlans(prev => [...prev, ...data.goals]);
        setIsAddingGoal(false);
        setGoalPrompt('');
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (planId: string, stepId: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      return {
        ...p,
        steps: p.steps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s)
      };
    }));
  };

  const changeStepDate = (planId: string, stepId: string, newDate: string) => {
    if (!newDate) return;
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      return {
        ...p,
        steps: p.steps.map(s => s.id === stepId ? { ...s, scheduled_date: newDate } : s)
      };
    }));
  };
  
  const deletePlan = (planId: string) => {
    if (confirm("Are you sure you want to delete this goal and all its steps?")) {
      setPlans(prev => prev.filter(p => p.id !== planId));
    }
  };

  const renderCalendar = () => {
    let start, end;
    if (viewMode === '2-week') {
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
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${viewMode === '2-week' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              onClick={() => setViewMode('2-week')}
            >2-Week</button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${viewMode === 'month' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              onClick={() => setViewMode('month')}
            >Month</button>
          </div>
          <h3 className="font-bold text-title-large text-on-surface">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentDate(addDays(currentDate, viewMode === '2-week' ? -14 : -30))}
              className="p-2 rounded-full border border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
            >
              <MaterialIcon name="chevron_left" />
            </button>
            <button 
              onClick={() => setCurrentDate(addDays(currentDate, viewMode === '2-week' ? 14 : 30))}
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
            const daySteps = plans.flatMap(p => p.steps.filter(s => s.scheduled_date === dateStr).map(s => ({ ...s, planTitle: p.goal_title })));
            
            const hasEvents = dayDeadlines.length > 0 || daySteps.length > 0;
            
            return (
              <div 
                key={i} 
                onClick={() => setSelectedEventDate(dateStr)}
                className={`min-h-[100px] md:min-h-[120px] p-2 border rounded-xl flex flex-col transition-all cursor-pointer
                  ${!isSameMonth(d, currentDate) && viewMode === 'month' ? 'bg-surface-container-low/30 border-outline-variant/30 text-on-surface-variant/50' : 'bg-surface border-outline-variant/70 text-on-surface'} 
                  ${isSameDay(d, new Date()) ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                  hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm
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
                  
                  {daySteps.map(step => (
                    <div key={`step-${step.id}`} className={`
                      text-[10px] md:text-xs p-1.5 px-2 rounded-md font-semibold truncate border 
                      ${step.completed ? 'bg-surface-container-high border-outline-variant text-on-surface-variant line-through' : 'bg-secondary/10 border-secondary/30 text-secondary'}
                    `} title={`${step.planTitle}: ${step.task}`}>
                      {step.task}
                    </div>
                  ))}
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
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#13131c] text-white border border-emerald-500/30 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MaterialIcon name="check" className="text-sm" />
            </div>
            <span className="text-sm font-semibold">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-surface-container-lowest sticky top-0 z-20">
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
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-headline-medium font-bold text-on-surface tracking-tight flex items-center gap-2">
                <MaterialIcon name="event_note" className="text-primary" />
                AI Action Calendar
              </h1>
              <p className="text-title-medium text-on-surface-variant mt-1">
                Your goals and daily actionable steps mapped out.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handleManualSave}
                className="flex items-center gap-1.5 bg-[#13131c] hover:bg-[#1a1a28] text-gray-200 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm border border-white/10 shadow-sm transition-all"
                title="Save plans to local storage"
              >
                <MaterialIcon name="save" className="text-primary text-base" />
                <span>Save Data</span>
              </button>

              <button 
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 bg-[#13131c] hover:bg-[#1a1a28] text-gray-200 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm border border-white/10 shadow-sm transition-all"
                title="Download JSON backup"
              >
                <MaterialIcon name="download" className="text-primary text-base" />
                <span>Export</span>
              </button>

              <label className="flex items-center gap-1.5 bg-[#13131c] hover:bg-[#1a1a28] text-gray-200 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm border border-white/10 shadow-sm transition-all cursor-pointer">
                <MaterialIcon name="upload" className="text-primary text-base" />
                <span>Import</span>
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>

              <button 
                onClick={() => setIsAddingGoal(true)}
                className="flex items-center justify-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
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

          {renderCalendar()}
        </div>
      </div>

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
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-headline-small font-bold text-on-surface">Plan New Goal</h2>
                  <p className="text-body-medium text-on-surface-variant mt-1">Add a goal manually or break down a prompt using AI.</p>
                </div>
                <button onClick={() => !loading && setIsAddingGoal(false)} className="p-2 bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors">
                  <MaterialIcon name="close" />
                </button>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex gap-2 p-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/30 mb-6">
                <button 
                  onClick={() => setAddMode('ai')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${addMode === 'ai' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  <MaterialIcon name="auto_awesome" className="text-base" />
                  AI Generator
                </button>
                <button 
                  onClick={() => setAddMode('manual')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${addMode === 'manual' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  <MaterialIcon name="edit" className="text-base" />
                  Manual Entry
                </button>
              </div>

              {addMode === 'ai' ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-title-small font-bold text-on-surface">What do you want to achieve?</label>
                    <textarea 
                      value={goalPrompt}
                      onChange={e => setGoalPrompt(e.target.value)}
                      placeholder="e.g., I want to run a marathon in 6 months, and I also need to finish my React course by next week."
                      className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-0 outline-none transition-all resize-none min-h-[120px] text-body-large"
                    />
                    <p className="text-body-small text-on-surface-variant">The AI will analyze your existing goals on the calendar to recommend the best timeline.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-title-small font-bold text-on-surface">Email for automated reminders</label>
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
                      disabled={loading || !goalPrompt || !email}
                      className="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-title-small hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm min-w-[160px]"
                    >
                      {loading ? (
                        <>
                          <MaterialIcon name="autorenew" className="animate-spin" />
                          Analyzing...
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
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-title-small font-bold text-on-surface">Goal Title *</label>
                    <input 
                      type="text"
                      value={manualTitle}
                      onChange={e => setManualTitle(e.target.value)}
                      placeholder="e.g., Build Portfolio Website"
                      className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-0 outline-none transition-all text-body-large"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-title-small font-bold text-on-surface">Target Deadline *</label>
                    <input 
                      type="date"
                      value={manualDeadline}
                      onChange={e => setManualDeadline(e.target.value)}
                      className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-0 outline-none transition-all text-body-large"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-title-small font-bold text-on-surface">Path of Least Resistance (Optional)</label>
                    <textarea 
                      value={manualPath}
                      onChange={e => setManualPath(e.target.value)}
                      placeholder="e.g., Focus on core features first, deploy early to Cloud Run, iterate on design later."
                      className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-0 outline-none transition-all resize-none min-h-[90px] text-body-large"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button 
                      onClick={() => setIsAddingGoal(false)}
                      className="px-6 py-3 rounded-xl font-bold text-title-small text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={addManualGoal}
                      disabled={!manualTitle || !manualDeadline}
                      className="flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-title-small hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm min-w-[140px]"
                    >
                      <MaterialIcon name="save" />
                      Save Goal
                    </button>
                  </div>
                </div>
              )}
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
                                <div className="flex-1">
                                  <p className={`font-bold text-body-large transition-all ${
                                    step.completed ? 'text-on-surface-variant line-through' : 'text-on-surface'
                                  }`}>
                                    {step.task}
                                  </p>
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
                      <div className="text-center py-6 px-4 bg-surface-container-low rounded-xl">
                        <MaterialIcon name="event_available" className="text-headline-small text-on-surface-variant mb-2" />
                        <p className="text-body-medium text-on-surface-variant">No tasks scheduled for today.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Task to Selected Date */}
                <div className="pt-4 border-t border-outline-variant/50 space-y-3">
                  <h4 className="text-label-large font-bold text-on-surface-variant uppercase tracking-wider">Add Task for {selectedEventDate}</h4>
                  
                  {plans.length > 1 && (
                    <select
                      value={selectedPlanForStep}
                      onChange={e => setSelectedPlanForStep(e.target.value)}
                      className="w-full bg-surface-container-low text-on-surface px-3 py-2 rounded-xl border border-outline-variant text-body-medium outline-none focus:border-primary"
                    >
                      <option value="">Select Goal (Defaults to first goal)</option>
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>{p.goal_title}</option>
                      ))}
                    </select>
                  )}

                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newStepTask}
                      onChange={e => setNewStepTask(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addStepToSelectedDate()}
                      placeholder="e.g., Review module 3 notes..."
                      className="flex-1 bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-xl border border-outline-variant text-body-medium outline-none focus:border-primary"
                    />
                    <button 
                      onClick={addStepToSelectedDate}
                      disabled={!newStepTask}
                      className="bg-primary text-on-primary px-4 py-2.5 rounded-xl font-bold text-body-medium hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm flex items-center gap-1 shrink-0"
                    >
                      <MaterialIcon name="add" />
                      Add
                    </button>
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
