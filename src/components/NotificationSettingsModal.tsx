import React, { useState } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Moon,
  Clock,
  Send,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { requestNotificationPermission } from '../utils/notifications';
import { ALL_DAYS, DAY_NAMES, DayOfWeek } from '../types';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notificationSettings,
    updateNotificationSettings,
    notifications,
    markNotificationsAsRead,
    clearNotifications,
    sendTestNotification,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission>(() => {
    return 'Notification' in window ? Notification.permission : 'default';
  });

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if ('Notification' in window) {
      setBrowserPerm(Notification.permission);
    }
    if (granted) {
      showToast('브라우저 푸시 알림 권한이 허용되었습니다! 🎉');
    } else {
      showToast('브라우저 알림 권한이 거부되었거나 지원되지 않습니다.');
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    const current = notificationSettings.activeDays;
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    updateNotificationSettings({ activeDays: next });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                푸시 알림 및 맞춤 설정
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                공강 시간과 친구와의 약속 시간을 원하는 방식으로 알림 받으세요.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            알림 옵션 설정
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              markNotificationsAsRead();
            }}
            className={`pb-2.5 border-b-2 transition-colors relative ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            알림 수신 내역 ({notifications.length})
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-sm">
          {activeTab === 'settings' ? (
            <div className="space-y-5">
              
              {/* Browser Permission Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    <span>브라우저 데스크톱 푸시 권한:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        browserPerm === 'granted'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {browserPerm === 'granted' ? '허용됨 (정상)' : '권한 필요'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    화면을 보고 있지 않아도 시스템 팝업 알림을 받을 수 있습니다.
                  </p>
                </div>

                {browserPerm !== 'granted' && (
                  <button
                    onClick={handleRequestPermission}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
                  >
                    권한 허용하기
                  </button>
                )}
              </div>

              {/* Master Notification Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block">
                    알림 전체 사용
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    공강 및 수업 관련 모든 알림을 활성화합니다.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.enabled}
                    onChange={(e) => updateNotificationSettings({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Free Period Start Alerts */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block">
                        공강 시작 알림
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        수업이 끝나고 공강이 시작될 때 미리 알려줍니다.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnFreePeriodStart}
                    onChange={(e) =>
                      updateNotificationSettings({ notifyOnFreePeriodStart: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>

                {notificationSettings.notifyOnFreePeriodStart && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300">알림 타이밍:</span>
                    <select
                      value={notificationSettings.minutesBeforeFree}
                      onChange={(e) =>
                        updateNotificationSettings({ minutesBeforeFree: Number(e.target.value) })
                      }
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value={0}>정시 (공강 시작 즉시)</option>
                      <option value={5}>5분 전</option>
                      <option value={10}>10분 전</option>
                      <option value={15}>15분 전</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Mutual Free Period with Friends */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block">
                      친구와 겹치는 공강 시작 알림
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      친구와 함께 비는 공강 시간에 약속을 잡을 수 있도록 알림을 보냅니다.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnMutualFree}
                    onChange={(e) =>
                      updateNotificationSettings({ notifyOnMutualFree: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>
              </div>

              {/* Class Start Alerts */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block">
                      수업 시작 전 리마인더
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      공강을 즐기다가 수업에 늦지 않도록 사전 알림을 받습니다.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnClassStart}
                    onChange={(e) =>
                      updateNotificationSettings({ notifyOnClassStart: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>

                {notificationSettings.notifyOnClassStart && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300">수업 시작 전:</span>
                    <select
                      value={notificationSettings.minutesBeforeClass}
                      onChange={(e) =>
                        updateNotificationSettings({ minutesBeforeClass: Number(e.target.value) })
                      }
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value={5}>5분 전</option>
                      <option value={10}>10분 전</option>
                      <option value={15}>15분 전</option>
                      <option value={20}>20분 전</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Sound & Quiet Hours */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {notificationSettings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-indigo-500" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    )}
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block">
                        알림 효과음 (차임벨)
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        알림 수신 시 부드러운 멜로디 재생
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.soundEnabled}
                    onChange={(e) =>
                      updateNotificationSettings({ soundEnabled: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>

                {/* Quiet Hours */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-purple-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                        야간 방해금지 시간대
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.quietHoursEnabled}
                      onChange={(e) =>
                        updateNotificationSettings({ quietHoursEnabled: e.target.checked })
                      }
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                  </div>

                  {notificationSettings.quietHoursEnabled && (
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="time"
                        value={notificationSettings.quietHoursStart}
                        onChange={(e) =>
                          updateNotificationSettings({ quietHoursStart: e.target.value })
                        }
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      />
                      <span className="text-slate-400">부터</span>
                      <input
                        type="time"
                        value={notificationSettings.quietHoursEnd}
                        onChange={(e) =>
                          updateNotificationSettings({ quietHoursEnd: e.target.value })
                        }
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      />
                      <span className="text-slate-400">까지 무음</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Instant Test Buttons */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">
                  알림 즉시 테스트 발송:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => sendTestNotification('mutual_free')}
                    className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors text-left"
                  >
                    🍱 겹치는 공강 알림
                  </button>
                  <button
                    onClick={() => sendTestNotification('free_start')}
                    className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200 dark:border-indigo-800 transition-colors text-left"
                  >
                    🎉 공강 시작 알림
                  </button>
                  <button
                    onClick={() => sendTestNotification('class_start')}
                    className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-semibold text-xs border border-amber-200 dark:border-amber-800 transition-colors text-left"
                  >
                    🔔 수업 시작 리마인더
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>최근 받은 알림 내역입니다.</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>내역 전체 삭제</span>
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  받은 알림 내역이 비어있습니다.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs transition-colors"
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
};
