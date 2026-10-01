import { Course, DayOfWeek, FreePeriod, OverlappingFreePeriod, UserProfile } from '../types';

/**
 * Converts "HH:mm" to minutes from 00:00
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts minutes from 00:00 to "HH:mm"
 */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format duration strictly in "몇 시간 몇 분" format as required
 * Examples: "2시간 30분", "1시간", "45분"
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0분';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}시간 ${remainingMinutes}분`;
  }
  if (hours > 0) {
    return `${hours}시간`;
  }
  return `${remainingMinutes}분`;
}

/**
 * Get suitable activities based on duration in minutes
 */
export function getRecommendedActivities(minutes: number): string[] {
  if (minutes < 45) {
    return ['☕️ 카페 테이크아웃', '편의점 간식 타임', '과제 인쇄/도서관 반납'];
  }
  if (minutes <= 90) {
    return ['🍱 캠퍼스 맛집/학식 식사', '☕️ 카페 디저트 & 수다', '동아리방 휴식'];
  }
  if (minutes <= 180) {
    return ['🍲 여유로운 식사 & 커피', '💻 팀플 회의 & 스터디', '🎤 코인노래방 & 보드게임'];
  }
  return ['🎬 영화 관람 & 쇼핑', '🗺️ 대학가 핫플레이스 탐방', '📚 도서관 딥포커스 공부', '🎮 PC방 꿀잼 팟'];
}

export interface TimeInterval {
  start: number; // in minutes
  end: number;   // in minutes
}

/**
 * Calculate free periods for a single schedule on a specific day
 */
export function calculateUserFreePeriods(
  schedule: Course[],
  day: DayOfWeek,
  dayStartMinutes = 9 * 60, // 09:00
  dayEndMinutes = 18 * 60   // 18:00
): FreePeriod[] {
  const dayCourses = schedule
    .filter((c) => c.day === day)
    .map((c) => ({
      start: timeToMinutes(c.startTime),
      end: timeToMinutes(c.endTime),
    }))
    .sort((a, b) => a.start - b.start);

  if (dayCourses.length === 0) {
    // Whole day free!
    const duration = dayEndMinutes - dayStartMinutes;
    return [
      {
        id: `free-${day}-full`,
        day,
        startTime: minutesToTime(dayStartMinutes),
        endTime: minutesToTime(dayEndMinutes),
        durationMinutes: duration,
        formattedDuration: formatDuration(duration),
        type: 'between_classes',
      },
    ];
  }

  // Adjust bounds if courses start earlier or end later
  const earliestCourse = dayCourses[0].start;
  const latestCourse = Math.max(...dayCourses.map((c) => c.end));
  const effectiveStart = Math.min(dayStartMinutes, earliestCourse);
  const effectiveEnd = Math.max(dayEndMinutes, latestCourse);

  const freePeriods: FreePeriod[] = [];

  // 1. Morning free period before first course (if at least 30 mins)
  if (earliestCourse - effectiveStart >= 30) {
    const dur = earliestCourse - effectiveStart;
    freePeriods.push({
      id: `free-${day}-morning`,
      day,
      startTime: minutesToTime(effectiveStart),
      endTime: minutesToTime(earliestCourse),
      durationMinutes: dur,
      formattedDuration: formatDuration(dur),
      type: 'morning_empty',
    });
  }

  // 2. Gaps between courses
  let currentEnd = dayCourses[0].end;
  for (let i = 1; i < dayCourses.length; i++) {
    const course = dayCourses[i];
    if (course.start > currentEnd) {
      const dur = course.start - currentEnd;
      if (dur >= 15) {
        freePeriods.push({
          id: `free-${day}-gap-${i}`,
          day,
          startTime: minutesToTime(currentEnd),
          endTime: minutesToTime(course.start),
          durationMinutes: dur,
          formattedDuration: formatDuration(dur),
          type: 'between_classes',
        });
      }
      currentEnd = Math.max(currentEnd, course.end);
    } else {
      currentEnd = Math.max(currentEnd, course.end);
    }
  }

  // 3. Afternoon free period after last course
  if (effectiveEnd - currentEnd >= 30) {
    const dur = effectiveEnd - currentEnd;
    freePeriods.push({
      id: `free-${day}-afternoon`,
      day,
      startTime: minutesToTime(currentEnd),
      endTime: minutesToTime(effectiveEnd),
      durationMinutes: dur,
      formattedDuration: formatDuration(dur),
      type: 'afternoon_empty',
    });
  }

  return freePeriods;
}

/**
 * Get free intervals (start & end in minutes) for a user on a day
 */
export function getUserFreeIntervals(
  schedule: Course[],
  day: DayOfWeek,
  dayStartMinutes = 9 * 60,
  dayEndMinutes = 18 * 60
): TimeInterval[] {
  const dayCourses = schedule
    .filter((c) => c.day === day)
    .map((c) => ({
      start: timeToMinutes(c.startTime),
      end: timeToMinutes(c.endTime),
    }))
    .sort((a, b) => a.start - b.start);

  if (dayCourses.length === 0) {
    return [{ start: dayStartMinutes, end: dayEndMinutes }];
  }

  const mergedCourses: TimeInterval[] = [];
  for (const c of dayCourses) {
    if (mergedCourses.length === 0) {
      mergedCourses.push({ start: c.start, end: c.end });
    } else {
      const last = mergedCourses[mergedCourses.length - 1];
      if (c.start <= last.end) {
        last.end = Math.max(last.end, c.end);
      } else {
        mergedCourses.push({ start: c.start, end: c.end });
      }
    }
  }

  const freeIntervals: TimeInterval[] = [];
  let pointer = dayStartMinutes;

  for (const busy of mergedCourses) {
    if (busy.start > pointer) {
      freeIntervals.push({ start: pointer, end: busy.start });
    }
    pointer = Math.max(pointer, busy.end);
  }

  if (pointer < dayEndMinutes) {
    freeIntervals.push({ start: pointer, end: dayEndMinutes });
  }

  return freeIntervals;
}

/**
 * Intersect multiple interval lists to find mutual overlapping free times
 */
export function intersectIntervalLists(listA: TimeInterval[], listB: TimeInterval[]): TimeInterval[] {
  const result: TimeInterval[] = [];
  let i = 0;
  let j = 0;

  while (i < listA.length && j < listB.length) {
    const a = listA[i];
    const b = listB[j];

    const start = Math.max(a.start, b.start);
    const end = Math.min(a.end, b.end);

    if (start < end) {
      result.push({ start, end });
    }

    if (a.end < b.end) {
      i++;
    } else {
      j++;
    }
  }

  return result;
}

/**
 * Find all overlapping free periods between two or more users across the week
 */
export function findOverlappingFreePeriods(
  users: UserProfile[],
  minDurationMinutes = 20
): OverlappingFreePeriod[] {
  if (users.length < 2) return [];

  const days: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const allOverlaps: OverlappingFreePeriod[] = [];

  for (const day of days) {
    // Get free intervals for each user
    let commonIntervals = getUserFreeIntervals(users[0].schedule, day);

    for (let u = 1; u < users.length; u++) {
      const nextUserIntervals = getUserFreeIntervals(users[u].schedule, day);
      commonIntervals = intersectIntervalLists(commonIntervals, nextUserIntervals);
    }

    // Filter by min duration and build response
    for (const interval of commonIntervals) {
      const duration = interval.end - interval.start;
      if (duration >= minDurationMinutes) {
        allOverlaps.push({
          id: `overlap-${day}-${interval.start}-${interval.end}`,
          day,
          startTime: minutesToTime(interval.start),
          endTime: minutesToTime(interval.end),
          durationMinutes: duration,
          formattedDuration: formatDuration(duration),
          users: users.map((u) => ({
            id: u.id,
            name: u.name,
            avatar: u.avatar,
          })),
          activitySuggestions: getRecommendedActivities(duration),
        });
      }
    }
  }

  return allOverlaps;
}

/**
 * Get current day of week in MON~FRI if weekday
 */
export function getCurrentDayOfWeek(date = new Date()): DayOfWeek {
  const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday ... 5 is Friday
  switch (dayIndex) {
    case 1:
      return 'MON';
    case 2:
      return 'TUE';
    case 3:
      return 'WED';
    case 4:
      return 'THU';
    case 5:
      return 'FRI';
    default:
      return 'MON'; // Default to Monday on weekends for timetable preview
  }
}

export interface LiveStatus {
  isWeekend: boolean;
  currentDay: DayOfWeek;
  currentTimeString: string;
  statusType: 'in_class' | 'in_free_period' | 'before_day' | 'after_day';
  currentCourse?: Course;
  currentFreePeriod?: {
    startTime: string;
    endTime: string;
    remainingMinutes: number;
    formattedRemaining: string;
  };
  nextCourse?: {
    course: Course;
    startsInMinutes: number;
    formattedStartsIn: string;
  };
  todayTotalFreeMinutes: number;
  formattedTodayTotalFree: string;
}

/**
 * Calculate live status for a user right now
 */
export function calculateLiveStatus(user: UserProfile, now = new Date()): LiveStatus {
  const dayIndex = now.getDay();
  const isWeekend = dayIndex === 0 || dayIndex === 6;
  const currentDay = getCurrentDayOfWeek(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const currentTimeString = minutesToTime(nowMinutes);

  const dayCourses = user.schedule
    .filter((c) => c.day === currentDay)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // Calculate today's total free minutes between 09:00 and 18:00
  const freeIntervals = getUserFreeIntervals(user.schedule, currentDay);
  const todayTotalFreeMinutes = freeIntervals.reduce((sum, int) => sum + (int.end - int.start), 0);

  if (dayCourses.length === 0) {
    return {
      isWeekend,
      currentDay,
      currentTimeString,
      statusType: 'in_free_period',
      todayTotalFreeMinutes: 9 * 60,
      formattedTodayTotalFree: '온종일 공강 (9시간)',
      currentFreePeriod: {
        startTime: '09:00',
        endTime: '18:00',
        remainingMinutes: Math.max(0, 18 * 60 - nowMinutes),
        formattedRemaining: formatDuration(Math.max(0, 18 * 60 - nowMinutes)),
      },
    };
  }

  // Check if currently inside a class
  for (const c of dayCourses) {
    const startM = timeToMinutes(c.startTime);
    const endM = timeToMinutes(c.endTime);
    if (nowMinutes >= startM && nowMinutes < endM) {
      return {
        isWeekend,
        currentDay,
        currentTimeString,
        statusType: 'in_class',
        currentCourse: c,
        todayTotalFreeMinutes,
        formattedTodayTotalFree: formatDuration(todayTotalFreeMinutes),
      };
    }
  }

  // Next course
  const upcomingCourses = dayCourses.filter((c) => timeToMinutes(c.startTime) > nowMinutes);
  const nextCourseItem = upcomingCourses.length > 0 ? upcomingCourses[0] : undefined;

  let nextCourseData: LiveStatus['nextCourse'] = undefined;
  if (nextCourseItem) {
    const startM = timeToMinutes(nextCourseItem.startTime);
    const diff = startM - nowMinutes;
    nextCourseData = {
      course: nextCourseItem,
      startsInMinutes: diff,
      formattedStartsIn: formatDuration(diff),
    };
  }

  const firstClassStart = timeToMinutes(dayCourses[0].startTime);
  const lastClassEnd = Math.max(...dayCourses.map((c) => timeToMinutes(c.endTime)));

  if (nowMinutes < firstClassStart) {
    return {
      isWeekend,
      currentDay,
      currentTimeString,
      statusType: 'before_day',
      nextCourse: nextCourseData,
      todayTotalFreeMinutes,
      formattedTodayTotalFree: formatDuration(todayTotalFreeMinutes),
      currentFreePeriod: {
        startTime: minutesToTime(Math.min(9 * 60, nowMinutes)),
        endTime: dayCourses[0].startTime,
        remainingMinutes: firstClassStart - nowMinutes,
        formattedRemaining: formatDuration(firstClassStart - nowMinutes),
      },
    };
  }

  if (nowMinutes >= lastClassEnd) {
    return {
      isWeekend,
      currentDay,
      currentTimeString,
      statusType: 'after_day',
      todayTotalFreeMinutes,
      formattedTodayTotalFree: formatDuration(todayTotalFreeMinutes),
    };
  }

  // If between classes:
  return {
    isWeekend,
    currentDay,
    currentTimeString,
    statusType: 'in_free_period',
    nextCourse: nextCourseData,
    todayTotalFreeMinutes,
    formattedTodayTotalFree: formatDuration(todayTotalFreeMinutes),
    currentFreePeriod: nextCourseData
      ? {
          startTime: currentTimeString,
          endTime: nextCourseData.course.startTime,
          remainingMinutes: nextCourseData.startsInMinutes,
          formattedRemaining: nextCourseData.formattedStartsIn,
        }
      : undefined,
  };
}
