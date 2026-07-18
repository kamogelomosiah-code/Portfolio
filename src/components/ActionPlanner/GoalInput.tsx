// src/components/ActionPlanner/GoalInput.tsx
import React, { useState } from 'react';
import { Target, Lightbulb, Sparkles } from 'lucide-react';

interface Props {
  onSubmit: (text: string) => void;
  loading: boolean;
}

const SUGGESTIONS = [
  'Exercise 3 times a week, tracking sessions on calendar',
  'Journal daily for 10 minutes before sleeping',
  'Read one professional development book per month',
  'Meditate every morning at 7 AM for 15 minutes',
];

export const GoalInput: React.FC<Props> = ({ onSubmit, loading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length >= 5) onSubmit(text.trim());
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <form onSubmit={handleSubmit} className="relative bg-surface border-2 border-outline-variant/60 rounded-[24px] shadow-sm p-4 flex flex-col gap-3 transition-all focus-within:border-primary/50">
        <div className="flex gap-2 items-center text-primary border-b border-outline-variant/40 pb-2">
          <Target size={20} />
          <span className="font-semibold text-title-small">Enter Your Strategic Goal</span>
        </div>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What do you want to accomplish? e.g., 'I want to build a fitness habit by exercising 3 times a week, stretching daily, and reviewing progress'"
          rows={4}
          disabled={loading}
          className="w-full px-2 py-1 bg-transparent border-0 resize-y text-on-background placeholder:text-on-surface-variant/50 focus:outline-none text-body-medium sm:text-body-large leading-relaxed font-sans"
        />
        
        <div className="flex justify-end pt-2 border-t border-outline-variant/40">
          <button
            type="submit"
            disabled={loading || text.trim().length < 5}
            className="flex items-center gap-2 bg-primary hover:opacity-90 disabled:opacity-50 text-on-primary font-semibold text-sm px-6 py-2.5 rounded-xl cursor-pointer shadow-sm border-0 transition-opacity"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Breaking down goal...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Strategic Plan
              </>
            )}
          </button>
        </div>
      </form>

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
              onClick={() => setText(s)}
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
