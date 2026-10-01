import React, { useState } from 'react';
import {
  Bell,
  Cloud,
  Moon,
  Sun,
  LayoutGrid,
  Users,
  GitCompare,
  AppWindow,
  ChevronDown,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  activeTab: 'timetable' | 'compare' | 'friends' | 'widget';
  setActiveTab: (tab: 'timetable' | 'compare' | 'friends' | 'widget') => void;
  onOpenNotifications: () => void;
  onOpenBackup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNotifications,
  onOpenBackup,
}) => {
  const {
    currentUser,
    friends,
    switchActiveUser,
    theme,
    toggleTheme,
    unreadNotificationCount,
    setIsWidgetOpen,
    liveStatus,
  } = useApp();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Live Status Snippet */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('timetable')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent">
                    공강메이트
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    실시간
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  대학생 시간표 비교 & 겹치는 공강 찾기
                </p>
              </div>
            </div>

            {/* Current mini live chip */}
            <div className="hidden lg:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-xs border border-slate-200 dark:border-slate-700">
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                liveStatus.statusType === 'in_free_period' ? 'bg-emerald-500' : 'bg-indigo-500'
              }`} />
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {liveStatus.statusType === 'in_free_period'
                  ? `지금 공강 중 (${liveStatus.currentFreePeriod?.formattedRemaining || '여유'})`
                  : liveStatus.statusType === 'in_class'
                  ? `수업 중 (${liveStatus.currentCourse?.title})`
                  : '오늘 수업 준비'}
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('timetable')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'timetable'
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-200/60 dark:border-indigo-800/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              내 시간표 & 공강
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === 'compare'
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-200/60 dark:border-indigo-800/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              공강 비교 & 찾기
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 right-1" />
            </button>

            <button
              onClick={() => setActiveTab('friends')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'friends'
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-200/60 dark:border-indigo-800/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              친구 목록 ({friends.length})
            </button>

            <button
              onClick={() => setActiveTab('widget')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'widget'
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-200/60 dark:border-indigo-800/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <AppWindow className="w-4 h-4" />
              공강 위젯
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            
            {/* Quick Floating Widget Launcher */}
            <button
              onClick={() => setIsWidgetOpen(true)}
              title="플로팅 공강 위젯 띄우기"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors"
            >
              <AppWindow className="w-3.5 h-3.5" />
              <span>미니 위젯</span>
            </button>

            {/* Cloud Backup button */}
            <button
              onClick={onOpenBackup}
              title="클라우드 백업 및 복원"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Cloud className="w-5 h-5" />
            </button>

            {/* Notifications button */}
            <button
              onClick={onOpenNotifications}
              title="알림 설정 및 푸시 내역"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* User Profile Perspective Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <span className="text-xl leading-none">{currentUser.avatar}</span>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                    {currentUser.major}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setIsUserDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    프로필 시점 전환 (테스트용)
                  </div>
                  
                  {/* Current Active */}
                  <div className="px-3 py-2 bg-indigo-50/60 dark:bg-indigo-950/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{currentUser.avatar}</span>
                      <div>
                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          {currentUser.name} (현재 사용자)
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {currentUser.major} · {currentUser.friendCode}
                        </p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  </div>

                  {/* Friends profiles */}
                  <div className="max-h-56 overflow-y-auto py-1">
                    {friends.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => switchActiveUser(f.id)}
                        className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{f.avatar}</span>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {f.name} 시점으로 보기
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              {f.major} ({f.schedule.length}과목)
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-indigo-500 font-medium">전환</span>
                      </button>
                    ))}
                  </div>

                  <div className="px-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] text-slate-400">
                      💡 다른 친구 시점으로 전환하여 양방향 시간표 비교를 체험해보세요!
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('timetable')}
            className={`flex-1 py-1.5 text-center font-medium ${
              activeTab === 'timetable'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            내 시간표
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`flex-1 py-1.5 text-center font-medium ${
              activeTab === 'compare'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            공강 비교 ⚡️
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-1.5 text-center font-medium ${
              activeTab === 'friends'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            친구 ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('widget')}
            className={`flex-1 py-1.5 text-center font-medium ${
              activeTab === 'widget'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            위젯
          </button>
        </div>
      </div>
    </header>
  );
};
