// src/types/planner.ts

export interface Step {
  id: string;
  action: string;
  timeframe: string; // e.g. "Week 1", "Day 1-3"
  duration_minutes: number;
  completed: boolean;
  email_subject: string;
  email_body: string;
  email_sent_at?: string; // ISO string when email was sent
  email_status: 'pending' | 'sent' | 'failed';
  preview_url?: string;
}

export interface Plan {
  id: string;
  goal_summary: string;
  timeframe_overview: string; // e.g., "6-Week Action Plan"
  email: string; // User's email to send steps to
  steps: Step[];
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

