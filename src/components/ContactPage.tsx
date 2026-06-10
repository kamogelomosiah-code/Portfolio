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
      className="flex-1 h-full w-full bg-[#F9F9F9] text-black flex flex-col overflow-hidden relative"
    >
      {/* Top Navbar with Back Button */}
      <div className="w-full h-20 flex items-center justify-between px-4 sm:px-6 bg-[#F9F9F9] z-10 shrink-0 border-b border-gray-200/60">
        <div className="flex items-center gap-3 m-0 p-0">
          <button 
            onClick={onBackToChat}
            className="flex items-center justify-center w-10 h-10 border border-gray-200 bg-white hover:bg-gray-50 text-black transition-colors shadow-sm cursor-pointer shrink-0 m-0"
            style={{ borderRadius: '100%' }}
            title="Back to conversational agent"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-semibold text-lg text-black tracking-tight font-sans m-0 p-0">Get In Touch</h1>
        </div>
      </div>

      {/* Main Content Area - Flush on mobile, Card on desktop */}
      <div className="flex-1 overflow-y-auto w-full md:w-auto flex flex-col items-center pb-32 px-6 md:px-12 bg-white md:rounded-tl-2xl md:shadow-sm md:border md:border-gray-100 md:mx-4 md:mt-2 mx-0 mt-0 border-0 rounded-none shadow-none">
        <div className="w-full max-w-4xl pt-10 md:pt-14 font-sans">
          
          {/* Header Block inline within the sheet */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="text-accent" size={24} />
              <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Interactive Form</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-black mt-2 tracking-tight">
              Get In Touch
            </h1>
            <p className="text-gray-500 mt-4 text-base md:text-lg max-w-2xl leading-relaxed">
              Have a project, job opening, or opportunity? Drop me a line directly through this form, or reach out via email.
            </p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Information Column (col-span 1) */}
          <div className="flex flex-col gap-6">
            <div className="border border-gray-100 rounded-[20px] p-6 bg-gray-50/50 flex flex-col gap-4">
              <h3 className="text-sm font-display font-bold text-black uppercase tracking-wider">
                Direct Communication
              </h3>
              
              <div className="flex items-start gap-3 mt-2">
                <div className="p-2.5 bg-white border border-gray-100 rounded-full text-accent shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Email address</p>
                  <a href="mailto:kamogelomosiah@gmail.com" className="text-sm text-black font-semibold hover:text-accent transition-colors select-all">
                    kamogelomosiah@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 mt-2">
                <div className="p-2.5 bg-white border border-gray-100 rounded-full text-accent shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Domicile Location</p>
                  <p className="text-sm text-black font-semibold">
                    Johannesburg, South Africa
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-100 rounded-[20px] p-6 bg-white shadow-sm flex flex-col gap-3">
              <h4 className="text-xs text-black font-bold uppercase tracking-wider">
                Current availability
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Currently open to remote full-stack engineering contracts, startup contributions, and permanent roles.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                <span className="text-xs font-mono font-bold text-green-600">ONLINE // HIRING READY</span>
              </div>
            </div>
          </div>

          {/* Form Column (col-span 2) */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 border border-gray-100 rounded-[24px] p-6 md:p-8 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-xs font-bold uppercase text-gray-400">FullName *</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="E.g., Sarah Jenkins"
                    className="bg-gray-50 border border-gray-200 text-black px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all text-sm font-medium"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-xs font-bold uppercase text-gray-400">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@company.com"
                    className="bg-gray-50 border border-gray-200 text-black px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="subject" className="text-xs font-bold uppercase text-gray-400">Subject</label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Opportunity for Contract work / Permanent Hire"
                  className="bg-gray-50 border border-gray-200 text-black px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all text-sm font-medium"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-xs font-bold uppercase text-gray-400">Message Text *</label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Hi Kamo, let's schedule an introductory call to discuss..."
                  className="bg-gray-50 border border-gray-200 text-black px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all text-sm font-medium resize-none"
                />
              </div>

              {/* Action and feedback messaging */}
              <div className="flex flex-col gap-4 mt-2">
                <button
                  type="submit"
                  disabled={status === "submitting" || status === "success"}
                  className="w-full flex items-center justify-center gap-2 bg-black hover:bg-accent text-white py-4 rounded-xl disabled:bg-gray-200 disabled:text-gray-400 font-semibold text-sm transition-colors cursor-pointer"
                >
                  {status === "submitting" ? (
                    <span>Initiating Transit Lock...</span>
                  ) : (
                    <>
                      <span>Transmit Message</span> <Send size={14} />
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {status === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={16} />
                      <div className="text-xs">
                        <p className="font-bold">Message sent successfully!</p>
                        <p className="mt-0.5">Thank you for reaching out. I will get back to your query within 24 hours.</p>
                      </div>
                    </motion.div>
                  )}

                  {status === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-2.5"
                    >
                      <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={16} />
                      <div className="text-xs">
                        <p className="font-bold">Transmission Error</p>
                        <p className="mt-0.5">Please populate all required fields marked with an asterisk (*).</p>
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
