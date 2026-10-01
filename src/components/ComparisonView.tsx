import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  GitCompare,
  Coffee,
  Utensils,
  BookOpen,
  Sparkles,
  Users,
  CheckCircle2,
  Calendar,
  Share2,
  ArrowRight,
  Clock,
  Layers,
  Columns,
  MessageCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ALL_DAYS, DAY_NAMES, SHORT_DAY_NAMES, DayOfWeek, OverlappingFreePeriod, UserProfile } from '../types';
import { COLOR_PALETTE } from '../data/initialData';
import { formatDuration, timeToMinutes } from '../utils/timeCalculations';

export const ComparisonView: React.FC = () => {
  const {
    currentUser,
    friends,
    selectedFriendIds,
    toggleFriendSelection,
    overlappingFreePeriods,
    primaryComparedFriend,
    exportDataToExcel,
    showToast,
  } = useApp();

  const [viewStyle, setViewStyle] = useState<'overlay' | 'sideBySide'>('overlay');
  const [selectedDayFilter, setSelectedDayFilter] = useState<DayOfWeek | 'ALL'>('ALL');
  const [activeOverlapDetail, setActiveOverlapDetail] = useState<OverlappingFreePeriod | null>(null);

  const START_HOUR = 9;
  const END_HOUR = 18;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const HOUR_HEIGHT = 64;

  // Filter overlapping slots
  const filteredOverlaps = overlappingFreePeriods.filter((item) =>
    selectedDayFilter === 'ALL' ? true : item.day === selectedDayFilter
  );

  // Total mutual free minutes
  const totalMutualMinutes = overlappingFreePeriods.reduce(
    (sum, cur) => sum + cur.durationMinutes,
    0
  );

  // Group overlaps by day
  const overlapsByDay = overlappingFreePeriods.reduce((acc, item) => {
    acc[item.day] = (acc[item.day] || 0) + item.durationMinutes;
    return acc;
  }, {} as Record<DayOfWeek, number>);

  let bestDay: DayOfWeek | null = null;
  let bestDayMinutes = 0;
  Object.entries(overlapsByDay).forEach(([day, mins]) => {
    if (mins > bestDayMinutes) {
      bestDayMinutes = mins;
      bestDay = day as DayOfWeek;
    }
  });

  const handleInviteLunch = (overlap: OverlappingFreePeriod) => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });

    const partnerNames = overlap.users
      .filter((u) => u.id !== currentUser.id)
      .map((u) => u.name)
      .join(', ');

    const textToCopy = `[공강메이트] ${DAY_NAMES[overlap.day]} ${overlap.startTime}~${overlap.endTime} (${overlap.formattedDuration}) 우리 둘 다 공강인데 같이 밥 먹을래? 🍱`;

    navigator.clipboard?.writeText(textToCopy);
    showToast(`🎉 ${partnerNames}님과의 약속 초대 메시지가 복사되었습니다!`);
  };

  const getColorClass = (colorId: string) => {
    const found = COLOR_PALETTE.find((c) => c.id === colorId);
    return found ? found.class : COLOR_PALETTE[0].class;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Friend Selector & Match Overview Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                <GitCompare className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  시간표 비교 & 겹치는 공강 찾기
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  선택한 친구와 내 시간표를 자동으로 대조하여 함께 비는 시간을 실시간으로 계산합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Match Highlight Metric */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                함께 비는 총 공강 시간
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300">
                {formatDuration(totalMutualMinutes)}
              </span>
            </div>

            {bestDay && (
              <div className="px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 hidden sm:block">
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 block">
                  가장 많이 겹치는 요일
                </span>
                <span className="text-base sm:text-lg font-black text-indigo-700 dark:text-indigo-300">
                  {DAY_NAMES[bestDay]} ({formatDuration(bestDayMinutes)})
                </span>
              </div>
            )}

            <button
              onClick={exportDataToExcel}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="비교 시간표와 겹치는 공강 데이터를 엑셀(.xlsx)로 저장합니다"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>엑셀 저장</span>
            </button>
          </div>
        </div>

        {/* Friend Selector Pills */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            비교할 친구 선택 (다중 선택 가능):
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {friends.map((friend) => {
              const isSelected = selectedFriendIds.includes(friend.id);
              return (
                <button
                  key={friend.id}
                  onClick={() => toggleFriendSelection(friend.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-base leading-none">{friend.avatar}</span>
                  <span>{friend.name}</span>
                  <span className={`text-[11px] font-normal opacity-85`}>
                    ({friend.major})
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Overlapping Free Periods Highlight Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>✨ 겹치는 공강 시간 목록</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                {overlappingFreePeriods.length}개 발견
              </span>
            </h2>
            <span className="text-xs text-slate-400 hidden sm:inline">
              (친구와 함께 수업이 없는 황금 시간대입니다)
            </span>
          </div>

          {/* Day Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedDayFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                selectedDayFilter === 'ALL'
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              전체 ({overlappingFreePeriods.length})
            </button>
            {ALL_DAYS.map((d) => {
              const count = overlappingFreePeriods.filter((o) => o.day === d).length;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDayFilter(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    selectedDayFilter === d
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {DAY_NAMES[d]} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards Grid */}
        {filteredOverlaps.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800">
            <Coffee className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              선택한 요일에 겹치는 공강 시간이 없습니다.
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              다른 요일을 선택하거나, 비교할 친구를 추가로 선택해보세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOverlaps.map((overlap) => {
              const isLongGap = overlap.durationMinutes >= 120;
              const isLunchTime =
                overlap.startTime <= '13:00' && overlap.endTime >= '12:00';

              return (
                <div
                  key={overlap.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-emerald-200/90 dark:border-emerald-800/80 shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Day & Badges */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {DAY_NAMES[overlap.day]}
                      </span>

                      {/* Prominent "몇 시간 몇 분" duration badge */}
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-600 text-white shadow-xs">
                        {overlap.formattedDuration}
                      </span>
                    </div>

                    {/* Time interval */}
                    <div className="mt-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                          {overlap.startTime} ~ {overlap.endTime}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        총 <strong className="text-emerald-600 dark:text-emerald-400">{overlap.formattedDuration}</strong> 동안 함께 자유시간!
                      </p>
                    </div>

                    {/* Tag highlights */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {isLunchTime && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 font-medium">
                          <Utensils className="w-3 h-3" />
                          점심 밥약속 추천
                        </span>
                      )}
                      {isLongGap && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1 font-medium">
                          <Sparkles className="w-3 h-3" />
                          우주공강 카공/힐링
                        </span>
                      )}
                    </div>

                    {/* Suggested Activities */}
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                        추천 활동
                      </span>
                      {overlap.activitySuggestions.slice(0, 2).map((act, i) => (
                        <div key={i} className="text-slate-600 dark:text-slate-300 font-medium">
                          • {act}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleInviteLunch(overlap)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all hover:scale-[1.01]"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>밥/공강 약속 신청하기</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Visual Timetable Comparison Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Matrix Header & View Switcher */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-800/40">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>시간표 시각 비교 맵</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              초록색 빗금 영역은 양쪽 모두 일정이 없는 <strong className="text-emerald-600 dark:text-emerald-400">겹치는 공강</strong> 구간입니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs">
              <button
                onClick={() => setViewStyle('overlay')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  viewStyle === 'overlay'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>통합 오버레이</span>
              </button>

              <button
                onClick={() => setViewStyle('sideBySide')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  viewStyle === 'sideBySide'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>나란히 비교</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid Content */}
        {viewStyle === 'overlay' ? (
          /* OVERLAY VIEW */
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              
              {/* Day Headers */}
              <div className="grid grid-cols-[64px_repeat(5,1fr)] border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60">
                <div className="p-3 text-center text-xs font-semibold text-slate-400 border-r border-slate-200 dark:border-slate-800">
                  시간
                </div>
                {ALL_DAYS.map((day) => (
                  <div
                    key={day}
                    className="p-3 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-800"
                  >
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {DAY_NAMES[day]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grid Body */}
              <div className="relative grid grid-cols-[64px_repeat(5,1fr)]">
                
                {/* Hours column */}
                <div className="border-r border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/30">
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

                {/* Day columns with overlay courses & overlap zones */}
                {ALL_DAYS.map((day) => {
                  const myDayCourses = currentUser.schedule.filter((c) => c.day === day);
                  const comparedFriends = friends.filter((f) => selectedFriendIds.includes(f.id));
                  const dayOverlaps = overlappingFreePeriods.filter((o) => o.day === day);

                  return (
                    <div
                      key={day}
                      style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
                      className="relative border-r last:border-r-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      {/* Hour background lines */}
                      {Array.from({ length: TOTAL_HOURS }).map((_, idx) => (
                        <div
                          key={idx}
                          style={{ height: `${HOUR_HEIGHT}px` }}
                          className="border-b border-slate-100 dark:border-slate-800/60 border-dashed"
                        />
                      ))}

                      {/* 1. Highlighted Overlapping Free Period Stripes */}
                      {dayOverlaps.map((overlap) => {
                        const startM = timeToMinutes(overlap.startTime);
                        const endM = timeToMinutes(overlap.endTime);
                        const topM = startM - START_HOUR * 60;
                        const heightM = endM - startM;

                        if (topM < 0 || heightM <= 0) return null;

                        const topPx = (topM / 60) * HOUR_HEIGHT;
                        const heightPx = (heightM / 60) * HOUR_HEIGHT;

                        return (
                          <div
                            key={overlap.id}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                            }}
                            className="absolute inset-x-0 bg-stripes-overlap border-y-2 border-emerald-500/70 z-0 flex items-center justify-center p-1 cursor-pointer group"
                            title={`겹치는 공강: ${overlap.formattedDuration} (${overlap.startTime} ~ ${overlap.endTime})`}
                            onClick={() => handleInviteLunch(overlap)}
                          >
                            <div className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-xs flex items-center gap-1 group-hover:scale-105 transition-transform">
                              <Coffee className="w-3 h-3" />
                              <span>함께 공강 {overlap.formattedDuration}</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* 2. My Courses (Left half in overlay) */}
                      {myDayCourses.map((c) => {
                        const startM = timeToMinutes(c.startTime);
                        const endM = timeToMinutes(c.endTime);
                        const topM = startM - START_HOUR * 60;
                        const heightM = endM - startM;
                        const topPx = (topM / 60) * HOUR_HEIGHT;
                        const heightPx = (heightM / 60) * HOUR_HEIGHT;

                        return (
                          <div
                            key={`me-${c.id}`}
                            style={{
                              top: `${topPx + 1}px`,
                              height: `${heightPx - 2}px`,
                            }}
                            className="absolute left-1 right-1/2 mr-0.5 rounded-lg p-1.5 bg-indigo-500/90 text-white text-[11px] shadow-xs z-10 overflow-hidden flex flex-col justify-between"
                          >
                            <div>
                              <span className="font-bold leading-tight line-clamp-1">
                                {c.title}
                              </span>
                              <span className="text-[9px] opacity-80 block truncate">
                                [나] {c.room}
                              </span>
                            </div>
                            <span className="text-[9px] opacity-75 font-mono">
                              {c.startTime}
                            </span>
                          </div>
                        );
                      })}

                      {/* 3. Friend's Courses (Right half in overlay) */}
                      {comparedFriends.map((friend) => {
                        const friendCourses = friend.schedule.filter((c) => c.day === day);
                        return friendCourses.map((fc) => {
                          const startM = timeToMinutes(fc.startTime);
                          const endM = timeToMinutes(fc.endTime);
                          const topM = startM - START_HOUR * 60;
                          const heightM = endM - startM;
                          const topPx = (topM / 60) * HOUR_HEIGHT;
                          const heightPx = (heightM / 60) * HOUR_HEIGHT;

                          return (
                            <div
                              key={`friend-${friend.id}-${fc.id}`}
                              style={{
                                top: `${topPx + 1}px`,
                                height: `${heightPx - 2}px`,
                              }}
                              className="absolute left-1/2 right-1 ml-0.5 rounded-lg p-1.5 bg-purple-500/90 text-white text-[11px] shadow-xs z-10 overflow-hidden flex flex-col justify-between"
                            >
                              <div>
                                <span className="font-bold leading-tight line-clamp-1">
                                  {fc.title}
                                </span>
                                <span className="text-[9px] opacity-80 block truncate">
                                  [{friend.name}] {fc.room}
                                </span>
                              </div>
                              <span className="text-[9px] opacity-75 font-mono">
                                {fc.startTime}
                              </span>
                            </div>
                          );
                        });
                      })}

                    </div>
                  );
                })}

              </div>
            </div>
          </div>
        ) : (
          /* SIDE BY SIDE VIEW */
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* User A (Me) */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{currentUser.avatar}</span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {currentUser.name} (내 시간표)
                </span>
              </div>
              <div className="space-y-2">
                {ALL_DAYS.map((day) => {
                  const courses = currentUser.schedule.filter((c) => c.day === day);
                  return (
                    <div key={day} className="text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 w-8 inline-block">
                        {SHORT_DAY_NAMES[day]}:
                      </span>
                      {courses.length === 0 ? (
                        <span className="text-emerald-500 font-semibold">공강일</span>
                      ) : (
                        <span>
                          {courses.map((c) => `${c.title} (${c.startTime}~${c.endTime})`).join(', ')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User B (Friend) */}
            {primaryComparedFriend && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{primaryComparedFriend.avatar}</span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {primaryComparedFriend.name}의 시간표
                  </span>
                </div>
                <div className="space-y-2">
                  {ALL_DAYS.map((day) => {
                    const courses = primaryComparedFriend.schedule.filter((c) => c.day === day);
                    return (
                      <div key={day} className="text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 w-8 inline-block">
                          {SHORT_DAY_NAMES[day]}:
                        </span>
                        {courses.length === 0 ? (
                          <span className="text-emerald-500 font-semibold">공강일</span>
                        ) : (
                          <span>
                            {courses.map((c) => `${c.title} (${c.startTime}~${c.endTime})`).join(', ')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Legend Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/70 bg-slate-50/40 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-indigo-500" />
              <span>내 강의</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-purple-500" />
              <span>친구 강의</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-stripes-overlap border border-emerald-500" />
              <strong className="text-emerald-600 dark:text-emerald-400">
                겹치는 공강 시간
              </strong>
            </div>
          </div>
          <span>💡 겹치는 공강을 클릭하면 밥약속 메시지를 바로 복사할 수 있습니다.</span>
        </div>

      </div>

    </div>
  );
};
