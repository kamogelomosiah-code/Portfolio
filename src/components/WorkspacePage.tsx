import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, Calendar, FileText, Plus, Search, Trash2, Send, 
  CheckCircle2, AlertCircle, RefreshCw, Clock, MapPin, 
  User, ChevronRight, Menu, ArrowLeft, Loader2, Info
} from "lucide-react";
import { initAuth, googleSignIn, logout, getAccessToken } from "../lib/auth";
import type { User as FirebaseUser } from "firebase/auth";

interface WorkspacePageProps {
  onBackToChat: () => void;
  onToggleDrawer?: () => void;
}

type WorkspaceTab = "gmail" | "calendar" | "keep";

interface GmailMessage {
  id: string;
  sender: string;
  subject: string;
  date: string;
  snippet: string;
  body?: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
}

interface KeepNote {
  id: string;
  title: string;
  text: string;
  color?: string;
}

export default function WorkspacePage({ onBackToChat, onToggleDrawer }: WorkspacePageProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<WorkspaceTab>("gmail");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Gmail State
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);
  const [isComposingEmail, setIsComposingEmail] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  // Calendar State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventDuration, setEventDuration] = useState("60"); // minutes
  const [eventLocation, setEventLocation] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventAdding, setEventAdding] = useState(false);

  // Keep State
  const [keepNotes, setKeepNotes] = useState<KeepNote[]>([]);
  const [keepSearch, setKeepSearch] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [isKeepSandbox, setIsKeepSandbox] = useState(false);

  // Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch data whenever activeSubTab or token changes
  useEffect(() => {
    if (token) {
      fetchTabData();
    }
  }, [activeSubTab, token]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user')) {
        setErrorMsg("Sign in was cancelled.");
      } else {
        setErrorMsg("Failed to sign in. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setEmails([]);
      setEvents([]);
      setKeepNotes([]);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const fetchTabData = async () => {
    if (!token) return;
    setIsLoadingData(true);
    setErrorMsg(null);

    try {
      if (activeSubTab === "gmail") {
        await fetchGmail();
      } else if (activeSubTab === "calendar") {
        await fetchCalendar();
      } else if (activeSubTab === "keep") {
        await fetchKeep();
      }
    } catch (err: any) {
      console.error(`Error fetching ${activeSubTab} data:`, err);
      setErrorMsg(`Could not fetch your ${activeSubTab === "gmail" ? "Gmail inbox" : activeSubTab === "calendar" ? "Calendar schedule" : "Keep notes"}.`);
    } finally {
      setIsLoadingData(false);
    }
  };

  // ==================== GMAIL INTEGRATION ====================
  const fetchGmail = async () => {
    const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=6", {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!listRes.ok) {
      throw new Error(`Gmail API responded with ${listRes.status}`);
    }

    const listData = await listRes.json();
    if (!listData.messages || listData.messages.length === 0) {
      setEmails([]);
      return;
    }

    const details = await Promise.all(
      listData.messages.map(async (msg: any) => {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return detailRes.json();
      })
    );

    const parsedEmails = details.map((detail: any) => {
      const headers = detail.payload?.headers || [];
      const getHeader = (name: string) => {
        return headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "Unknown";
      };

      const fromVal = getHeader("from");
      // Clean up Sender format "Name <email@domain.com>" to just "Name" or "email@domain.com"
      const sender = fromVal.replace(/<.*>/, "").trim() || fromVal;

      return {
        id: detail.id,
        sender,
        subject: getHeader("subject") || "(No Subject)",
        date: new Date(getHeader("date")).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        snippet: detail.snippet || ""
      };
    });

    setEmails(parsedEmails);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo || !emailSubject || !emailBody || !token) return;

    const confirmed = window.confirm(
      `Send this email to ${emailTo}?`
    );
    if (!confirmed) return;

    setEmailSending(true);
    try {
      const emailContent = [
        `To: ${emailTo}`,
        `Subject: ${emailSubject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        emailBody
      ].join('\n');

      // Encode safe base64url string
      const base64Safe = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw: base64Safe })
      });

      if (!res.ok) {
        throw new Error("Failed to send email via Google API");
      }

      alert("Email sent successfully!");
      setIsComposingEmail(false);
      setEmailTo("");
      setEmailSubject("");
      setEmailBody("");
      fetchGmail();
    } catch (err) {
      console.error(err);
      alert("Error sending email. Please try again.");
    } finally {
      setEmailSending(false);
    }
  };

  // ==================== CALENDAR INTEGRATION ====================
  const fetchCalendar = async () => {
    const timeMin = new Date().toISOString();
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=8&orderBy=startTime&singleEvents=true&timeMin=${timeMin}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`Calendar API responded with ${res.status}`);
    }

    const data = await res.json();
    const parsedEvents = (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summary || "(No Title)",
      description: item.description,
      location: item.location,
      start: item.start?.dateTime || item.start?.date || "",
      end: item.end?.dateTime || item.end?.date || ""
    }));

    setEvents(parsedEvents);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate || !eventTime || !token) return;

    const confirmed = window.confirm(
      `Add event "${eventTitle}" on ${eventDate} at ${eventTime} to your Google Calendar?`
    );
    if (!confirmed) return;

    setEventAdding(true);
    try {
      const startDateTime = new Date(`${eventDate}T${eventTime}`).toISOString();
      const endDateTime = new Date(new Date(`${eventDate}T${eventTime}`).getTime() + parseInt(eventDuration) * 60000).toISOString();

      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          summary: eventTitle,
          description: eventDesc,
          location: eventLocation,
          start: { dateTime: startDateTime },
          end: { dateTime: endDateTime }
        })
      });

      if (!res.ok) {
        throw new Error("Failed to add calendar event");
      }

      alert("Event added successfully!");
      setIsAddingEvent(false);
      setEventTitle("");
      setEventDate("");
      setEventTime("");
      setEventLocation("");
      setEventDesc("");
      fetchCalendar();
    } catch (err) {
      console.error(err);
      alert("Error adding event. Please verify permissions.");
    } finally {
      setEventAdding(false);
    }
  };

  // ==================== KEEP INTEGRATION ====================
  const fetchKeep = async () => {
    setIsKeepSandbox(false);
    try {
      // The Keep API might return 403 or 404 on standard consumer accounts.
      const res = await fetch("https://keep.googleapis.com/v1/notes", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        // Fallback to Sandbox localstorage mode if Keep API is locked for consumer accounts
        throw new Error("Access restricted");
      }

      const data = await res.json();
      const parsedNotes = (data.notes || []).map((note: any) => ({
        id: note.name,
        title: note.title || "",
        text: note.body?.text?.text || ""
      }));
      setKeepNotes(parsedNotes);
    } catch (err) {
      console.log("Keep API restricted for consumer. Enabling local sandbox storage.");
      setIsKeepSandbox(true);
      const local = localStorage.getItem("keep_sandbox_notes");
      if (local) {
        setKeepNotes(JSON.parse(local));
      } else {
        const defaultNotes = [
          { id: "1", title: "Project MasterAPI Goals", text: "1. Optimize SQL indexes\n2. Add Swagger integration\n3. Set up Redis caching", color: "bg-amber-100 bg-amber-100" },
          { id: "2", title: "BSc IT Degree Graduation List", text: "Complete submission of graduation audit by end of week.", color: "bg-emerald-100 " },
          { id: "3", title: "UJ Stock Manager Refactoring", text: "Migrate frontend state management to React Context or Redux Toolkit for smoother transactions.", color: "bg-sky-100 " }
        ];
        setKeepNotes(defaultNotes);
        localStorage.setItem("keep_sandbox_notes", JSON.stringify(defaultNotes));
      }
    }
  };

  const handleAddKeepNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle && !noteText) return;

    if (isKeepSandbox) {
      const colors = [
        "bg-amber-100 bg-amber-100 border-amber-200 ",
        "bg-emerald-100  border-emerald-200 ",
        "bg-sky-100  border-sky-200 ",
        "bg-purple-100  border-purple-200 ",
        "bg-rose-100  border-rose-200 "
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const newNote: KeepNote = {
        id: Date.now().toString(),
        title: noteTitle,
        text: noteText,
        color: randomColor
      };

      const updated = [newNote, ...keepNotes];
      setKeepNotes(updated);
      localStorage.setItem("keep_sandbox_notes", JSON.stringify(updated));
      setNoteTitle("");
      setNoteText("");
      setIsAddingNote(false);
    } else {
      // Direct REST post to keep API
      try {
        const res = await fetch("https://keep.googleapis.com/v1/notes", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: noteTitle,
            body: { text: { text: noteText } }
          })
        });

        if (!res.ok) throw new Error("Failed to create Google Keep Note");
        alert("Note created!");
        setNoteTitle("");
        setNoteText("");
        setIsAddingNote(false);
        fetchKeep();
      } catch (err) {
        console.error(err);
        alert("Could not sync with Google Keep API. Try again.");
      }
    }
  };

  const handleDeleteNote = (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this note?");
    if (!confirmed) return;

    if (isKeepSandbox) {
      const updated = keepNotes.filter(n => n.id !== id);
      setKeepNotes(updated);
      localStorage.setItem("keep_sandbox_notes", JSON.stringify(updated));
    } else {
      // In Keep REST API, deletion requires specific resource permissions. We'll simulate on local and notify
      alert("Note deleted from local view. Keep REST requires manual archive in keep.google.com.");
      setKeepNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const filteredNotes = keepNotes.filter(
    n => n.title.toLowerCase().includes(keepSearch.toLowerCase()) || 
         n.text.toLowerCase().includes(keepSearch.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex-1 h-full w-full bg-background text-on-background flex flex-col overflow-hidden relative"
    >
      {/* Top Navbar - Glassy Island Style */}
      <div className="absolute top-0 left-0 md:left-20 lg:left-[88px] right-0 z-30 flex justify-center pointer-events-none pt-[calc(env(safe-area-inset-top)+12px)] sm:pt-[calc(env(safe-area-inset-top)+20px)] px-3 sm:px-4">
        <div className="flex items-center justify-between w-full pointer-events-auto bg-surface/90 backdrop-blur-md rounded-xl shadow-md border-2 border-outline-variant/60 px-4 py-2 max-w-4xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-primary shrink-0">
              <Mail size={18} />
            </div>
            <h1 className="font-semibold text-title-small sm:text-title-large text-on-background tracking-tight font-display py-1">
              Google Workspace
            </h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs text-on-surface-variant font-mono">{user.email}</span>
              <button 
                onClick={handleLogout}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border-2 border-outline-variant hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-600  cursor-pointer bg-transparent transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pb-32 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+88px)]">
        <div className="w-full max-w-3xl pt-4">

          {/* AUTH GATE CARD */}
          <AnimatePresence mode="wait">
            {needsAuth ? (
              <motion.div
                key="auth-gate"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md mx-auto mt-8 p-6 sm:p-8 bg-surface border-2 border-outline-variant rounded-xl shadow-lg flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-xl bg-primary-container flex items-center justify-center text-primary mb-6">
                  <Mail size={32} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-on-background mb-3">
                  Connect Workspace APIs
                </h2>
                <p className="text-[13.5px] sm:text-body-medium text-on-surface-variant leading-relaxed mb-6">
                  Authenticate securely via Google to read & manage your Gmail, check your Calendar schedule, and edit your Google Keep notes directly in this dashboard.
                </p>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-500/10 border-2 border-red-500/20 text-red-600  text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full h-12 flex items-center justify-center gap-3 bg-inverse-surface hover:bg-surface-container-highest  dark:hover:bg-surface-container text-on-primary font-semibold text-[14.5px] rounded-xl cursor-pointer transition-all border-0 shadow-md disabled:opacity-75 disabled:cursor-wait"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      {/* Google G Logo SVG */}
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      <span>Connect with Google</span>
                    </>
                  )}
                </button>

                <span className="mt-4 text-label-small text-on-surface-variant flex items-center gap-1">
                  <Info size={11} /> Secured using Google OAuth standard.
                </span>
              </motion.div>
            ) : (
              /* LOGGED IN WORKSPACE INTERFACE */
              <motion.div
                key="workspace-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col gap-6"
              >
                {/* INNER WORKSPACE TABS */}
                <div className="flex bg-surface border-2 border-outline-variant p-1.5 rounded-xl w-full max-w-md mx-auto">
                  <button
                    onClick={() => setActiveSubTab("gmail")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer border-0 ${
                      activeSubTab === "gmail"
                        ? "bg-primary-container text-primary shadow-sm"
                        : "bg-transparent text-on-surface-variant hover:text-on-background"
                    }`}
                  >
                    <Mail size={16} />
                    <span>Gmail</span>
                  </button>
                  <button
                    onClick={() => setActiveSubTab("calendar")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer border-0 ${
                      activeSubTab === "calendar"
                        ? "bg-primary-container text-primary shadow-sm"
                        : "bg-transparent text-on-surface-variant hover:text-on-background"
                    }`}
                  >
                    <Calendar size={16} />
                    <span>Calendar</span>
                  </button>
                  <button
                    onClick={() => setActiveSubTab("keep")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer border-0 ${
                      activeSubTab === "keep"
                        ? "bg-primary-container text-primary shadow-sm"
                        : "bg-transparent text-on-surface-variant hover:text-on-background"
                    }`}
                  >
                    <FileText size={16} />
                    <span>Keep</span>
                  </button>
                </div>

                {/* RELOAD/REFRESH INDICATOR */}
                <div className="flex justify-between items-center px-1">
                  <span className="text-label-medium font-mono text-on-surface-variant">
                    {activeSubTab === "gmail" ? "Inbox Sync: 6 Latest Emails" : activeSubTab === "calendar" ? "Agenda Sync: Upcoming Events" : isKeepSandbox ? "Keep Local Sandbox Mode" : "Keep Notes Sync"}
                  </span>
                  <button 
                    onClick={fetchTabData}
                    disabled={isLoadingData}
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded-md hover:bg-surface text-on-surface-variant hover:text-on-background border-2 border-transparent hover:border-outline-variant cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isLoadingData ? "animate-spin" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* CORE VIEWS LOADING STATS */}
                {isLoadingData && emails.length === 0 && events.length === 0 && keepNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-surface border-2 border-outline-variant rounded-xl">
                    <Loader2 size={28} className="text-primary animate-spin mb-3" />
                    <span className="text-sm text-on-surface-variant font-mono">Loading data from Google servers...</span>
                  </div>
                ) : (
                  
                  /* SUBTAB WORKSPACE PANELS */
                  <div className="w-full">
                    {/* GMAIL PANEL */}
                    {activeSubTab === "gmail" && (
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setIsComposingEmail(true)}
                            className="flex items-center gap-1.5 bg-primary hover:opacity-90 text-on-primary dark:bg-white dark:text-primary font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl cursor-pointer shadow-sm border-0"
                          >
                            <Plus size={16} />
                            <span>Compose Email</span>
                          </button>
                        </div>

                        {emails.length === 0 ? (
                          <div className="p-8 text-center bg-surface border-2 border-outline-variant rounded-xl text-on-surface-variant text-sm">
                            No emails found in your primary inbox.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {emails.map((email) => (
                              <div
                                key={email.id}
                                onClick={() => setSelectedEmail(email)}
                                className="p-4 bg-surface border-2 border-outline-variant hover:border-primary rounded-xl cursor-pointer transition-all shadow-sm text-left relative overflow-hidden group"
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 group-hover:bg-primary transition-colors" />
                                <div className="flex justify-between items-start gap-4 mb-1 pl-1">
                                  <span className="font-semibold text-xs text-on-surface-variant font-mono">{email.sender}</span>
                                  <span className="text-label-small text-on-surface-variant shrink-0">{email.date}</span>
                                </div>
                                <h3 className="font-bold text-[14.5px] text-on-background mb-1.5 pl-1 truncate">
                                  {email.subject}
                                </h3>
                                <p className="text-body-small text-on-surface-variant pl-1 line-clamp-2 leading-relaxed">
                                  {email.snippet}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* CALENDAR PANEL */}
                    {activeSubTab === "calendar" && (
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setIsAddingEvent(true)}
                            className="flex items-center gap-1.5 bg-primary hover:opacity-90 text-on-primary dark:bg-white dark:text-primary font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl cursor-pointer shadow-sm border-0"
                          >
                            <Plus size={16} />
                            <span>Schedule Event</span>
                          </button>
                        </div>

                        {events.length === 0 ? (
                          <div className="p-8 text-center bg-surface border-2 border-outline-variant rounded-xl text-on-surface-variant text-sm">
                            No upcoming calendar events found.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {events.map((evt) => {
                              const dateObj = new Date(evt.start);
                              const dateStr = dateObj.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
                              const timeStr = dateObj.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

                              return (
                                <div
                                  key={evt.id}
                                  className="p-4 sm:p-5 bg-surface border-2 border-outline-variant hover:border-primary/40 rounded-xl transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left relative overflow-hidden"
                                >
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-400" />
                                  <div className="flex-1 space-y-2 pl-1">
                                    <h3 className="font-bold text-title-medium text-on-background">
                                      {evt.summary}
                                    </h3>
                                    
                                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-on-surface-variant">
                                      <span className="flex items-center gap-1">
                                        <Clock size={13} />
                                        <span>{dateStr} at {timeStr}</span>
                                      </span>
                                      {evt.location && (
                                        <span className="flex items-center gap-1 max-w-[200px] truncate">
                                          <MapPin size={13} />
                                          <span>{evt.location}</span>
                                        </span>
                                      )}
                                    </div>

                                    {evt.description && (
                                      <p className="text-[12.5px] text-on-surface-variant leading-relaxed bg-background/50 p-2.5 rounded-lg border-2 border-outline-variant mt-1">
                                        {evt.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* KEEP PANEL */}
                    {activeSubTab === "keep" && (
                      <div className="space-y-5">
                        {/* Notes Bar Search & Create */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                            <input
                              type="text"
                              value={keepSearch}
                              onChange={(e) => setKeepSearch(e.target.value)}
                              placeholder="Search Keep notes..."
                              className="w-full h-10 pl-10 pr-4 bg-surface border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary text-on-background"
                            />
                          </div>
                          <button
                            onClick={() => setIsAddingNote(true)}
                            className="flex items-center justify-center gap-1.5 bg-primary hover:opacity-90 text-on-primary dark:bg-white dark:text-primary font-semibold text-xs sm:text-sm px-4 h-10 rounded-xl cursor-pointer shadow-sm border-0 shrink-0"
                          >
                            <Plus size={16} />
                            <span>New Note</span>
                          </button>
                        </div>

                        {isKeepSandbox && (
                          <div className="p-3 bg-amber-500/10 border-2 border-amber-500/20 text-amber-800  text-xs rounded-xl flex items-center gap-2">
                            <Info size={14} />
                            <span>Consumer Keeps use sandbox persistence mode successfully.</span>
                          </div>
                        )}

                        {filteredNotes.length === 0 ? (
                          <div className="p-8 text-center bg-surface border-2 border-outline-variant rounded-xl text-on-surface-variant text-sm">
                            No notes found matching search.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredNotes.map((note) => (
                              <div
                                key={note.id}
                                className={`p-4 sm:p-5 rounded-xl border-2 flex flex-col justify-between shadow-sm relative group text-left ${
                                  note.color || "bg-surface border-outline-variant hover:border-primary/40"
                                }`}
                              >
                                <div>
                                  {note.title && (
                                    <h3 className="font-bold text-title-small sm:text-title-medium text-on-surface  mb-2 font-display">
                                      {note.title}
                                    </h3>
                                  )}
                                  <p className="text-[13.5px] text-on-surface  whitespace-pre-line leading-relaxed">
                                    {note.text}
                                  </p>
                                </div>

                                <div className="flex justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-1.5 hover:bg-red-500/10 hover:text-red-600  rounded-lg text-on-surface-variant cursor-pointer border-0 bg-transparent"
                                    title="Delete Note"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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

      {/* ==================== COMPOSE EMAIL MODAL ==================== */}
      <AnimatePresence>
        {isComposingEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsComposingEmail(false)}
              className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-surface border-2 border-outline-variant p-5 sm:p-6 rounded-xl shadow-xl z-10 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[17px] sm:text-[19px] font-bold font-display tracking-tight">Compose Email</h2>
                <button 
                  onClick={() => setIsComposingEmail(false)}
                  className="p-1 hover:bg-surface-container-highest rounded-lg text-on-surface-variant cursor-pointer border-0 bg-transparent"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-4 overflow-y-auto flex-1 pr-1 text-left">
                <div className="space-y-1.5">
                  <label className="text-label-small font-bold font-sans uppercase tracking-wider text-on-surface-variant">To (Recipient Email)</label>
                  <input
                    type="email"
                    required
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="e.g. client@example.com"
                    className="w-full h-10 px-3 bg-background border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary text-on-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-label-small font-bold font-sans uppercase tracking-wider text-on-surface-variant">Subject</label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject line"
                    className="w-full h-10 px-3 bg-background border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary text-on-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-label-small font-bold font-sans uppercase tracking-wider text-on-surface-variant">Message Body</label>
                  <textarea
                    required
                    rows={6}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Type your mail content..."
                    className="w-full p-3 bg-background border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary text-on-background resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={emailSending}
                  className="w-full h-11 bg-primary hover:opacity-90 text-on-primary dark:bg-white dark:text-primary font-semibold text-sm rounded-xl cursor-pointer transition-all border-0 shadow-sm flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
                >
                  {emailSending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending secure payload...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Send secure email</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== VIEW EMAIL PANELS ==================== */}
      <AnimatePresence>
        {selectedEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEmail(null)}
              className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-surface border-2 border-outline-variant p-5 sm:p-6 rounded-xl shadow-xl z-10 flex flex-col text-left"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-label-small font-mono font-bold px-2.5 py-1 bg-red-500/10 text-red-600  rounded-md">
                  Secure Message Payload
                </span>
                <button 
                  onClick={() => setSelectedEmail(null)}
                  className="p-1 hover:bg-surface-container-highest rounded-lg text-on-surface-variant cursor-pointer border-0 bg-transparent"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold font-sans uppercase tracking-wider text-on-surface-variant">From</label>
                  <div className="font-semibold text-sm text-on-background font-mono">{selectedEmail.sender}</div>
                </div>

                <div>
                  <label className="text-[10px] font-bold font-sans uppercase tracking-wider text-on-surface-variant">Subject</label>
                  <h3 className="font-bold text-[17px] text-on-background tracking-tight font-display">
                    {selectedEmail.subject}
                  </h3>
                </div>

                <div>
                  <label className="text-[10px] font-bold font-sans uppercase tracking-wider text-on-surface-variant font-mono">Date</label>
                  <div className="text-xs text-on-surface-variant">{selectedEmail.date}</div>
                </div>

                <div className="border-t-2 border-outline-variant pt-3.5 mt-2">
                  <p className="text-body-medium text-on-background leading-relaxed whitespace-pre-wrap">
                    {selectedEmail.snippet}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== ADD CALENDAR EVENT MODAL ==================== */}
      <AnimatePresence>
        {isAddingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingEvent(false)}
              className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-surface border-2 border-outline-variant p-5 sm:p-6 rounded-xl shadow-xl z-10 flex flex-col max-h-[90vh] overflow-hidden text-left"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[17px] sm:text-[19px] font-bold font-display tracking-tight">Schedule Calendar Event</h2>
                <button 
                  onClick={() => setIsAddingEvent(false)}
                  className="p-1 hover:bg-surface-container-highest rounded-lg text-on-surface-variant cursor-pointer border-0 bg-transparent"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-4 overflow-y-auto flex-1 pr-1">
                <div className="space-y-1.5">
                  <label className="text-label-small font-bold font-sans uppercase tracking-wider text-on-surface-variant">Event Title</label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="e.g. MasterAPI Refinement Sync"
                    className="w-full h-10 px-3 bg-background border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary text-on-background"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-label-small font-bold font-sans uppercase tracking-wider text-on-surface-variant font-mono">Date</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full h-10 px-3 bg-background border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary text-on-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label-small font-bold font-sans uppercase tracking-wider text-on-surface-variant font-mono">Time</label>
                    <input
                      type="time"
                      required
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full h-10 px-3 bg-background border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary text-on-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-label-small font-bold font-sans uppercase tracking-wider text-on-surface-variant">Duration</label>
                    <select
                      value={eventDuration}
                      onChange={(e) => setEventDuration(e.target.value)}
                      className="w-full h-10 px-3 bg-background border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary text-on-background"
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label-small font-bold font-sans uppercase tracking-wider text-on-surface-variant">Location</label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Google Meet, Office, etc."
                      className="w-full h-10 px-3 bg-background border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary text-on-background"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-label-small font-bold font-sans uppercase tracking-wider text-on-surface-variant font-mono">Description</label>
                  <textarea
                    rows={3}
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="Enter discussion agenda or details"
                    className="w-full p-3 bg-background border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary text-on-background resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={eventAdding}
                  className="w-full h-11 bg-primary hover:opacity-90 text-on-primary dark:bg-white dark:text-primary font-semibold text-sm rounded-xl cursor-pointer transition-all border-0 shadow-sm flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-wait"
                >
                  {eventAdding ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Scheduling Secure Event...</span>
                    </>
                  ) : (
                    <>
                      <Calendar size={15} />
                      <span>Schedule event</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== CREATE KEEP NOTE MODAL ==================== */}
      <AnimatePresence>
        {isAddingNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingNote(false)}
              className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-surface border-2 border-outline-variant p-5 sm:p-6 rounded-xl shadow-xl z-10 flex flex-col text-left"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[17px] sm:text-[19px] font-bold font-display tracking-tight">Create Keep Note</h2>
                <button 
                  onClick={() => setIsAddingNote(false)}
                  className="p-1 hover:bg-surface-container-highest rounded-lg text-on-surface-variant cursor-pointer border-0 bg-transparent"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              <form onSubmit={handleAddKeepNote} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-label-small font-bold font-sans uppercase tracking-wider text-on-surface-variant">Note Title (Optional)</label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Enter note title"
                    className="w-full h-10 px-3 bg-background border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary text-on-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-label-small font-bold font-sans uppercase tracking-wider text-on-surface-variant">Body Text</label>
                  <textarea
                    required
                    rows={4}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Type your notes here..."
                    className="w-full p-3 bg-background border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary text-on-background resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-primary hover:opacity-90 text-on-primary dark:bg-white dark:text-primary font-semibold text-sm rounded-xl cursor-pointer transition-all border-0 shadow-sm flex items-center justify-center gap-2"
                >
                  <Plus size={15} />
                  <span>Create note</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
