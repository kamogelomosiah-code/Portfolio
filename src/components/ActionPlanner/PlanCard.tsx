// src/components/ActionPlanner/PlanCard.tsx
import React, { useState } from 'react';
import { Plan, Step } from '../../types/planner';
import { motion } from 'motion/react';
import { Calendar, Clock, Plus, Trash2, CheckCircle2, ChevronRight, Edit2 } from 'lucide-react';

interface Props {
  plan: Plan;
  onConfirm: (plan: Plan) => void;
  onEdit: (plan: Plan) => void;
  loading: boolean;
}

export const PlanCard: React.FC<Props> = ({ plan, onConfirm, onEdit, loading }) => {
  const [localSteps, setLocalSteps] = useState<Step[]>(plan.steps);

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
      frequency: 'daily',
      duration_minutes: 15,
      completed: false,
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
      className="max-w-3xl mx-auto w-full bg-surface border-2 border-outline-variant/60 rounded-[28px] shadow-sm p-6 sm:p-8 flex flex-col gap-6"
    >
      <div className="border-b-2 border-primary pb-4">
        <div className="flex items-center gap-2 text-primary font-semibold text-label-small uppercase tracking-wider mb-1">
          <span>🎯 Strategic Blueprint</span>
        </div>
        <h2 className="text-display-small font-bold text-on-background tracking-tight">
          {plan.goal_summary}
        </h2>
        <p className="text-body-medium text-on-surface-variant mt-1">
          Configure, fine-tune, and verify your micro-habit roadmap before syncing with your Google account.
        </p>
      </div>

      <div className="space-y-4">
        {localSteps.map((step, idx) => (
          <div 
            key={step.id} 
            className="flex gap-4 items-start p-4 bg-surface-container/30 border border-outline-variant/50 rounded-2xl relative group"
          >
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0 mt-1">
              {idx + 1}
            </span>
            <div className="flex-1 space-y-3">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={step.action}
                  onChange={(e) => updateStep(idx, 'action', e.target.value)}
                  placeholder="Action Description"
                  className="flex-1 bg-transparent border-b-2 border-transparent focus:border-primary/50 text-on-background font-medium text-body-large py-0.5 focus:outline-none transition-colors"
                />
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 text-on-surface-variant bg-surface border border-outline-variant/60 rounded-xl px-3 py-1.5 text-body-small">
                  <Calendar size={14} className="text-primary" />
                  <select
                    value={step.frequency}
                    onChange={(e) => updateStep(idx, 'frequency', e.target.value as any)}
                    className="bg-transparent border-none text-on-background focus:outline-none text-body-small cursor-pointer font-medium"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-on-surface-variant bg-surface border border-outline-variant/60 rounded-xl px-3 py-1.5 text-body-small">
                  <Clock size={14} className="text-primary" />
                  <input
                    type="number"
                    value={step.duration_minutes}
                    onChange={(e) => updateStep(idx, 'duration_minutes', parseInt(e.target.value) || 5)}
                    className="w-12 bg-transparent text-on-background text-center focus:outline-none border-none font-medium text-body-small"
                    min={1}
                    max={180}
                  />
                  <span>mins</span>
                </div>

                <button
                  onClick={() => deleteStep(idx)}
                  disabled={localSteps.length <= 1}
                  className="ml-auto text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors border-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  title="Remove step"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-6 border-t border-outline-variant/40">
        <button
          onClick={addStep}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:text-on-background border-2 border-outline-variant hover:border-outline bg-transparent transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Add Custom Step
        </button>

        <div className="flex w-full sm:w-auto gap-3">
          <button
            onClick={() => onConfirm({ ...plan, steps: localSteps })}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer border-0 shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Syncing items...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Deploy to Google Workspace
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
