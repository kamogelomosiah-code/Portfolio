export interface Step {
  id: string;
  step_number: number;
  task: string;
  scheduled_date: string;
  completed?: boolean;
}

export interface Reminder {
  send_date: string;
  message: string;
}

export interface Plan {
  id: string;
  goal_title: string;
  main_deadline: string;
  path_of_least_resistance?: string;
  steps: Step[];
  reminders: Reminder[];
}
