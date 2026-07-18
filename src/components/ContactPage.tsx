import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Send, MapPin, ArrowLeft, CheckCircle2, AlertCircle, Menu } from "lucide-react";

interface ContactPageProps {
  onBackToChat: () => void;
  onToggleDrawer?: () => void;
}

export default function ContactPage({ onBackToChat, onToggleDrawer }: ContactPageProps) {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }
    setStatus("submitting");
    
    try {
      // Format message
      const waText = `Hi Kamogelo,\n\nI am ${formData.name} (${formData.email}).\n\nSubject: ${formData.subject || 'Opportunity'}\n\n${formData.message}`;
      const emailBody = `Hi Kamogelo,\n\nI am ${formData.name} (${formData.email}).\n\n${formData.message}`;
      
      // Open WhatsApp
      window.open(`https://wa.me/27677426447?text=${encodeURIComponent(waText)}`, '_blank');
      
      // Open Mailto in the same window
      window.location.href = `mailto:kamogelomosiah@gmail.com?subject=${encodeURIComponent(formData.subject || 'Opportunity')}&body=${encodeURIComponent(emailBody)}`;
      
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setStatus("idle"), 5000);
    } catch (error) {
      console.error("Submission failed:", error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex-1 h-full w-full bg-background text-on-background flex flex-col overflow-hidden relative"
    >
      {/* Top Navbar with Back Button - Island Style */}
      <div className="absolute top-0 left-0 md:left-20 lg:left-[88px] right-0 z-30 flex justify-center transition-all duration-200 pointer-events-none pt-[calc(env(safe-area-inset-top)+12px)] sm:pt-[calc(env(safe-area-inset-top)+20px)] px-3 sm:px-4">
        <div className="flex items-center justify-between w-full transition-all duration-200 pointer-events-auto bg-surface/90 backdrop-blur-md rounded-xl shadow-md border-2 border-outline-variant/60 px-4 py-2 max-w-3xl">
          <div className="flex items-center gap-2 m-0 p-0">
            <h1 className="font-medium text-title-medium sm:text-title-large md:text-headline-small text-on-background tracking-normal font-display m-0 p-0 ml-1 py-1">Get In Touch</h1>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pb-32 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+88px)]">
        <div className="w-full max-w-4xl pt-4 sm:pt-8">
          
          {/* Header Block inline within the sheet */}
          <div className="mb-12">
            <h1 className="text-display-small md:text-[40px] font-medium text-on-background mt-2 tracking-normal font-display">
              Contact Me
            </h1>
            <p className="text-on-surface-variant mt-3 text-title-medium max-w-2xl leading-relaxed">
              Have a project, job opening, or opportunity? Drop me a line directly through this form, or reach out via email.
            </p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Information Column (col-span 1) */}
          <div className="flex flex-col gap-6">
            <div className="border-2 border-outline-variant shadow-sm rounded-[24px] p-6 bg-surface flex flex-col gap-4">
              <h3 className="text-body-medium font-medium text-on-surface-variant tracking-wide">
                Direct Communication
              </h3>
              
              <div className="flex items-start gap-4 mt-2">
                <div className="p-3 bg-primary-container rounded-full text-accent shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-label-medium text-on-surface-variant font-medium">Email address</p>
                  <a href="mailto:kamogelomosiah@gmail.com" className="text-body-medium text-primary font-medium hover:underline transition-colors select-all">
                    kamogelomosiah@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 mt-3">
                <div className="p-3 bg-primary-container rounded-full text-primary shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-label-medium text-on-surface-variant font-medium">Location</p>
                  <p className="text-body-medium text-on-background font-medium">
                    Johannesburg, South Africa
                  </p>
                </div>
              </div>
            </div>

            <div className="border-2 border-outline-variant shadow-sm rounded-[24px] p-6 bg-surface flex flex-col gap-3">
              <h4 className="text-body-medium text-primary font-medium tracking-wide">
                Availability
              </h4>
              <p className="text-body-medium text-on-background leading-relaxed">
                Currently open to remote full-stack engineering contracts, startup contributions, and permanent roles.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-body-small font-medium text-primary">Available Now</span>
              </div>
            </div>
          </div>

          {/* Form Column (col-span 2) */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 border-2 border-outline-variant shadow-sm rounded-[28px] p-6 md:p-8 bg-surface">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-body-small font-medium text-on-surface-variant">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="bg-background border-2 border-outline-variant text-on-background px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-primary transition-all text-title-small font-medium placeholder:font-normal placeholder:text-on-surface-variant"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-body-small font-medium text-on-surface-variant">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="bg-background border-2 border-outline-variant text-on-background px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-primary transition-all text-title-small font-medium placeholder:font-normal placeholder:text-on-surface-variant"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="subject" className="text-body-small font-medium text-on-surface-variant">Subject</label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Opportunity for Contract work / Permanent Hire"
                  className="bg-background border-2 border-outline-variant text-on-background px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-primary transition-all text-title-small font-medium placeholder:font-normal placeholder:text-on-surface-variant"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-body-small font-medium text-on-surface-variant">Message</label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Hi Kamo, let's schedule an introductory call to discuss..."
                  className="bg-background border-2 border-outline-variant text-on-background px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-primary transition-all text-title-small font-medium placeholder:font-normal placeholder:text-on-surface-variant resize-none"
                />
              </div>

              {/* Action and feedback messaging */}
              <div className="flex flex-col gap-4 mt-2">
                <button
                  type="submit"
                  disabled={status === "submitting" || status === "success"}
                  className="w-full md:w-auto self-end flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-on-primary dark:bg-white dark:text-primary px-8 py-3.5 rounded-full disabled:bg-[#F1F3F4] dark:disabled:bg-[#2C2C2C] disabled:text-[#9AA0A6] dark:disabled:text-[#5F5F5F] font-medium text-title-small transition-colors cursor-pointer border-0"
                >
                  {status === "submitting" ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <span>Send Message</span> <Send size={18} />
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {status === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-primary-container border-2 border-primary/20 text-on-background p-4 rounded-lg flex items-start gap-3"
                    >
                      <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-semibold text-body-medium">Message sent successfully</p>
                        <p className="mt-1 text-body-medium text-on-surface-variant">Thank you for reaching out. I will get back to your query within 24 hours.</p>
                      </div>
                    </motion.div>
                  )}

                  {status === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-500/10 border-2 border-red-500/20 text-red-600  p-4 rounded-lg flex items-start gap-3"
                    >
                      <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-semibold text-body-medium">Transmission Error</p>
                        <p className="mt-1 text-body-medium">Please ensure all required fields are filled correctly.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </div>
        </div>
      </div>
      </div>
      
      {/* Floating Bottom Navigation */}
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
          <button 
            onClick={onBackToChat}
            className="flex items-center justify-center gap-2 h-12 px-5 md:px-6 rounded-full hover:bg-background text-on-background transition-colors cursor-pointer border-0 bg-transparent"
            title="Back to Chat"
          >
            <ArrowLeft size={20} />
            <span className="font-medium text-title-small">Back to Chat</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
