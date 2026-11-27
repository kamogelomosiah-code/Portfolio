import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Code,
  LayoutList,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type {
  ProfileData,
  ProfileProject,
  ProfileEducation,
  ProfileExperience,
  ProfileLink,
  ProfileCustomNote,
} from "../types/profile";

interface ProfileDataPageProps {
  profile: ProfileData;
  onProfileSaved: (updated: ProfileData) => void;
  onBackToChat: () => void;
}

export default function ProfileDataPage({
  profile,
  onProfileSaved,
  onBackToChat,
}: ProfileDataPageProps) {
  const [adminMode, setAdminMode] = useState<"loading" | "unclaimed" | "claimed" | "env">("loading");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [editorMode, setEditorMode] = useState<"forms" | "json">("forms");
  const [draft, setDraft] = useState<ProfileData>(() => structuredClone(profile));
  const [rawJson, setRawJson] = useState<string>(() => JSON.stringify(profile, null, 2));
  const [jsonError, setJsonError] = useState<string>("");
  const [newSkill, setNewSkill] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(structuredClone(profile));
    setRawJson(JSON.stringify(profile, null, 2));
  }, [profile]);

  useEffect(() => {
    fetch("/api/admin/status")
      .then((res) => res.json())
      .then((data) => {
        setAdminMode(data.mode || "claimed");
      })
      .catch(() => setAdminMode("claimed"));
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) return;
    setIsAuthenticating(true);
    setAuthError("");

    try {
      const endpoint = adminMode === "unclaimed" ? "/api/admin/claim" : "/api/admin/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcodeInput }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        throw new Error(data.error || "Authentication failed.");
      }
      setAuthToken(data.token);
      if (data.mode) setAdminMode(data.mode);
      setPasscodeInput("");
    } catch (err: any) {
      setAuthError(err.message || "Unable to verify passcode.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const syncDraft = (next: ProfileData) => {
    setDraft(next);
    setRawJson(JSON.stringify(next, null, 2));
    setJsonError("");
  };

  const handleRawJsonChange = (value: string) => {
    setRawJson(value);
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setJsonError("Root value must be a JSON object.");
        return;
      }
      setDraft(parsed as ProfileData);
      setJsonError("");
    } catch (err: any) {
      setJsonError(err.message || "Invalid JSON syntax");
    }
  };

  const handleSave = async () => {
    if (!authToken) return;
    if (editorMode === "json" && jsonError) {
      setSaveState("error");
      setSaveMessage("Fix JSON syntax errors before saving.");
      return;
    }

    let payloadToSave = draft;
    if (editorMode === "json") {
      try {
        payloadToSave = JSON.parse(rawJson);
      } catch {
        setSaveState("error");
        setSaveMessage("Invalid JSON syntax.");
        return;
      }
    }

    setSaveState("saving");
    setSaveMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payloadToSave),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setAuthToken(null);
        throw new Error(data.error || "Session expired. Please unlock again.");
      }
      if (!res.ok) {
        throw new Error(data.error || `Save failed (${res.status})`);
      }

      if (data.profile) {
        onProfileSaved(data.profile);
      }
      setSaveState("saved");
      setSaveMessage("Saved to platform. The AI now uses this updated data.");
      setTimeout(() => setSaveState("idle"), 4000);
    } catch (err: any) {
      setSaveState("error");
      setSaveMessage(err.message || "Failed to save profile JSON.");
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      handleRawJsonChange(text);
      setEditorMode("json");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "me.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const links: ProfileLink[] = Array.isArray(draft.links) ? draft.links : [];
  const projects: ProfileProject[] = Array.isArray(draft.projects) ? draft.projects : [];
  const skills: string[] = Array.isArray(draft.skills) ? draft.skills : [];
  const education: ProfileEducation[] = Array.isArray(draft.education) ? draft.education : [];
  const experience: ProfileExperience[] = Array.isArray(draft.experience) ? draft.experience : [];
  const customNotes: ProfileCustomNote[] = Array.isArray(draft.customNotes) ? draft.customNotes : [];

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
          <button
            type="button"
            onClick={onBackToChat}
            className="inline-flex items-center gap-1.5 h-10 px-2.5 -ml-1 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <span className="text-outline-variant select-none">/</span>
          <h1 className="text-sm sm:text-base font-semibold text-on-background truncate">
            AI Knowledge &amp; JSON
          </h1>
        </div>

        {authToken && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === "saving" || (editorMode === "json" && Boolean(jsonError))}
              className="inline-flex items-center gap-1.5 bg-primary hover:opacity-90 text-on-primary px-3.5 h-9 rounded-lg text-xs sm:text-sm font-medium transition-opacity disabled:opacity-40 cursor-pointer whitespace-nowrap"
            >
              <Save size={14} />
              <span>{saveState === "saving" ? "Saving…" : "Save & Teach AI"}</span>
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-10">
        <div className="w-full max-w-3xl mx-auto">
          {!authToken ? (
            <div className="max-w-md mx-auto mt-8 border border-outline-variant rounded-xl bg-surface p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <Lock size={18} className="text-accent-ink" />
                <h2 className="text-lg font-semibold text-on-background">
                  {adminMode === "unclaimed" ? "Set Owner Passcode" : "Unlock Profile Data"}
                </h2>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-5">
                {adminMode === "unclaimed"
                  ? "Create a passcode (minimum 6 characters) to protect your profile JSON and AI knowledge editor."
                  : "Enter your owner passcode to edit your profile forms or JSON data that powers the AI assistant."}
              </p>

              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
                <input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder={adminMode === "unclaimed" ? "Choose passcode (6+ chars)" : "Enter owner passcode"}
                  minLength={6}
                  required
                  className="bg-background border border-outline-variant text-on-background px-3.5 h-11 rounded-lg focus:outline-none focus:border-primary text-sm"
                />
                {authError && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>{authError}</span>
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isAuthenticating || adminMode === "loading"}
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-on-primary h-11 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  <Unlock size={15} />
                  <span>
                    {isAuthenticating
                      ? "Verifying…"
                      : adminMode === "unclaimed"
                      ? "Set Passcode & Open Editor"
                      : "Unlock Editor"}
                  </span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-outline-variant">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-on-background tracking-tight">
                    Teach Your AI Assistant
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Add or update your profile details using the forms or raw JSON. Saved updates immediately shape AI answers on your behalf.
                  </p>
                </div>

                <div className="inline-flex items-center border border-outline-variant rounded-lg p-0.5 bg-surface self-start shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditorMode("forms")}
                    className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      editorMode === "forms"
                        ? "bg-surface-container text-on-background"
                        : "text-on-surface-variant hover:text-on-background"
                    }`}
                  >
                    <LayoutList size={14} />
                    <span>Forms</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode("json")}
                    className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      editorMode === "json"
                        ? "bg-surface-container text-on-background"
                        : "text-on-surface-variant hover:text-on-background"
                    }`}
                  >
                    <Code size={14} />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              {saveState === "saved" && (
                <div className="p-3.5 rounded-lg bg-surface border border-outline-variant flex items-center gap-2.5 text-sm">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>{saveMessage}</span>
                </div>
              )}

              {saveState === "error" && (
                <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center gap-2.5 text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{saveMessage}</span>
                </div>
              )}

              {editorMode === "json" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs text-on-surface-variant">me.json</span>
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        onChange={handleImportJson}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-outline-variant bg-surface text-xs font-medium hover:bg-surface-container cursor-pointer"
                      >
                        <Upload size={13} />
                        <span>Import JSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-outline-variant bg-surface text-xs font-medium hover:bg-surface-container cursor-pointer"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={rawJson}
                    onChange={(e) => handleRawJsonChange(e.target.value)}
                    rows={22}
                    spellCheck={false}
                    className="w-full font-mono text-xs sm:text-[13px] leading-relaxed p-4 rounded-xl border border-outline-variant bg-surface text-on-background focus:outline-none focus:border-primary resize-y"
                  />

                  {jsonError && (
                    <p className="text-xs text-red-500 font-mono">{jsonError}</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* 1. Identity & Bio */}
                  <section className="border border-outline-variant rounded-xl bg-surface p-5 flex flex-col gap-4">
                    <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-accent-ink">
                      Identity &amp; Summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-on-surface-variant">Full Name</label>
                        <input
                          type="text"
                          value={draft.name || ""}
                          onChange={(e) => syncDraft({ ...draft, name: e.target.value })}
                          className="bg-background border border-outline-variant px-3 h-10 rounded-lg text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-on-surface-variant">Nickname</label>
                        <input
                          type="text"
                          value={draft.nickname || ""}
                          onChange={(e) => syncDraft({ ...draft, nickname: e.target.value })}
                          className="bg-background border border-outline-variant px-3 h-10 rounded-lg text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-on-surface-variant">Profession / Headline</label>
                        <input
                          type="text"
                          value={draft.profession || ""}
                          onChange={(e) => syncDraft({ ...draft, profession: e.target.value })}
                          className="bg-background border border-outline-variant px-3 h-10 rounded-lg text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-on-surface-variant">Availability</label>
                        <input
                          type="text"
                          value={draft.availability || ""}
                          onChange={(e) => syncDraft({ ...draft, availability: e.target.value })}
                          placeholder="Available immediately..."
                          className="bg-background border border-outline-variant px-3 h-10 rounded-lg text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant">Overview / Bio</label>
                      <textarea
                        rows={3}
                        value={draft.overview || ""}
                        onChange={(e) => syncDraft({ ...draft, overview: e.target.value })}
                        className="bg-background border border-outline-variant p-3 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                      />
                    </div>
                  </section>

                  {/* 2. Find & Contact Me */}
                  <section className="border border-outline-variant rounded-xl bg-surface p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-accent-ink">
                        Find &amp; Contact Me
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          syncDraft({
                            ...draft,
                            links: [...links, { label: "", url: "" }],
                          })
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Add Link</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-on-surface-variant">Email</label>
                        <input
                          type="email"
                          value={draft.email || ""}
                          onChange={(e) => syncDraft({ ...draft, email: e.target.value })}
                          className="bg-background border border-outline-variant px-3 h-10 rounded-lg text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-on-surface-variant">Phone</label>
                        <input
                          type="text"
                          value={draft.phone || ""}
                          onChange={(e) => syncDraft({ ...draft, phone: e.target.value })}
                          className="bg-background border border-outline-variant px-3 h-10 rounded-lg text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-on-surface-variant">Location</label>
                        <input
                          type="text"
                          value={draft.location || ""}
                          onChange={(e) => syncDraft({ ...draft, location: e.target.value })}
                          className="bg-background border border-outline-variant px-3 h-10 rounded-lg text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {links.map((link, i) => (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-2 items-center">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => {
                            const updated = [...links];
                            updated[i] = { ...updated[i], label: e.target.value };
                            syncDraft({ ...draft, links: updated });
                          }}
                          placeholder="Label (e.g. GitHub)"
                          className="bg-background border border-outline-variant px-3 h-10 rounded-lg text-sm focus:outline-none focus:border-primary"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => {
                            const updated = [...links];
                            updated[i] = { ...updated[i], url: e.target.value };
                            syncDraft({ ...draft, links: updated });
                          }}
                          placeholder="https://..."
                          className="bg-background border border-outline-variant px-3 h-10 rounded-lg text-sm focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => syncDraft({ ...draft, links: links.filter((_, idx) => idx !== i) })}
                          className="w-10 h-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-red-500 hover:bg-surface-container cursor-pointer"
                          aria-label="Remove link"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </section>

                  {/* 3. Custom Facts / Teach AI */}
                  <section className="border border-outline-variant rounded-xl bg-surface p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-accent-ink">
                          Custom Facts &amp; Answers
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Add topics, answers, or instructions the AI should know when speaking for you.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          syncDraft({
                            ...draft,
                            customNotes: [...customNotes, { topic: "", content: "" }],
                          })
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline cursor-pointer shrink-0"
                      >
                        <Plus size={14} />
                        <span>Add Fact</span>
                      </button>
                    </div>

                    {customNotes.length === 0 ? (
                      <p className="text-xs text-on-surface-variant">
                        No custom facts added yet. Click &ldquo;Add Fact&rdquo; to teach the AI extra details (e.g. rates, preferred roles, hobbies, or FAQs).
                      </p>
                    ) : (
                      customNotes.map((note, i) => (
                        <div key={i} className="border border-outline-variant rounded-lg p-3.5 flex flex-col gap-2.5 bg-surface-container-low">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={note.topic}
                              onChange={(e) => {
                                const updated = [...customNotes];
                                updated[i] = { ...updated[i], topic: e.target.value };
                                syncDraft({ ...draft, customNotes: updated });
                              }}
                              placeholder="Topic / Question (e.g. Remote Work, Salary, Consulting)"
                              className="flex-1 bg-background border border-outline-variant px-3 h-9 rounded-lg text-sm focus:outline-none focus:border-primary"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                syncDraft({
                                  ...draft,
                                  customNotes: customNotes.filter((_, idx) => idx !== i),
                                })
                              }
                              className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-red-500 cursor-pointer"
                              aria-label="Remove fact"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={note.content}
                            onChange={(e) => {
                              const updated = [...customNotes];
                              updated[i] = { ...updated[i], content: e.target.value };
                              syncDraft({ ...draft, customNotes: updated });
                            }}
                            placeholder="What the AI should share on your behalf..."
                            className="bg-background border border-outline-variant p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                          />
                        </div>
                      ))
                    )}
                  </section>

                  {/* 4. Projects */}
                  <section className="border border-outline-variant rounded-xl bg-surface p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-accent-ink">
                        Projects
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          syncDraft({
                            ...draft,
                            projects: [...projects, { name: "", url: "", stack: "", description: "" }],
                          })
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Add Project</span>
                      </button>
                    </div>

                    {projects.map((proj, i) => (
                      <div key={i} className="border border-outline-variant rounded-lg p-3.5 flex flex-col gap-2.5 bg-surface-container-low">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={proj.name}
                            onChange={(e) => {
                              const updated = [...projects];
                              updated[i] = { ...updated[i], name: e.target.value };
                              syncDraft({ ...draft, projects: updated });
                            }}
                            placeholder="Project name"
                            className="bg-background border border-outline-variant px-3 h-9 rounded-lg text-sm focus:outline-none focus:border-primary"
                          />
                          <input
                            type="url"
                            value={proj.url || ""}
                            onChange={(e) => {
                              const updated = [...projects];
                              updated[i] = { ...updated[i], url: e.target.value };
                              syncDraft({ ...draft, projects: updated });
                            }}
                            placeholder="https://..."
                            className="bg-background border border-outline-variant px-3 h-9 rounded-lg text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                        <input
                          type="text"
                          value={proj.stack}
                          onChange={(e) => {
                            const updated = [...projects];
                            updated[i] = { ...updated[i], stack: e.target.value };
                            syncDraft({ ...draft, projects: updated });
                          }}
                          placeholder="Tech stack (e.g. TypeScript, React, PostgreSQL)"
                          className="bg-background border border-outline-variant px-3 h-9 rounded-lg text-sm focus:outline-none focus:border-primary"
                        />
                        <div className="flex items-start gap-2">
                          <textarea
                            rows={2}
                            value={proj.description}
                            onChange={(e) => {
                              const updated = [...projects];
                              updated[i] = { ...updated[i], description: e.target.value };
                              syncDraft({ ...draft, projects: updated });
                            }}
                            placeholder="Short description..."
                            className="flex-1 bg-background border border-outline-variant p-2.5 rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                          />
                          <button
                            type="button"
                            onClick={() => syncDraft({ ...draft, projects: projects.filter((_, idx) => idx !== i) })}
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-red-500 cursor-pointer shrink-0"
                            aria-label="Remove project"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </section>

                  {/* 5. Skills */}
                  <section className="border border-outline-variant rounded-xl bg-surface p-5 flex flex-col gap-3">
                    <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-accent-ink">
                      Skills
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (!newSkill.trim()) return;
                            syncDraft({ ...draft, skills: [...skills, newSkill.trim()] });
                            setNewSkill("");
                          }
                        }}
                        placeholder="Add a skill or capability..."
                        className="flex-1 bg-background border border-outline-variant px-3 h-10 rounded-lg text-sm focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newSkill.trim()) return;
                          syncDraft({ ...draft, skills: [...skills, newSkill.trim()] });
                          setNewSkill("");
                        }}
                        className="px-4 h-10 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-surface-container text-sm font-medium cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                    <div className="divide-y divide-outline-variant border border-outline-variant rounded-lg">
                      {skills.map((skill, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                          <span className="flex-1">{skill}</span>
                          <button
                            type="button"
                            onClick={() => syncDraft({ ...draft, skills: skills.filter((_, idx) => idx !== i) })}
                            className="p-1 text-on-surface-variant hover:text-red-500 cursor-pointer"
                            aria-label="Remove skill"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 6. Education & Experience */}
                  <section className="border border-outline-variant rounded-xl bg-surface p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-mono text-xs uppercase tracking-[0.1em] text-accent-ink">
                        Education &amp; Experience
                      </h3>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            syncDraft({
                              ...draft,
                              education: [...education, { degree: "", years: "", institution: "", details: "" }],
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Education</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            syncDraft({
                              ...draft,
                              experience: [...experience, { title: "", year: "", company: "", details: "" }],
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Experience</span>
                        </button>
                      </div>
                    </div>

                    {education.map((edu, i) => (
                      <div key={i} className="border border-outline-variant rounded-lg p-3.5 flex flex-col gap-2 bg-surface-container-low">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] text-on-surface-variant">Education #{i + 1}</span>
                          <button
                            type="button"
                            onClick={() => syncDraft({ ...draft, education: education.filter((_, idx) => idx !== i) })}
                            className="p-1 text-on-surface-variant hover:text-red-500 cursor-pointer"
                            aria-label="Remove education"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[i] = { ...updated[i], degree: e.target.value };
                            syncDraft({ ...draft, education: updated });
                          }}
                          placeholder="Degree / Qualification"
                          className="bg-background border border-outline-variant px-3 h-9 rounded-lg text-sm"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => {
                              const updated = [...education];
                              updated[i] = { ...updated[i], institution: e.target.value };
                              syncDraft({ ...draft, education: updated });
                            }}
                            placeholder="Institution"
                            className="bg-background border border-outline-variant px-3 h-9 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={edu.years}
                            onChange={(e) => {
                              const updated = [...education];
                              updated[i] = { ...updated[i], years: e.target.value };
                              syncDraft({ ...draft, education: updated });
                            }}
                            placeholder="Years (e.g. 2019 - 2024)"
                            className="bg-background border border-outline-variant px-3 h-9 rounded-lg text-sm"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={edu.details}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[i] = { ...updated[i], details: e.target.value };
                            syncDraft({ ...draft, education: updated });
                          }}
                          placeholder="Details..."
                          className="bg-background border border-outline-variant p-2.5 rounded-lg text-sm resize-none"
                        />
                      </div>
                    ))}

                    {experience.map((exp, i) => (
                      <div key={i} className="border border-outline-variant rounded-lg p-3.5 flex flex-col gap-2 bg-surface-container-low">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] text-on-surface-variant">Experience #{i + 1}</span>
                          <button
                            type="button"
                            onClick={() => syncDraft({ ...draft, experience: experience.filter((_, idx) => idx !== i) })}
                            className="p-1 text-on-surface-variant hover:text-red-500 cursor-pointer"
                            aria-label="Remove experience"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => {
                              const updated = [...experience];
                              updated[i] = { ...updated[i], title: e.target.value };
                              syncDraft({ ...draft, experience: updated });
                            }}
                            placeholder="Role title"
                            className="bg-background border border-outline-variant px-3 h-9 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => {
                              const updated = [...experience];
                              updated[i] = { ...updated[i], company: e.target.value };
                              syncDraft({ ...draft, experience: updated });
                            }}
                            placeholder="Company"
                            className="bg-background border border-outline-variant px-3 h-9 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={exp.year}
                            onChange={(e) => {
                              const updated = [...experience];
                              updated[i] = { ...updated[i], year: e.target.value };
                              syncDraft({ ...draft, experience: updated });
                            }}
                            placeholder="Year"
                            className="bg-background border border-outline-variant px-3 h-9 rounded-lg text-sm"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={exp.details}
                          onChange={(e) => {
                            const updated = [...experience];
                            updated[i] = { ...updated[i], details: e.target.value };
                            syncDraft({ ...draft, experience: updated });
                          }}
                          placeholder="Responsibilities and highlights..."
                          className="bg-background border border-outline-variant p-2.5 rounded-lg text-sm resize-none"
                        />
                      </div>
                    ))}
                  </section>

                  <div className="flex justify-end pb-4">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saveState === "saving"}
                      className="inline-flex items-center gap-2 bg-primary hover:opacity-90 text-on-primary px-6 h-11 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40 cursor-pointer"
                    >
                      <Save size={15} />
                      <span>{saveState === "saving" ? "Saving…" : "Save & Teach AI"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
