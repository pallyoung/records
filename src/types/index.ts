export type RecordStatus = 'pending' | 'in_progress' | 'completed';

export type Achievement = 'below' | 'met' | 'exceeded';

export interface Review {
  achievement: Achievement;
  details: string;
}

export interface Record {
  id: string;
  content: string;
  images: string[];
  tags: string[];
  status: RecordStatus;
  plannedStartTime?: Date;
  plannedEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  review?: Review;
  createdAt: Date;
  updatedAt: Date;
}

export type TimelineGranularity = 'day' | 'week' | 'month';

export interface FilterState {
  tags: string[];
  status: RecordStatus | null;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  frequency: 'daily' | 'weekly';
  targetDays: number[];
  createdAt: Date;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}
