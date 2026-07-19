// src/components/ActionPlanner/PlanCard.tsx
import React, { useState } from 'react';
import { Plan, Step } from '../../types/planner';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Plus, Trash2, CheckCircle2, ChevronDown, ChevronUp, Mail, Edit3, Calendar } from 'lucide-react';

interface Props {
  plan: Plan;
  onConfirm: (plan: Plan) => void;
  onEdit: (plan: Plan) => void;
  loading: boolean;
}

export const PlanCard: React.FC<Props> = ({ plan, onConfirm, onEdit, loading }) => {
  const [localSteps, setLocalSteps] = useState<Step[]>(plan.steps);
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>({});

  const toggleEmailExpand = (id: string) => {
    setExpandedEmails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateStep = (index: number, field: keyof Step, value: any) => {
    const newSteps = [...localSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setLocalSteps(newSteps);
    onEdit({ ...plan, steps: newSteps });
  };

  const addStep = () => {
    const newStep: Step = {
      id: Math.random().toString(36).substring(7),
      action: 'New strategic action step',
      timeframe: `Week ${localSteps.length + 1}`,
      duration_minutes: 15,
      completed: false,
      email_subject: `[Step ${localSteps.length + 1}] Coaching Update: New Action Item`,
      email_body: `<p>This is a custom action item added to your strategic plan. Keep pushing forward!</p>`,
      email_status: 'pending'
    };
    const newSteps = [...localSteps, newStep];
    setLocalSteps(newSteps);
    onEdit({ ...plan, steps: newSteps });
  };

  const deleteStep = (index: number) => {
    const newSteps = localSteps.filter((_, idx) => idx !== index);
    setLocalSteps(newSteps);
    onEdit({ ...plan, steps: newSteps });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto w-full bg-surface border-2 border-outline-variant/60 rounded-[28px] shadow-sm p-5 sm:p-8 flex flex-col gap-6 text-left"
    >
      {/* Header Info */}
      <div className="border-b-2 border-primary/20 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="bg-primary-container text-primary font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-full">
            🎯 Strategic Roadmap Draft
          </span>
          <span className="text-body-small text-on-surface-variant font-mono">
            Sending to: <strong className="text-on-background">{plan.email}</strong>
          </span>
        </div>
        <h2 className="text-display-small font-bold text-on-background tracking-tight">
          {plan.goal_summary}
        </h2>
        <div className="flex gap-2 items-center mt-2 text-primary font-medium text-body-medium">
          <Calendar size={16} />
          <span>Mapped Timeframe: <strong>{plan.timeframe_overview}</strong></span>
        </div>
        <p className="text-body-small text-on-surface-variant mt-2 leading-relaxed">
          The AI has organized your goal chronologically. Please configure and fine-tune your actions below. When confirmed, all step emails will be dispatched immediately.
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {localSteps.map((step, idx) => {
          const isExpanded = !!expandedEmails[step.id];
          return (
            <div 
              key={step.id} 
              className="border border-outline-variant/60 rounded-2xl bg-surface-container/10 p-4 transition-all hover:shadow-sm"
            >
              <div className="flex gap-4 items-start">
                {/* Step Index Circle */}
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0 mt-1">
                  {idx + 1}
                </span>

                <div className="flex-1 space-y-3">
                  {/* Action text input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      Step Action
                    </label>
                    <input
                      type="text"
                      value={step.action}
                      onChange={(e) => updateStep(idx, 'action', e.target.value)}
                      placeholder="e.g. Run code profiling and memory checks"
                      className="w-full bg-transparent border-b-2 border-outline-variant/30 focus:border-primary text-on-background font-semibold text-body-large py-1 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Timeframe & Duration & Controls */}
                  <div className="flex flex-wrap gap-2.5 items-center">
                    
                    {/* Timeframe designator */}
                    <div className="flex items-center gap-1.5 text-on-surface-variant bg-surface border border-outline-variant/60 rounded-xl px-3 py-1.5 text-body-small">
                      <span className="font-semibold text-[11px] text-primary uppercase">Schedule:</span>
                      <input
                        type="text"
                        value={step.timeframe}
                        onChange={(e) => updateStep(idx, 'timeframe', e.target.value)}
                        className="w-16 bg-transparent text-on-background focus:outline-none border-none font-semibold text-body-small"
                        title="Enter timeframe e.g. Week 1, Day 3"
                      />
                    </div>

                    {/* Duration input */}
                    <div className="flex items-center gap-1.5 text-on-surface-variant bg-surface border border-outline-variant/60 rounded-xl px-3 py-1.5 text-body-small">
                      <Clock size={13} className="text-primary" />
                      <input
                        type="number"
                        value={step.duration_minutes}
                        onChange={(e) => updateStep(idx, 'duration_minutes', parseInt(e.target.value) || 5)}
                        className="w-10 bg-transparent text-on-background text-center focus:outline-none border-none font-semibold text-body-small"
                        min={1}
                        max={180}
                      />
                      <span className="text-[11.5px]">mins</span>
                    </div>

                    {/* Email preview expander toggle */}
                    <button
                      type="button"
                      onClick={() => toggleEmailExpand(step.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-colors cursor-pointer text-xs font-semibold bg-transparent"
                    >
                      <Mail size={13} />
                      <span>{isExpanded ? 'Hide Email' : 'Preview Email'}</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {/* Trash Button */}
                    <button
                      onClick={() => deleteStep(idx)}
                      disabled={localSteps.length <= 1}
                      className="ml-auto text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors border-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove step"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Email Content Editor Expandable Section */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-3 pt-3 border-t border-outline-variant/50 flex flex-col gap-3 pl-12"
                  >
                    <div className="bg-surface border border-outline-variant/60 rounded-xl p-4 space-y-2.5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                          Email Subject
                        </label>
                        <input
                          type="text"
                          value={step.email_subject}
                          onChange={(e) => updateStep(idx, 'email_subject', e.target.value)}
                          className="w-full bg-transparent border-b border-outline-variant/40 focus:border-primary text-on-background font-medium text-body-medium focus:outline-none pb-1 transition-colors"
                        />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                          Email Body (HTML/Markdown support)
                        </label>
                        <textarea
                          value={step.email_body}
                          onChange={(e) => updateStep(idx, 'email_body', e.target.value)}
                          rows={6}
                          className="w-full bg-surface-container/30 border border-outline-variant/40 rounded-lg p-2 text-body-small font-mono text-on-background focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2 pt-6 border-t border-outline-variant/40">
        <button
          onClick={addStep}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:text-on-background border-2 border-outline-variant hover:border-outline bg-transparent transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Add Custom Step
        </button>

        <button
          onClick={() => onConfirm({ ...plan, steps: localSteps })}
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer border-0 shadow-sm"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              Dispatching Blueprint Emails...
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              Confirm &amp; Dispatch Roadmap
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};
