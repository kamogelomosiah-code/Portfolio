// src/components/ActionPlanner/ActionPlanner.tsx
import React, { useState } from 'react';
import { GoogleConnectStatus } from './GoogleConnectStatus';
import { GoalInput } from './GoalInput';
import { PlanCard } from './PlanCard';
import { Plan } from '../../types/planner';
import { motion, AnimatePresence } from 'motion/react';
import { Target, ShieldAlert, Sparkles, Calendar, ClipboardCheck, ArrowLeft, Send, CheckCircle, Menu } from 'lucide-react';

type PlannerStep = 'input' | 'editing' | 'syncing' | 'tracking';

interface ActionPlannerProps {
  onBackToChat?: () => void;
  onToggleDrawer?: () => void;
}

export const ActionPlanner: React.FC<ActionPlannerProps> = ({ onBackToChat, onToggleDrawer }) => {
  const [step, setStep] = useState<PlannerStep>('input');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleTokenChange = (newToken: string | null) => {
    setToken(newToken);
  };

  const handleGenerate = async (goalText: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Generation failed');
      setPlan(data.plan);
      setStep('editing');
    } catch (err: any) {
      setError(err.message || 'Something went wrong while formulating the strategic blueprint.');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (confirmedPlan: Plan) => {
    if (!token) {
      setError('Please connect your Google Account before deploying your roadmap to Calendar/Tasks.');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('syncing');
    try {
      const res = await fetch('/api/planner/confirm', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: confirmedPlan }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Sync with Google Workspace failed');
      setPlan(data.plan);
      setStep('tracking');
    } catch (err: any) {
      setError(err.message || 'Could not deploy tasks to Google Workspace. Please check your credentials.');
      setStep('editing');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (updatedPlan: Plan) => {
    setPlan(updatedPlan);
  };

  return (
    <div className="flex-1 w-full bg-background text-on-background flex flex-col overflow-hidden relative">
      {/* Top Header Section */}
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-center pointer-events-none pt-[calc(env(safe-area-inset-top)+12px)] sm:pt-[calc(env(safe-area-inset-top)+20px)] px-4 sm:px-6">
        <div className="flex items-center justify-between w-full pointer-events-auto bg-surface/90 backdrop-blur-md rounded-xl shadow-md border-2 border-outline-variant/60 px-4 py-2.5 max-w-4xl">
          <div className="flex items-center gap-2 m-0 p-0">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-primary shrink-0">
              <Target size={18} />
            </div>
            <h1 className="font-medium text-title-medium sm:text-title-large text-on-background tracking-normal font-display m-0 p-0 ml-1">
              AI Action Planner
            </h1>
          </div>
          {step !== 'input' && (
            <button
              onClick={() => {
                setStep('input');
                setError(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-container/20 border-2 border-transparent hover:border-primary/20 rounded-lg cursor-pointer bg-transparent transition-all"
            >
              <ArrowLeft size={14} />
              Reset Plan
            </button>
          )}
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pb-32 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+88px)]">
        <div className="w-full max-w-3xl pt-4 sm:pt-8 flex flex-col gap-6">
          {/* Instructions and Google Status Box */}
          {step === 'input' && (
            <div className="flex flex-col gap-2">
              <h2 className="text-display-small font-bold text-on-background tracking-tight">
                Plan Strategically. Execute Effortlessly.
              </h2>
              <p className="text-body-medium text-on-surface-variant max-w-2xl">
                CodeMind Assistant maps complex goals into concrete scheduled steps and synchronizes them directly with your Google Calendar, Google Tasks, and delivers instant notifications via Gmail.
              </p>
            </div>
          )}

          <GoogleConnectStatus onTokenChange={handleTokenChange} />

          {/* Error Banner */}
          {error && (
            <div className="w-full p-4 bg-red-500/10 border-2 border-red-500/25 rounded-2xl text-red-600 dark:text-red-400 text-body-medium flex items-start gap-3 shadow-sm">
              <ShieldAlert size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Operation Alert:</span> {error}
              </div>
              <button 
                onClick={() => setError(null)} 
                className="text-red-500 hover:text-red-700 bg-transparent border-0 cursor-pointer font-bold text-body-large px-1"
              >
                ×
              </button>
            </div>
          )}

          {/* Dynamic Steps Container */}
          <div className="w-full">
            <AnimatePresence mode="wait">
              {step === 'input' && (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <GoalInput onSubmit={handleGenerate} loading={loading} />
                </motion.div>
              )}
              
              {step === 'editing' && plan && (
                <motion.div key="editing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <PlanCard plan={plan} onConfirm={handleConfirm} onEdit={handleEdit} loading={loading} />
                </motion.div>
              )}

              {step === 'syncing' && (
                <motion.div 
                  key="syncing" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-on-surface-variant bg-surface border-2 border-outline-variant/60 rounded-[28px] shadow-sm p-8"
                >
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                  <h3 className="font-bold text-title-large text-on-background mb-1">Synchronizing Blueprint</h3>
                  <p className="text-body-medium text-center max-w-md">
                    Provisioning tasks in Google Tasks and creating scheduled slots in Google Calendar...
                  </p>
                </motion.div>
              )}

              {step === 'tracking' && plan && (
                <motion.div 
                  key="tracking" 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="text-center p-8 bg-surface border-2 border-primary/20 rounded-[28px] shadow-lg flex flex-col items-center gap-4 max-w-2xl mx-auto w-full"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center text-green-600 mb-2">
                    <CheckCircle size={36} />
                  </div>
                  <h3 className="text-headline-small font-bold text-on-background">Strategized Successfully!</h3>
                  <p className="text-body-medium text-on-surface-variant max-w-md">
                    We've added <strong className="text-primary font-semibold">{plan.steps.length} roadmap items</strong> to your Google Calendar and structured your tasks under a brand new "CodeMind strategic plans" list.
                  </p>
                  
                  <div className="flex flex-wrap gap-4 justify-center mt-6 w-full sm:w-auto">
                    <button 
                      onClick={() => { setStep('input'); setPlan(null); }} 
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl border-2 border-outline-variant text-on-surface-variant hover:text-on-background hover:border-outline font-semibold bg-transparent transition-colors cursor-pointer"
                    >
                      + Track Another Goal
                    </button>
                    <a 
                      href="https://calendar.google.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary hover:opacity-90 font-semibold cursor-pointer shadow-sm no-underline border-0 transition-opacity"
                    >
                      <Calendar size={16} />
                      Verify in Google Calendar
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Floating Bottom Navigation */}
      {(onBackToChat || onToggleDrawer) && (
        <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto bg-surface/90 backdrop-blur-md rounded-full shadow-lg border-2 border-outline-variant/60 px-2 py-2">
            {onToggleDrawer && (
              <button 
                onClick={onToggleDrawer}
                className="md:hidden flex items-center justify-center w-12 h-12 rounded-full hover:bg-background text-on-background transition-colors cursor-pointer border-0 bg-transparent"
                title="Menu"
              >
                <Menu size={24} />
              </button>
            )}
            {onBackToChat && (
              <button 
                onClick={onBackToChat}
                className="flex items-center justify-center gap-2 h-12 px-5 md:px-6 rounded-full hover:bg-background text-on-background transition-colors cursor-pointer border-0 bg-transparent"
                title="Back to Chat"
              >
                <ArrowLeft size={20} />
                <span className="font-medium text-title-small">Back to Chat</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
