/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { TimetableGrid } from './components/TimetableGrid';
import { ComparisonView } from './components/ComparisonView';
import { FriendsManager } from './components/FriendsManager';
import { WidgetView } from './components/WidgetView';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { CloudBackupModal } from './components/CloudBackupModal';
import { CourseModal } from './components/CourseModal';
import { Course } from './types';
import { Sparkles, Heart } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    toastMessage,
    isWidgetOpen,
    setIsWidgetOpen,
    addCourse,
    updateCourse,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'timetable' | 'compare' | 'friends' | 'widget'>('compare');
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const handleOpenAddCourse = () => {
    setEditingCourse(null);
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = (courseData: Omit<Course, 'id'>, existingId?: string) => {
    if (existingId) {
      updateCourse({
        ...courseData,
        id: existingId,
      });
    } else {
      addCourse(courseData);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* 1. Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setIsNotifModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      {/* 2. Main Page Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'timetable' && (
          <TimetableGrid
            onAddCourse={handleOpenAddCourse}
            onEditCourse={handleOpenEditCourse}
          />
        )}

        {activeTab === 'compare' && <ComparisonView />}

        {activeTab === 'friends' && (
          <FriendsManager onNavigateToCompare={() => setActiveTab('compare')} />
        )}

        {activeTab === 'widget' && <WidgetView />}
      </main>

      {/* 3. Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-slate-700 dark:text-slate-300">
              공강메이트 (SyncGap)
            </span>
            <span>· 대학생 실시간 공강 시간표 비교 & 푸시 알림 & 위젯 웹앱</span>
          </div>
          <div className="flex items-center gap-1">
            <span>스마트한 대학 생활을 위한 시간 관리 파트너</span>
          </div>
        </div>
      </footer>

      {/* 4. Modals */}
      <NotificationSettingsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />

      <CloudBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />

      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => {
          setIsCourseModalOpen(false);
          setEditingCourse(null);
        }}
        onSave={handleSaveCourse}
        editingCourse={editingCourse}
      />

      {/* 5. Floating Widget Modal if triggered from header */}
      {isWidgetOpen && (
        <WidgetView isModal onCloseModal={() => setIsWidgetOpen(false)} />
      )}

      {/* 6. Toast Notification Floating Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="px-5 py-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 border border-slate-700 dark:border-slate-300">
            <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
