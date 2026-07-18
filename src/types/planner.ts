// src/types/planner.ts

export interface Step {
  id: string;
  action: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'one-time';
  duration_minutes: number;
  due_date?: string; // ISO string
  completed: boolean;
  google_task_id?: string;
  google_event_id?: string;
}

export interface Plan {
  id: string;
  goal_summary: string;
  steps: Step[];
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number; // timestamp
}
