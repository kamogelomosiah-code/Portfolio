import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialIcon } from '../MaterialIcon';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns';

export interface CalendarNote {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export type NotesState = Record<string, CalendarNote[]>;

interface ActionPlannerProps {
  onBackToChat?: () => void;
  onToggleDrawer?: () => void;
}

export default function ActionPlanner({ onBackToChat, onToggleDrawer }: ActionPlannerProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<NotesState>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Note form state
  const [noteInput, setNoteInput] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateNotes = notes[selectedDateKey] || [];

  // 1. Load saved notes from JSON file inside project (/api/planner/notes)
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/planner/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data || {});
      }
    } catch (err) {
      console.error('Failed to load planner notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Save notes object to JSON file (/planner_notes.json via API)
  const saveNotesToFile = async (updatedNotes: NotesState) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/planner/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNotes)
      });
      if (res.ok) {
        setSaveStatus('Saved to planner_notes.json');
        setTimeout(() => setSaveStatus(null), 2500);
      } else {
        setSaveStatus('Failed to save');
      }
    } catch (err) {
      console.error('Failed to save planner notes:', err);
      setSaveStatus('Error saving');
    } finally {
      setIsSaving(false);
    }
  };

  // Add note for selected date
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;

    const newNote: CalendarNote = {
      id: crypto.randomUUID(),
      text: noteInput.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedDateNotes = [...selectedDateNotes, newNote];
    const updatedNotes = {
      ...notes,
      [selectedDateKey]: updatedDateNotes
    };

    setNotes(updatedNotes);
    setNoteInput('');
    saveNotesToFile(updatedNotes);
  };

  // Start editing note
  const handleStartEdit = (note: CalendarNote) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  };

  // Save edited note
  const handleSaveEdit = (noteId: string) => {
    if (!editingText.trim()) return;

    const updatedDateNotes = selectedDateNotes.map(note =>
      note.id === noteId
        ? { ...note, text: editingText.trim(), updatedAt: new Date().toISOString() }
        : note
    );

    const updatedNotes = {
      ...notes,
      [selectedDateKey]: updatedDateNotes
    };

    setNotes(updatedNotes);
    setEditingNoteId(null);
    setEditingText('');
    saveNotesToFile(updatedNotes);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingText('');
  };

  // Delete note
  const handleDeleteNote = (noteId: string) => {
    const updatedDateNotes = selectedDateNotes.filter(n => n.id !== noteId);
    
    let updatedNotes: NotesState;
    if (updatedDateNotes.length === 0) {
      updatedNotes = { ...notes };
      delete updatedNotes[selectedDateKey];
    } else {
      updatedNotes = {
        ...notes,
        [selectedDateKey]: updatedDateNotes
      };
    }

    setNotes(updatedNotes);
    saveNotesToFile(updatedNotes);
  };

  // Navigation handlers
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="flex flex-col h-full w-full bg-background text-on-background overflow-y-auto">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-surface/90 backdrop-blur-md border-b border-outline-variant">
        <div className="flex items-center gap-3">
          {onToggleDrawer && (
            <button
              onClick={onToggleDrawer}
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
              title="Open Menu"
            >
              <MaterialIcon name="menu" className="text-xl" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <MaterialIcon name="calendar_month" className="text-xl" />
            </div>
            <div>
              <h1 className="font-semibold text-body-large sm:text-title-medium text-on-surface leading-tight">
                Calendar & Notes
              </h1>
              <p className="text-label-small text-on-surface-variant hidden sm:block">
                Simple daily notes saved to <code className="text-primary font-mono bg-surface-container px-1 py-0.5 rounded">planner_notes.json</code>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-label-small font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/20">
              {saveStatus}
            </span>
          )}
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg text-label-medium font-medium bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
          >
            Today
          </button>
          {onBackToChat && (
            <button
              onClick={onBackToChat}
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
              title="Return to Chat"
            >
              <MaterialIcon name="chat" className="text-xl" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Selected Date Notes on Right */}
      <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Calendar (8 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Calendar Header / Controls */}
          <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-2xl border border-outline-variant">
            <h2 className="text-title-medium sm:text-headline-small font-bold text-on-surface">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 border border-outline-variant/50">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                title="Previous Month"
              >
                <MaterialIcon name="chevron_left" className="text-xl" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                title="Next Month"
              >
                <MaterialIcon name="chevron_right" className="text-xl" />
              </button>
            </div>
          </div>

          {/* Calendar Day Labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-medium text-label-medium text-on-surface-variant px-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((day, idx) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayNotes = notes[dayKey] || [];
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonthDay = isSameMonth(day, currentMonth);
              const isTodayDay = isToday(day);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative min-h-[70px] sm:min-h-[85px] p-1.5 sm:p-2 rounded-xl flex flex-col justify-between text-left transition-all cursor-pointer border
                    ${isSelected
                      ? 'bg-primary/15 border-primary shadow-sm text-primary font-semibold'
                      : isCurrentMonthDay
                        ? 'bg-surface-container-low hover:bg-surface-container border-outline-variant/40 text-on-surface'
                        : 'bg-surface/30 border-transparent text-on-surface-variant/40 opacity-50 hover:opacity-80'
                    }
                  `}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`
                        text-label-medium sm:text-body-medium rounded-full w-6 h-6 flex items-center justify-center font-mono
                        ${isTodayDay ? 'bg-primary text-on-primary font-bold shadow-sm' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayNotes.length > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-medium">
                        {dayNotes.length}
                      </span>
                    )}
                  </div>

                  {/* Note preview badge/snippet */}
                  {dayNotes.length > 0 && (
                    <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                      {dayNotes.slice(0, 2).map((n, i) => (
                        <div
                          key={i}
                          className="text-[10.5px] leading-tight line-clamp-1 px-1 py-0.5 rounded bg-surface-container-high/60 text-on-surface-variant"
                        >
                          {n.text}
                        </div>
                      ))}
                      {dayNotes.length > 2 && (
                        <div className="text-[9.5px] text-on-surface-variant/70 italic px-1">
                          +{dayNotes.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Date Notes Panel (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant flex flex-col h-full min-h-[420px]">
            {/* Panel Header */}
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/60">
              <div>
                <p className="text-label-small uppercase tracking-wider text-primary font-semibold">
                  Selected Date
                </p>
                <h3 className="text-title-medium sm:text-title-large font-bold text-on-surface mt-0.5">
                  {format(selectedDate, 'EEEE, MMM d, yyyy')}
                </h3>
              </div>
              <div className="text-right font-mono text-label-small text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant/40">
                {selectedDateNotes.length} {selectedDateNotes.length === 1 ? 'note' : 'notes'}
              </div>
            </div>

            {/* Note Input Form */}
            <form onSubmit={handleAddNote} className="mt-4 flex flex-col gap-2">
              <div className="relative">
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder={`Write a note for ${format(selectedDate, 'MMM d')}...`}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-surface border border-outline-variant text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-body-medium resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleAddNote(e);
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant/70 font-mono">
                  Press Ctrl+Enter or click Add
                </span>
                <button
                  type="submit"
                  disabled={!noteInput.trim() || isSaving}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary font-medium text-label-large hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer border-0 shadow-sm"
                >
                  <MaterialIcon name="add" className="text-lg" />
                  Add Note
                </button>
              </div>
            </form>

            {/* List of Notes for Selected Date */}
            <div className="mt-6 flex-1 flex flex-col gap-3 overflow-y-auto max-h-[450px] pr-1">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center text-on-surface-variant py-10">
                  <MaterialIcon name="sync" className="animate-spin text-2xl mr-2 text-primary" />
                  Loading notes...
                </div>
              ) : selectedDateNotes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-outline-variant/40 rounded-xl text-on-surface-variant/70">
                  <MaterialIcon name="edit_note" className="text-4xl mb-2 text-on-surface-variant/40" />
                  <p className="text-body-medium font-medium text-on-surface-variant">No notes for this date</p>
                  <p className="text-label-small mt-1">Use the field above to add your first note.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {selectedDateNotes.map((note) => {
                    const isEditing = editingNoteId === note.id;

                    return (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3.5 rounded-xl bg-surface border border-outline-variant flex flex-col gap-2 shadow-sm hover:border-outline transition-colors"
                      >
                        {isEditing ? (
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full p-2.5 rounded-lg bg-surface-container border border-primary/50 text-on-surface focus:outline-none text-body-medium resize-none"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 rounded-lg bg-surface-container-high text-on-surface text-label-medium hover:bg-surface-container-highest transition-colors cursor-pointer border-0"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(note.id)}
                                className="px-3 py-1 rounded-lg bg-primary text-on-primary text-label-medium hover:bg-primary/90 transition-colors cursor-pointer border-0"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-body-medium text-on-surface whitespace-pre-wrap leading-relaxed break-words">
                              {note.text}
                            </p>
                            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30 text-label-small text-on-surface-variant">
                              <span className="font-mono text-[11px] opacity-70">
                                {format(parseISO(note.createdAt), 'h:mm a')}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleStartEdit(note)}
                                  className="p-1 rounded-md hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors cursor-pointer border-0"
                                  title="Edit note"
                                >
                                  <MaterialIcon name="edit" className="text-base" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="p-1 rounded-md hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors cursor-pointer border-0"
                                  title="Delete note"
                                >
                                  <MaterialIcon name="delete" className="text-base" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
