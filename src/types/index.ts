export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';

export const DAY_NAMES: Record<DayOfWeek, string> = {
  MON: '월요일',
  TUE: '화요일',
  WED: '수요일',
  THU: '목요일',
  FRI: '금요일',
};

export const SHORT_DAY_NAMES: Record<DayOfWeek, string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
};

export const ALL_DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

export type CourseCategory = 'major' | 'general' | 'study' | 'work' | 'personal';

export interface Course {
  id: string;
  title: string;
  professor?: string;
  room?: string;
  day: DayOfWeek;
  startTime: string; // '09:00'
  endTime: string;   // '10:30'
  color: string;     // Tailwind hex or class
  category: CourseCategory;
  memo?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  major: string;
  studentIdPrefix: string; // e.g. "23학번"
  friendCode: string;
  bio?: string;
  schedule: Course[];
  updatedAt: string;
}

export interface FreePeriod {
  id: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  formattedDuration: string; // "1시간 30분", "45분"
  type: 'morning_empty' | 'between_classes' | 'afternoon_empty';
}

export interface OverlappingFreePeriod {
  id: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  formattedDuration: string; // "몇 시간 몇 분"
  users: {
    id: string;
    name: string;
    avatar: string;
  }[];
  activitySuggestions: string[];
}

export interface NotificationSettings {
  enabled: boolean;
  notifyOnFreePeriodStart: boolean;
  minutesBeforeFree: number;
  notifyOnMutualFree: boolean;
  notifyOnClassStart: boolean;
  minutesBeforeClass: number;
  soundEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // '23:00'
  quietHoursEnd: string;   // '08:00'
  activeDays: DayOfWeek[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'free_start' | 'mutual_free' | 'class_start' | 'schedule_sync' | 'friend_add';
  data?: any;
}

export interface CloudBackupItem {
  id: string;
  timestamp: string;
  name: string;
  profileName: string;
  coursesCount: number;
  sizeKb: number;
  autoBackup: boolean;
  snapshot: {
    profile: UserProfile;
    friends: UserProfile[];
    settings: NotificationSettings;
  };
}
