export type RecordStatus = "pending" | "in_progress" | "completed";

export type Achievement = "below" | "met" | "exceeded";

// 循环事务频率类型
export type RecurringFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "interval_days"
  | "interval_hours";

// 循环事务配置
export interface RecurringConfig {
  frequency: RecurringFrequency;
  daysOfWeek?: number[]; // 每周几 (0-6, 0为周日)
  dayOfMonth?: number; // 每月几号 (1-28)
  intervalValue?: number; // 自定义间隔值
  totalCompletions: number; // 累计完成次数
  lastResetDate?: string; // 上次重置日期 (YYYY-MM-DD)
  lastResetTime?: string; // 上次重置时间 (HH:mm)
}

// 事务类型
export type RecordType = "normal" | "recurring";

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
  type?: RecordType;
  recurringConfig?: RecurringConfig;
  plannedStartTime?: Date;
  plannedEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  review?: Review;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

export type TimelineGranularity = "day" | "week" | "month";

export interface FilterState {
  tags: string[];
  status: RecordStatus | null;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  frequency: "daily" | "weekly";
  targetDays: number[];
  createdAt: Date;
  userId?: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  userId?: string;
}
