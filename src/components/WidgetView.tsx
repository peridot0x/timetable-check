import React, { useState, useEffect } from 'react';
import {
  Clock,
  Coffee,
  Sparkles,
  Users,
  Utensils,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Zap,
  Calendar,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { calculateLiveStatus, formatDuration } from '../utils/timeCalculations';
import { DAY_NAMES } from '../types';

interface WidgetViewProps {
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const WidgetView: React.FC<WidgetViewProps> = ({ isModal = false, onCloseModal }) => {
  const {
    currentUser,
    friends,
    overlappingFreePeriods,
    liveStatus,
    showToast,
  } = useApp();

  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Friends who are currently free right now!
  const freeFriendsRightNow = friends.filter((f) => {
    const st = calculateLiveStatus(f);
    return st.statusType === 'in_free_period';
  });

  // Today's mutual free periods with friends
  const todayMutualFree = overlappingFreePeriods.filter(
    (o) => o.day === liveStatus.currentDay
  );

  const handleQuickPing = (friendName: string) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    navigator.clipboard?.writeText(`[공강메이트] 지금 공강인데 같이 커피 한잔할래? ☕️`);
    showToast(`${friendName}님에게 보낼 공강 메시지가 복사되었습니다!`);
  };

  const widgetContent = (
    <div className={`space-y-5 ${isCompact ? 'max-w-xs' : 'max-w-2xl'} mx-auto transition-all`}>
      
      {/* 1. Hero Widget Card: Live Status & Next Class */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-xl border border-indigo-500/30">
        {/* Ambient glow decoration */}
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-44 h-44 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          
          {/* Top Bar inside widget */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
                실시간 공강 위젯
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-slate-200">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentTimeStr || '00:00:00'}</span>
              <span className="text-slate-400">({DAY_NAMES[liveStatus.currentDay]})</span>
            </div>
          </div>

          {/* Main Status Announcement */}
          <div className="mt-5">
            {liveStatus.statusType === 'in_free_period' ? (
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 inline-flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5" />
                  현재 꿀공강 진행 중
                </span>

                <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                  남은 공강:{' '}
                  <span className="text-emerald-400 font-extrabold underline decoration-emerald-500/50">
                    {liveStatus.currentFreePeriod?.formattedRemaining || '여유 시간'}
                  </span>
                </h2>

                {liveStatus.nextCourse ? (
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">다음 수업:</span>
                    <span>
                      {liveStatus.nextCourse.course.title} ({liveStatus.nextCourse.course.startTime} 시작,{' '}
                      {liveStatus.nextCourse.course.room})
                    </span>
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-300 mt-2">
                    🎉 오늘 남은 수업이 모두 끝났습니다!
                  </p>
                )}
              </div>
            ) : liveStatus.statusType === 'in_class' ? (
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 inline-flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  현재 수업 진행 중
                </span>

                <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                  {liveStatus.currentCourse?.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 mt-2">
                  강의실: {liveStatus.currentCourse?.room} · 종료 예정:{' '}
                  <strong className="text-emerald-400 font-mono">
                    {liveStatus.currentCourse?.endTime}
                  </strong>
                </p>
              </div>
            ) : (
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/40 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  자유 시간 / 수업 준비
                </span>

                <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                  오늘 하루도 알차게!
                </h2>

                {liveStatus.nextCourse && (
                  <p className="text-xs sm:text-sm text-slate-300 mt-2">
                    첫 수업 {liveStatus.nextCourse.course.title}이(가){' '}
                    <strong className="text-emerald-400">
                      {liveStatus.nextCourse.formattedStartsIn} 후
                    </strong>
                    에 시작합니다.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Stat Pill */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span>오늘 총 공강 시간:</span>
            <span className="font-bold text-emerald-400">
              {liveStatus.formattedTodayTotalFree}
            </span>
          </div>

        </div>
      </div>

      {/* 2. Friends Free Right Now Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              지금 바로 만날 수 있는 공강 친구 ({freeFriendsRightNow.length}명)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">실시간 연동</span>
        </div>

        {freeFriendsRightNow.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-400">
            현재 시간 기준 공강 중인 친구가 없습니다. (수업 중이거나 일정 종료)
          </div>
        ) : (
          <div className="space-y-2">
            {freeFriendsRightNow.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50 transition-all hover:shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{friend.avatar}</span>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                      {friend.name}
                    </h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      지금 공강 중! ({friend.major})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleQuickPing(friend.name)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  <Utensils className="w-3 h-3" />
                  <span>연락하기</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Today's Mutual Free Times */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              오늘 친구와 겹치는 공강 시간
            </h3>
          </div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            {todayMutualFree.length}개 구간
          </span>
        </div>

        {todayMutualFree.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-400">
            오늘은 친구들과 완전히 겹치는 공강 시간이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {todayMutualFree.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/50 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 font-mono">
                      {item.startTime} ~ {item.endTime}
                    </span>
                    {/* Explicitly formatted duration in "몇 시간 몇 분" */}
                    <span className="font-black px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[11px]">
                      {item.formattedDuration}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    함께 가능한 활동: {item.activitySuggestions[0]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );

  // If used inside floating modal
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
        <div className="bg-slate-100 dark:bg-slate-950 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>미니 플로팅 위젯 뷰</span>
            </h3>
            <button
              onClick={onCloseModal}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {widgetContent}
        </div>
      </div>
    );
  }

  // Normal dedicated Tab view
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            공강 위젯 모드
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            공부하거나 과제할 때 창 한쪽에 띄워두고 실시간 공강 시간과 친구 상태를 빠르게 확인하세요.
          </p>
        </div>

        <button
          onClick={() => setIsCompact(!isCompact)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
        >
          {isCompact ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          <span>{isCompact ? '와이드 모드' : '컴팩트 모드'}</span>
        </button>
      </div>

      {widgetContent}
    </div>
  );
};
