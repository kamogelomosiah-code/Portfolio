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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 5000);
      }
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
      className="flex-1 h-full w-full bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col overflow-hidden relative"
    >
      {/* Top Navbar with Back Button - Island Style */}
      <div className="absolute top-0 left-0 md:left-20 lg:left-[88px] right-0 z-30 flex justify-center transition-all duration-200 pointer-events-none pt-[calc(env(safe-area-inset-top)+12px)] sm:pt-[calc(env(safe-area-inset-top)+20px)] px-3 sm:px-4">
        <div className="flex items-center justify-between w-full transition-all duration-200 pointer-events-auto bg-[var(--bg-card)]/90 backdrop-blur-md rounded-full shadow-md border border-[var(--border-light)]/60 px-3 py-1.5 max-w-3xl">
          <div className="flex items-center gap-2 m-0 p-0">
            <button 
              onClick={onBackToChat}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:bg-black/5 text-[var(--text-muted)] transition-colors cursor-pointer shrink-0 m-0 border-0 bg-transparent"
              title="Back to conversational agent"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="font-medium text-[16px] sm:text-[18px] md:text-[20px] text-[var(--text-main)] tracking-normal font-display m-0 p-0 ml-1">Get In Touch</h1>
          </div>
          {onToggleDrawer && (
            <button 
              onClick={onToggleDrawer}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 text-[var(--text-muted)] transition-colors cursor-pointer shrink-0 border-0 bg-transparent"
              title="Open Menu"
            >
              <Menu size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pb-32 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+88px)]">
        <div className="w-full max-w-4xl pt-4 sm:pt-8">
          
          {/* Header Block inline within the sheet */}
          <div className="mb-12">
            <h1 className="text-[32px] md:text-[40px] font-medium text-[var(--text-main)] mt-2 tracking-normal font-display">
              Contact Me
            </h1>
            <p className="text-[var(--text-muted)] mt-3 text-[16px] max-w-2xl leading-relaxed">
              Have a project, job opening, or opportunity? Drop me a line directly through this form, or reach out via email.
            </p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Information Column (col-span 1) */}
          <div className="flex flex-col gap-6">
            <div className="border border-[var(--border-light)] shadow-sm rounded-[24px] p-6 bg-[var(--bg-card)] flex flex-col gap-4">
              <h3 className="text-[14px] font-medium text-[var(--text-muted)] tracking-wide">
                Direct Communication
              </h3>
              
              <div className="flex items-start gap-4 mt-2">
                <div className="p-3 bg-[var(--color-accent-light)] rounded-full text-accent shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[12px] text-[var(--text-muted)] font-medium">Email address</p>
                  <a href="mailto:kamogelomosiah@gmail.com" className="text-[14px] text-[var(--color-accent)] font-medium hover:underline transition-colors select-all">
                    kamogelomosiah@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 mt-3">
                <div className="p-3 bg-[var(--color-accent-light)] rounded-full text-[var(--color-accent)] shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[12px] text-[var(--text-muted)] font-medium">Location</p>
                  <p className="text-[14px] text-[var(--text-main)] font-medium">
                    Johannesburg, South Africa
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-[#CEEAD6] dark:border-[#137333]/30 shadow-sm rounded-[24px] p-6 bg-[#E6F4EA] dark:bg-[#137333]/10 flex flex-col gap-3">
              <h4 className="text-[14px] text-[#137333] dark:text-[#81C784] font-medium tracking-wide">
                Availability
              </h4>
              <p className="text-[14px] text-[#188038] dark:text-[#A8DAB5] leading-relaxed">
                Currently open to remote full-stack engineering contracts, startup contributions, and permanent roles.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse" />
                <span className="text-[13px] font-medium text-[#137333] dark:text-[#81C784]">Available Now</span>
              </div>
            </div>
          </div>

          {/* Form Column (col-span 2) */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 border border-[var(--border-light)] shadow-sm rounded-[28px] p-6 md:p-8 bg-[var(--bg-card)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-[13px] font-medium text-[var(--text-muted)]">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="bg-[var(--bg-main)] dark:bg-[#202124] border border-[var(--border-light)] text-[var(--text-main)] px-4 py-3 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all text-[15px] font-medium placeholder:font-normal placeholder:text-[var(--text-muted)]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-[13px] font-medium text-[var(--text-muted)]">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="bg-[var(--bg-main)] dark:bg-[#202124] border border-[var(--border-light)] text-[var(--text-main)] px-4 py-3 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all text-[15px] font-medium placeholder:font-normal placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="subject" className="text-[13px] font-medium text-[var(--text-muted)]">Subject</label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Opportunity for Contract work / Permanent Hire"
                  className="bg-[var(--bg-main)] dark:bg-[#202124] border border-[var(--border-light)] text-[var(--text-main)] px-4 py-3 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all text-[15px] font-medium placeholder:font-normal placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-[13px] font-medium text-[var(--text-muted)]">Message</label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Hi Kamo, let's schedule an introductory call to discuss..."
                  className="bg-[var(--bg-main)] dark:bg-[#202124] border border-[var(--border-light)] text-[var(--text-main)] px-4 py-3 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all text-[15px] font-medium placeholder:font-normal placeholder:text-[var(--text-muted)] resize-none"
                />
              </div>

              {/* Action and feedback messaging */}
              <div className="flex flex-col gap-4 mt-2">
                <button
                  type="submit"
                  disabled={status === "submitting" || status === "success"}
                  className="w-full md:w-auto self-end flex items-center justify-center gap-2 bg-[var(--accent-color)] hover:opacity-90 text-white px-8 py-3.5 rounded-full disabled:bg-[#F1F3F4] dark:disabled:bg-[#2C2C2C] disabled:text-[#9AA0A6] dark:disabled:text-[#5F5F5F] font-medium text-[15px] transition-colors cursor-pointer border-0"
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
                      className="bg-[#E6F4EA] dark:bg-[#137333]/20 border border-[#CEEAD6] dark:border-[#137333]/30 text-[#137333] dark:text-[#81C784] p-4 rounded-[16px] flex items-start gap-3"
                    >
                      <CheckCircle2 className="text-[var(--color-accent)] shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-medium text-[14px]">Message sent successfully</p>
                        <p className="mt-1 text-[14px]">Thank you for reaching out. I will get back to your query within 24 hours.</p>
                      </div>
                    </motion.div>
                  )}

                  {status === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-[#FCE8E6] dark:bg-[#C5221F]/15 border border-[#FAD2CF] dark:border-[#C5221F]/30 text-[#C5221F] dark:text-[#F28B82] p-4 rounded-[16px] flex items-start gap-3"
                    >
                      <AlertCircle className="text-[#D93025] dark:text-[#F28B82] shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-medium text-[14px]">Transmission Error</p>
                        <p className="mt-1 text-[14px]">Please ensure all required fields are filled correctly.</p>
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
    </motion.div>
  );
}
