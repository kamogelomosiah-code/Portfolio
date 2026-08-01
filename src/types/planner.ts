export type GoalCategory = 'Job Search' | 'Health' | 'Learning' | 'Personal' | 'Finance' | 'Other';
export type GoalPriority = 'High' | 'Medium' | 'Low';
export type GoalStatus = 'Active' | 'Paused' | 'Completed' | 'Abandoned';
export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly';

export interface Step {
  id: string;
  step_number: number;
  task: string;
  description?: string;
  scheduled_date: string;
  completed?: boolean;
  recurrence?: RecurrenceType;
}

export interface Reminder {
  send_date: string;
  message: string;
}

export interface Plan {
  id: string;
  goal_title: string;
  category?: GoalCategory;
  priority?: GoalPriority;
  status?: GoalStatus;
  main_deadline: string;
  path_of_least_resistance?: string;
  steps: Step[];
  reminders: Reminder[];
}
