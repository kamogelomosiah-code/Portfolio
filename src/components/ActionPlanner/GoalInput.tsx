// src/components/ActionPlanner/GoalInput.tsx
import React, { useState, useEffect } from 'react';
import { Target, Lightbulb, Sparkles, Mail } from 'lucide-react';

interface Props {
  onSubmit: (goal: string, email: string) => void;
  loading: boolean;
}

const SUGGESTIONS = [
  'Exercise 3 times a week, tracking sessions on calendar',
  'Journal daily for 10 minutes before sleeping',
  'Read one professional development book per month',
  'Meditate every morning at 7 AM for 15 minutes',
];

export const GoalInput: React.FC<Props> = ({ onSubmit, loading }) => {
  const [goal, setGoal] = useState('');
  const [email, setEmail] = useState('');

  // Pre-populate email from localStorage if available
  useEffect(() => {
    const savedEmail = localStorage.getItem('action_planner_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim().length >= 5 && email.trim().includes('@')) {
      localStorage.setItem('action_planner_email', email.trim());
      onSubmit(goal.trim(), email.trim());
    }
  };

  const isFormValid = goal.trim().length >= 5 && email.trim().includes('@');

  return (
    <div className="max-w-3xl mx-auto w-full">
      <form onSubmit={handleSubmit} className="relative bg-surface border-2 border-outline-variant/60 rounded-[28px] shadow-sm p-6 flex flex-col gap-4.5 transition-all focus-within:border-primary/50">
        
        {/* Email Input Field */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="flex gap-2 items-center text-on-background font-medium text-body-medium">
            <Mail size={18} className="text-primary" />
            <span>Coaching Email Address</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email to receive your step-by-step roadmap"
            disabled={loading}
            required
            className="w-full px-4 py-3 bg-surface border-2 border-outline-variant/50 focus:border-primary focus:outline-none rounded-xl text-body-medium sm:text-body-large transition-all"
          />
          <p className="text-[11px] text-on-surface-variant/70 leading-normal pl-1 font-sans">
            Your step-by-step guides and action items will be sent directly here right when they're generated.
          </p>
        </div>

        <div className="h-px bg-outline-variant/40 my-1" />

        {/* Goal Input Field */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="flex gap-2 items-center text-on-background font-medium text-body-medium">
            <Target size={18} className="text-primary" />
            <span>Enter Your Strategic Goal</span>
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What do you want to accomplish? e.g., 'I want to build a fitness habit by exercising 3 times a week, stretching daily, and reviewing progress'"
            rows={4}
            disabled={loading}
            required
            className="w-full px-4 py-3 bg-surface border-2 border-outline-variant/50 focus:border-primary focus:outline-none rounded-xl resize-y text-body-medium sm:text-body-large leading-relaxed font-sans transition-all"
          />
        </div>
        
        {/* Submit Action Block */}
        <div className="flex justify-end pt-3 border-t border-outline-variant/40">
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="flex items-center gap-2 bg-primary hover:opacity-90 disabled:opacity-50 text-on-primary font-semibold text-sm px-6 py-3 rounded-xl cursor-pointer shadow-sm border-0 transition-opacity"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Formulating Strategic Plan...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Step-by-Step Plan
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggestion block */}
      <div className="mt-8 bg-surface-container/50 border border-outline-variant/40 rounded-2xl p-5">
        <div className="flex items-center gap-2 text-primary font-medium text-body-medium mb-3">
          <Lightbulb size={18} className="text-yellow-500 fill-yellow-500/10" />
          <span>Need inspiration? Try clicking a goal suggestion:</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setGoal(s)}
              disabled={loading}
              className="px-4 py-2.5 bg-surface text-on-surface-variant rounded-xl text-left text-body-small sm:text-body-medium border-2 border-outline-variant/50 hover:border-primary/40 hover:text-on-background transition-all cursor-pointer hover:bg-surface-container-low"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
