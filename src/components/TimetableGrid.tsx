import React, { useState, useMemo } from 'react';
import {
  Plus,
  Clock,
  Coffee,
  Sparkles,
  Info,
  Calendar,
  BookOpen,
  Edit2,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ALL_DAYS, Course, DAY_NAMES, DayOfWeek, FreePeriod, SHORT_DAY_NAMES } from '../types';
import { COLOR_PALETTE } from '../data/initialData';
import { formatDuration, timeToMinutes } from '../utils/timeCalculations';

interface TimetableGridProps {
  onAddCourse: () => void;
  onEditCourse: (course: Course) => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  onAddCourse,
  onEditCourse,
}) => {
  const { currentUser, myFreePeriods, deleteCourse, exportDataToExcel } = useApp();
  const [showFreePeriodSlots, setShowFreePeriodSlots] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Time boundaries: 09:00 (540m) to 18:00 (1080m)
  const START_HOUR = 9;
  const END_HOUR = 18;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const HOUR_HEIGHT = 68; // px per hour

  // Stats calculation
  const totalCourses = currentUser.schedule.length;

  const { totalFreeMinutes, longestFree } = useMemo<{
    totalFreeMinutes: number;
    longestFree: FreePeriod | null;
  }>(() => {
    let minutes = 0;
    let longest: FreePeriod | null = null;
    for (const periods of Object.values(myFreePeriods)) {
      for (const p of periods) {
        if (p.type === 'between_classes') {
          minutes += p.durationMinutes;
          if (!longest || p.durationMinutes > longest.durationMinutes) {
            longest = p;
          }
        }
      }
    }
    return { totalFreeMinutes: minutes, longestFree: longest };
  }, [myFreePeriods]);

  const getColorClass = (colorId: string) => {
    const found = COLOR_PALETTE.find((c) => c.id === colorId);
    return found ? found.class : COLOR_PALETTE[0].class;
  };

  const getCategoryLabel = (category: Course['category']) => {
    switch (category) {
      case 'major':
        return '전공';
      case 'general':
        return '교양';
      case 'study':
        return '스터디';
      case 'work':
        return '알바/활동';
      default:
        return '기타';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                {currentUser.name}의 주간 시간표
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                {currentUser.major} {currentUser.studentIdPrefix}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              강의와 공강 시간을 한눈에 확인하고, 비는 시간의 여유를 계획해보세요.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[11px] font-semibold text-slate-400 block">총 강의 수</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {totalCourses}개 과목
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                주간 수업 사이 공강
              </span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                {formatDuration(totalFreeMinutes)}
              </span>
            </div>

            {longestFree ? (
              <div className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hidden sm:block">
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block">
                  최대 우주공강
                </span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  {DAY_NAMES[longestFree.day as DayOfWeek]} {longestFree.formattedDuration}
                </span>
              </div>
            ) : null}

            <button
              onClick={exportDataToExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs sm:text-sm border border-emerald-200 dark:border-emerald-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="시간표 및 공강 데이터를 엑셀(.xlsx) 파일로 저장합니다"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>엑셀 저장</span>
            </button>

            <button
              onClick={onAddCourse}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>강의/일정 추가</span>
            </button>
          </div>
        </div>

        {/* Option toggles */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showFreePeriodSlots}
                onChange={(e) => setShowFreePeriodSlots(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                공강 시간 시각적 표시 (빈 슬롯에 공강 카드 노출)
              </span>
            </label>
          </div>

          <div className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Info className="w-3.5 h-3.5" />
            <span>강의 카드를 클릭하면 상세 보기 및 수정이 가능합니다.</span>
          </div>
        </div>
      </div>

      {/* Main Timetable Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            
            {/* Day Header Row */}
            <div className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
              <div className="p-3 text-center text-xs font-semibold text-slate-400 border-r border-slate-200 dark:border-slate-800">
                시간
              </div>
              {ALL_DAYS.map((day) => {
                const dayCoursesCount = currentUser.schedule.filter((c) => c.day === day).length;
                return (
                  <div
                    key={day}
                    className="p-3 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-800"
                  >
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {DAY_NAMES[day]}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5 font-normal">
                      ({dayCoursesCount}강의)
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Grid Body */}
            <div className="relative grid grid-cols-[64px_repeat(5,1fr)]">
              
              {/* Hour Labels Column */}
              <div className="border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                {Array.from({ length: TOTAL_HOURS }).map((_, idx) => {
                  const hour = START_HOUR + idx;
                  return (
                    <div
                      key={hour}
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      className="border-b border-slate-100 dark:border-slate-800/60 p-1.5 text-right pr-2 text-xs font-semibold text-slate-400"
                    >
                      {String(hour).padStart(2, '0')}:00
                    </div>
                  );
                })}
              </div>

              {/* Day Columns */}
              {ALL_DAYS.map((day) => {
                const dayCourses = currentUser.schedule.filter((c) => c.day === day);
                const dayFree = myFreePeriods[day] || [];

                return (
                  <div
                    key={day}
                    style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
                    className="relative border-r last:border-r-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group"
                  >
                    {/* Background hour lines */}
                    {Array.from({ length: TOTAL_HOURS }).map((_, idx) => (
                      <div
                        key={idx}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className="border-b border-slate-100 dark:border-slate-800/60 border-dashed"
                      />
                    ))}

                    {/* Free Period visual placeholders (if toggle is on) */}
                    {showFreePeriodSlots &&
                      dayFree
                        .filter((p) => p.type === 'between_classes')
                        .map((period) => {
                          const startM = timeToMinutes(period.startTime);
                          const endM = timeToMinutes(period.endTime);
                          const topM = startM - START_HOUR * 60;
                          const heightM = endM - startM;

                          if (topM < 0 || heightM <= 0) return null;

                          const topPx = (topM / 60) * HOUR_HEIGHT;
                          const heightPx = (heightM / 60) * HOUR_HEIGHT;

                          return (
                            <div
                              key={period.id}
                              style={{
                                top: `${topPx + 2}px`,
                                height: `${heightPx - 4}px`,
                              }}
                              className="absolute left-1.5 right-1.5 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700/70 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 flex flex-col justify-center items-center text-center transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/40 z-0 pointer-events-none"
                            >
                              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                <Coffee className="w-3.5 h-3.5" />
                                <span>공강 {period.formattedDuration}</span>
                              </div>
                              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                                {period.startTime} ~ {period.endTime}
                              </span>
                            </div>
                          );
                        })}

                    {/* Scheduled Course Blocks */}
                    {dayCourses.map((course) => {
                      const startM = timeToMinutes(course.startTime);
                      const endM = timeToMinutes(course.endTime);
                      const topM = startM - START_HOUR * 60;
                      const heightM = endM - startM;

                      const topPx = (topM / 60) * HOUR_HEIGHT;
                      const heightPx = (heightM / 60) * HOUR_HEIGHT;
                      const colorStyle = getColorClass(course.color);

                      return (
                        <div
                          key={course.id}
                          onClick={() => setSelectedCourse(course)}
                          style={{
                            top: `${topPx + 1}px`,
                            height: `${heightPx - 2}px`,
                          }}
                          className={`absolute left-1 right-1 rounded-xl p-2.5 border shadow-sm cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md z-10 flex flex-col justify-between overflow-hidden ${colorStyle}`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-xs sm:text-sm leading-snug line-clamp-2">
                                {course.title}
                              </span>
                              <span className="text-[9px] px-1 py-0.5 rounded uppercase font-semibold bg-white/60 dark:bg-black/30 shrink-0">
                                {getCategoryLabel(course.category)}
                              </span>
                            </div>

                            <p className="text-[11px] opacity-80 mt-0.5 truncate">
                              {course.room || course.professor}
                            </p>
                          </div>

                          <div className="text-[10px] font-medium opacity-75 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {course.startTime} - {course.endTime}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                );
              })}

            </div>
          </div>
        </div>
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6">
            
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {DAY_NAMES[selectedCourse.day]} 강의
                </span>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {selectedCourse.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>
                  시간:{' '}
                  <strong className="text-slate-800 dark:text-slate-100">
                    {selectedCourse.startTime} ~ {selectedCourse.endTime}
                  </strong>{' '}
                  ({formatDuration(timeToMinutes(selectedCourse.endTime) - timeToMinutes(selectedCourse.startTime))})
                </span>
              </div>

              {selectedCourse.room && (
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>
                    강의실:{' '}
                    <strong className="text-slate-800 dark:text-slate-100">
                      {selectedCourse.room}
                    </strong>
                  </span>
                </div>
              )}

              {selectedCourse.professor && (
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>
                    담당 교수:{' '}
                    <strong className="text-slate-800 dark:text-slate-100">
                      {selectedCourse.professor}
                    </strong>
                  </span>
                </div>
              )}

              {selectedCourse.memo && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400 mt-2">
                  📝 {selectedCourse.memo}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  deleteCourse(selectedCourse.id);
                  setSelectedCourse(null);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-semibold text-xs transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>삭제</span>
              </button>

              <button
                onClick={() => {
                  onEditCourse(selectedCourse);
                  setSelectedCourse(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>수정</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
