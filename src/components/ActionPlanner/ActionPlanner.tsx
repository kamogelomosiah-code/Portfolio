// src/components/ActionPlanner/ActionPlanner.tsx
import React, { useState } from 'react';
import { GoalInput } from './GoalInput';
import { PlanCard } from './PlanCard';
import { Plan, Step } from '../../types/planner';
import { motion, AnimatePresence } from 'motion/react';
import { Target, ShieldAlert, Sparkles, Calendar, ArrowLeft, Mail, CheckCircle, ExternalLink, Menu, FileText, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [expandedStepMail, setExpandedStepMail] = useState<string | null>(null);
  const [resendingStepId, setResendingStepId] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleGenerate = async (goalText: string, emailText: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalText, email: emailText }),
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
    setLoading(true);
    setError(null);
    setStep('syncing');
    try {
      const res = await fetch('/api/planner/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: confirmedPlan }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Email dispatch failed');
      setPlan(data.plan);
      setStep('tracking');
    } catch (err: any) {
      setError(err.message || 'Could not dispatch plan steps to your email. Please try again.');
      setStep('editing');
    } finally {
      setLoading(false);
    }
  };

  const handleResendSingleEmail = async (stepItem: Step) => {
    if (!plan) return;
    setResendingStepId(stepItem.id);
    setResendStatus(null);
    try {
      const res = await fetch('/api/planner/send-step-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: plan.email,
          goal_summary: plan.goal_summary,
          step: stepItem
        })
      });
      const data = await res.json();
      if (data.success) {
        setResendStatus(`Successfully resent step email to ${plan.email}!`);
        if (data.previewUrl) {
          setPlan(prev => {
            if (!prev) return null;
            return {
              ...prev,
              steps: prev.steps.map(s => s.id === stepItem.id ? { ...s, preview_url: data.previewUrl } : s)
            };
          });
        }
      } else {
        throw new Error(data.error || 'Direct mail dispatch failed');
      }
    } catch (err: any) {
      setResendStatus(`Error sending email: ${err.message}`);
    } finally {
      setResendingStepId(null);
      setTimeout(() => setResendStatus(null), 4000);
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
              AI Action Planner &reg;
            </h1>
          </div>
          {step !== 'input' && (
            <button
              onClick={() => {
                setStep('input');
                setError(null);
                setExpandedStepMail(null);
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
          {/* Instructions Block */}
          {step === 'input' && (
            <div className="flex flex-col gap-2 text-left">
              <h2 className="text-display-small font-bold text-on-background tracking-tight">
                Plan Strategically. Achieve Effortlessly.
              </h2>
              <p className="text-body-medium text-on-surface-variant max-w-2xl leading-relaxed">
                Enter your strategic goal and email address. CodeMind Assistant will break your goal down into step-by-step phases, map out a custom chronological schedule, and immediately dispatch beautiful action guides directly to your inbox.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="w-full p-4 bg-red-500/10 border-2 border-red-500/25 rounded-2xl text-red-600 dark:text-red-400 text-body-medium flex items-start gap-3 shadow-sm text-left">
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
                  <h3 className="font-bold text-title-large text-on-background mb-1">Dispatching Your Roadmap</h3>
                  <p className="text-body-medium text-center max-w-md">
                    Formatting customized coaching content, handshaking with secure mail server, and sending step-by-step guidelines to your inbox...
                  </p>
                </motion.div>
              )}

              {step === 'tracking' && plan && (
                <motion.div 
                  key="tracking" 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="p-6 sm:p-8 bg-surface border-2 border-primary/20 rounded-[28px] shadow-lg flex flex-col gap-6 max-w-2xl mx-auto w-full text-left"
                >
                  <div className="flex items-center gap-4 border-b border-outline-variant/50 pb-4">
                    <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 shrink-0">
                      <CheckCircle size={32} />
                    </div>
                    <div>
                      <h3 className="text-headline-small font-bold text-on-background">Roadmap Dispatched!</h3>
                      <p className="text-body-small text-on-surface-variant mt-0.5">
                        Coaching blueprint emails successfully generated and sent to <strong className="text-on-background font-semibold">{plan.email}</strong>.
                      </p>
                    </div>
                  </div>

                  {resendStatus && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary font-medium text-body-small">
                      {resendStatus}
                    </div>
                  )}

                  {/* Mail Dispatch Dashboard / Chronological Outbox */}
                  <div className="space-y-3.5">
                    <h4 className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                      📬 Email Dispatch &amp; Timeframe Monitor
                    </h4>
                    
                    <div className="space-y-3">
                      {plan.steps.map((stepItem, idx) => {
                        const isExpanded = expandedStepMail === stepItem.id;
                        return (
                          <div 
                            key={stepItem.id} 
                            className="border border-outline-variant/60 bg-surface-container/20 rounded-xl p-4 transition-all"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="bg-green-500/10 text-green-600 border border-green-500/20 font-bold text-xs px-2.5 py-1 rounded-full shrink-0">
                                  {stepItem.timeframe}
                                </span>
                                <div className="text-left">
                                  <h5 className="font-semibold text-body-medium text-on-background leading-snug">
                                    {stepItem.action}
                                  </h5>
                                  <p className="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                                    <Mail size={11} className="text-primary" />
                                    Subject: <span className="font-medium italic text-on-background">{stepItem.email_subject}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 items-center ml-auto">
                                {stepItem.preview_url && (
                                  <a
                                    href={stepItem.preview_url}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="px-3 py-1.5 rounded-lg border-2 border-primary/20 text-primary hover:bg-primary/5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 no-underline shrink-0"
                                  >
                                    <ExternalLink size={12} />
                                    <span>Preview Email</span>
                                  </a>
                                )}
                                <button
                                  onClick={() => setExpandedStepMail(isExpanded ? null : stepItem.id)}
                                  className="px-3 py-1.5 rounded-lg border border-outline-variant hover:border-outline text-xs font-semibold text-on-surface-variant transition-colors bg-transparent cursor-pointer flex items-center gap-1"
                                >
                                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                  <span>{isExpanded ? 'Hide Mail' : 'Read Mail'}</span>
                                </button>
                                <button
                                  onClick={() => handleResendSingleEmail(stepItem)}
                                  disabled={resendingStepId === stepItem.id}
                                  className="px-3 py-1.5 rounded-lg bg-primary hover:opacity-90 disabled:opacity-50 text-xs font-semibold text-on-primary transition-all cursor-pointer border-0 shadow-sm flex items-center gap-1.5"
                                >
                                  {resendingStepId === stepItem.id ? (
                                    <div className="w-3 h-3 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                                  ) : (
                                    <Mail size={12} />
                                  )}
                                  <span>Resend</span>
                                </button>
                              </div>
                            </div>

                            {/* Expandable Simulated Email Body */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden mt-3 pt-3 border-t border-outline-variant/50"
                                >
                                  <div className="bg-surface text-on-surface p-5 rounded-xl border border-outline-variant shadow-inner font-sans max-h-80 overflow-y-auto">
                                    <div className="border-b border-outline-variant/50 pb-2 mb-3 text-xs text-on-surface-variant">
                                      <p><strong>From:</strong> Kamo's AI Goal Coach &lt;coach@kamoportfolio.io&gt;</p>
                                      <p><strong>To:</strong> {plan.email}</p>
                                      <p><strong>Subject:</strong> {stepItem.email_subject}</p>
                                    </div>
                                    <div 
                                      className="text-sm leading-relaxed prose prose-sm text-on-surface"
                                      dangerouslySetInnerHTML={{ __html: stepItem.email_body }}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Finished Action Options */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4 w-full sm:w-auto">
                    <button 
                      onClick={() => { setStep('input'); setPlan(null); setExpandedStepMail(null); }} 
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl border-2 border-outline-variant text-on-surface-variant hover:text-on-background hover:border-outline font-semibold bg-transparent transition-colors cursor-pointer"
                    >
                      + Track Another Goal
                    </button>
                    {onBackToChat && (
                      <button 
                        onClick={onBackToChat}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary hover:opacity-90 font-semibold cursor-pointer shadow-sm border-0 transition-opacity"
                      >
                        Back to Chat Interface
                      </button>
                    )}
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
