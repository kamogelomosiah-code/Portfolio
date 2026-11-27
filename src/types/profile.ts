export type NavTab = "chat" | "projects" | "cv" | "contact" | "data" | "changelog" | "api";

export interface ProfileEducation {
  degree: string;
  years: string;
  institution: string;
  details: string;
}

export interface ProfileExperience {
  title: string;
  year: string;
  company: string;
  details: string;
}

export interface ProfileProject {
  name: string;
  url?: string;
  stack: string;
  description: string;
}

export interface ProfileLink {
  label: string;
  url: string;
}

export interface ProfileCustomNote {
  topic: string;
  content: string;
}

export interface ProfileData {
  name: string;
  nickname: string;
  email: string;
  phone?: string;
  location?: string;
  availability?: string;
  profession: string;
  overview: string;
  links?: ProfileLink[];
  education: ProfileEducation[];
  experience: ProfileExperience[];
  projects: ProfileProject[];
  skills: string[];
  customNotes?: ProfileCustomNote[];
  [key: string]: unknown;
}
