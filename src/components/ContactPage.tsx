import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Send, MapPin, ArrowLeft, CheckCircle2, AlertCircle, Menu, Phone, ExternalLink } from "lucide-react";
import type { ProfileData } from "../types/profile";

interface ContactPageProps {
  onBackToChat: () => void;
  onToggleDrawer?: () => void;
  profile?: ProfileData;
}

export default function ContactPage({ onBackToChat, onToggleDrawer, profile }: ContactPageProps) {
  const contactEmail = profile?.email || "kamogelomosiah@gmail.com";
  const contactLocation = profile?.location || "Johannesburg, South Africa";
  const contactPhone = profile?.phone || "";
  const contactAvailability =
    profile?.availability ||
    "Open to remote full-stack contracts, IT support roles, and permanent engineering positions.";
  const contactLinks = Array.isArray(profile?.links)
    ? profile.links.filter((l) => l?.label && l?.url && /^https?:\/\//i.test(l.url))
    : [];
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedMessage = formData.message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setErrorMessage("Please fill in all required fields (Name, Email, and Message).");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          subject: formData.subject.trim(),
          message: trimmedMessage,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setStatus("idle"), 6000);
    } catch (error: any) {
      console.error("Submission failed:", error);
      setErrorMessage(error.message || "Failed to deliver message. Please try again or reach out directly via email.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 6000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex-1 h-full w-full bg-background text-on-background flex flex-col overflow-hidden"
    >
      <header className="h-14 shrink-0 border-b border-outline-variant bg-surface px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {onToggleDrawer && (
            <button
              type="button"
              onClick={onToggleDrawer}
              className="md:hidden w-10 h-10 -ml-1 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors cursor-pointer shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={onBackToChat}
            className="inline-flex items-center gap-1.5 h-10 px-2.5 -ml-1 md:ml-0 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <span className="text-outline-variant select-none">/</span>
          <h1 className="text-sm sm:text-base font-semibold text-on-background truncate">Contact</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="w-full max-w-3xl mx-auto">
          <div className="mb-8 pb-6 border-b border-outline-variant">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-on-background">
              Get in Touch
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant mt-2 leading-relaxed max-w-xl">
              Have a project, role, or engineering inquiry? Send a message below or reach out directly via email.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-4">
              <div className="border border-outline-variant rounded-xl p-5 bg-surface flex flex-col gap-4">
                <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
                  Direct
                </h3>

                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-accent-ink shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-on-surface-variant">Email</p>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-sm text-accent-ink font-medium hover:underline break-all select-all"
                    >
                      {contactEmail}
                    </a>
                  </div>
                </div>

                {contactPhone && (
                  <div className="flex items-start gap-3">
                    <Phone size={16} className="text-accent-ink shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-on-surface-variant">Phone</p>
                      <p className="text-sm text-on-background font-medium font-mono">
                        {contactPhone}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-accent-ink shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-on-surface-variant">Location</p>
                    <p className="text-sm text-on-background font-medium">
                      {contactLocation}
                    </p>
                  </div>
                </div>

                {contactLinks.length > 0 && (
                  <div className="pt-2 border-t border-outline-variant flex flex-wrap gap-3">
                    {contactLinks.map((link, idx) => (
                      <a
                        key={`${link.label}-${idx}`}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline"
                      >
                        <span>{link.label}</span>
                        <ExternalLink size={12} />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-outline-variant rounded-xl p-5 bg-surface flex flex-col gap-2">
                <h4 className="font-mono text-xs uppercase tracking-[0.1em] text-on-surface-variant">
                  Availability
                </h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {contactAvailability}
                </p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 border border-outline-variant rounded-xl p-5 sm:p-6 bg-surface"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className="text-xs font-medium text-on-surface-variant">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jane Doe"
                      className="bg-background border border-outline-variant text-on-background px-3.5 h-11 rounded-lg focus:outline-none focus:border-primary text-sm placeholder:text-on-surface-variant/60"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-xs font-medium text-on-surface-variant">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="bg-background border border-outline-variant text-on-background px-3.5 h-11 rounded-lg focus:outline-none focus:border-primary text-sm placeholder:text-on-surface-variant/60"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="subject" className="text-xs font-medium text-on-surface-variant">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Contract inquiry / Permanent role"
                    className="bg-background border border-outline-variant text-on-background px-3.5 h-11 rounded-lg focus:outline-none focus:border-primary text-sm placeholder:text-on-surface-variant/60"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="message" className="text-xs font-medium text-on-surface-variant">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Hi Kamo, let's connect about..."
                    className="bg-background border border-outline-variant text-on-background px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-primary text-sm placeholder:text-on-surface-variant/60 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={status === "submitting" || status === "success"}
                    className="w-full sm:w-auto sm:self-end inline-flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-on-primary px-6 h-11 rounded-lg disabled:opacity-50 font-medium text-sm transition-opacity cursor-pointer"
                  >
                    {status === "submitting" ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send size={15} />
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {status === "success" && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="bg-surface-container-low border border-outline-variant text-on-background p-3.5 rounded-lg flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="text-accent-ink shrink-0 mt-0.5" size={18} />
                        <div className="text-xs sm:text-sm">
                          <p className="font-medium">Message sent</p>
                          <p className="text-on-surface-variant mt-0.5">
                            Thank you for reaching out. Kamogelo will reply shortly.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {status === "error" && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3.5 rounded-lg flex items-start gap-2.5"
                      >
                        <AlertCircle className="shrink-0 mt-0.5" size={18} />
                        <div className="text-xs sm:text-sm">
                          <p className="font-medium">Unable to send</p>
                          <p className="mt-0.5">{errorMessage}</p>
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
