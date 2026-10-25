export interface Links {
  linkedin?: string;
  github?: string;
  twitter?: string;
  website?: string;
}

export interface Experience {
  role: string;
  company: string;
  location?: string;
  /** Human-readable period, e.g. "Jan 2024 – Present" */
  period?: string;
  current: boolean;
  months: number;
  bullets: string[];
}

export interface Education {
  degree: string;
  /** Short label for the stat card, e.g. "M.A." */
  short: string;
  field?: string;
  institution?: string;
  year?: string;
  rank: number;
}

export interface Project {
  title: string;
  meta?: string;
  description: string;
  tags: string[];
}

export interface Goal {
  label: string;
  value: string;
  note?: string;
}

export interface Resume {
  name: string;
  headline: string;
  tagline: string;
  email?: string;
  phone?: string;
  location?: string;
  links: Links;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  achievements: string[];
  certifications: string[];
  goals: Goal[];
  interests: string[];
  languages: string[];
  motto?: string;
  stats: {
    years: number;
    /** true when the figure should be shown with a trailing "+" */
    yearsPlus: boolean;
    projects: number;
    projectsPlus: boolean;
    skills: number;
  };
}

export interface StoredProfile {
  resume: Resume;
  photo?: string;
  file?: { name: string; type: string; dataUrl: string };
  updatedAt: number;
}
