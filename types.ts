export enum Screen {
  DASHBOARD = 'DASHBOARD',
  ANALYTICS = 'ANALYTICS',
  PROGRAM_EDITOR = 'PROGRAM_EDITOR',
  WORKOUT = 'WORKOUT',
  ONBOARDING = 'ONBOARDING',
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  settings?: any;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  workouts: Workout[];
  createdBy: string;
  isPublic: boolean;
  createdAt: any;
  updatedAt: any;
}
