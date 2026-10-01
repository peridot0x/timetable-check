import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Search,
  Sparkles,
  GitCompare,
  Trash2,
  BookOpen,
  Coffee,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateLiveStatus, formatDuration } from '../utils/timeCalculations';

interface FriendsManagerProps {
  onNavigateToCompare: () => void;
}

export const FriendsManager: React.FC<FriendsManagerProps> = ({ onNavigateToCompare }) => {
  const {
    currentUser,
    friends,
    addFriendByCode,
    removeFriend,
    setSelectedFriendIds,
    switchActiveUser,
    showToast,
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(currentUser.friendCode);
    setCopiedCode(true);
    showToast('내 친구 코드가 클립보드에 복사되었습니다!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const res = addFriendByCode(inputCode);
    if (res.success) {
      setInputCode('');
    } else {
      showToast(res.message);
    }
  };

  const handleCompareWith = (friendId: string) => {
    setSelectedFriendIds([friendId]);
    onNavigateToCompare();
  };

  // Filtered friends
  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.major.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.friendCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner: My Friend Code & Sharing */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentUser.avatar}</span>
              <div>
                <h2 className="text-xl font-black tracking-tight">{currentUser.name}의 친구 코드</h2>
                <p className="text-xs text-indigo-100 opacity-90">
                  친구가 이 코드를 등록하면 실시간으로 시간표를 비교하고 겹치는 공강을 함께 확인할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
              <span className="font-mono text-base sm:text-lg font-black tracking-wider text-emerald-300">
                {currentUser.friendCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white"
                title="친구 코드 복사"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Add Form by Code */}
          <form
            onSubmit={handleAddCodeSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20"
          >
            <input
              type="text"
              placeholder="친구 코드 입력 (예: GONG-7142-JM)"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-800 placeholder-slate-400 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>친구 추가</span>
            </button>
          </form>
        </div>
      </div>

      {/* Friends List Header & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              등록된 친구 목록 ({friends.length}명)
            </h3>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="이름 또는 학과로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Friends Cards */}
        {filteredFriends.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              등록된 친구가 없습니다.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              상단의 코드 입력창에서 친구 코드를 입력하여 추가해보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {filteredFriends.map((friend) => {
              const live = calculateLiveStatus(friend);
              const isFreeNow = live.statusType === 'in_free_period';
              const isInClass = live.statusType === 'in_class';

              return (
                <div
                  key={friend.id}
                  className="bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-2xl bg-white dark:bg-slate-900 shadow-xs border border-slate-100 dark:border-slate-800">
                          {friend.avatar}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                              {friend.name}
                            </h4>
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                              {friend.studentIdPrefix}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {friend.major} · <span className="font-mono">{friend.friendCode}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFriend(friend.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors"
                        title="친구 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bio */}
                    {friend.bio && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-3 bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl">
                        "{friend.bio}"
                      </p>
                    )}

                    {/* Real-time Status Badge */}
                    <div className="mt-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                        현재 실시간 상태
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isFreeNow
                              ? 'bg-emerald-500 animate-pulse'
                              : isInClass
                              ? 'bg-rose-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {isFreeNow
                            ? `지금 공강 중 (${live.currentFreePeriod?.formattedRemaining || '여유'})`
                            : isInClass
                            ? `수업 중: ${live.currentCourse?.title}`
                            : '일정 종료 / 자유 시간'}
                        </span>
                      </div>
                    </div>

                    {/* Schedule count */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      <span>등록된 수업: {friend.schedule.length}개 과목</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                    <button
                      onClick={() => handleCompareWith(friend.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>공강 비교하기</span>
                    </button>

                    <button
                      onClick={() => switchActiveUser(friend.id)}
                      className="py-2 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors"
                      title="이 친구 시점으로 시간표 보기"
                    >
                      시점 전환
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
