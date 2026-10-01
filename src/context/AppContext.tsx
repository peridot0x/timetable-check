import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  AppNotification,
  CloudBackupItem,
  Course,
  DayOfWeek,
  FreePeriod,
  NotificationSettings,
  OverlappingFreePeriod,
  UserProfile,
} from '../types';
import {
  INITIAL_FRIENDS,
  INITIAL_NOTIFICATION_SETTINGS,
  INITIAL_USER,
} from '../data/initialData';
import {
  calculateLiveStatus,
  calculateUserFreePeriods,
  findOverlappingFreePeriods,
  getCurrentDayOfWeek,
  LiveStatus,
} from '../utils/timeCalculations';
import { playChimeSound, triggerNotification } from '../utils/notifications';
import { exportAllDataToExcel } from '../utils/excelExport';

interface AppContextType {
  currentUser: UserProfile;
  friends: UserProfile[];
  allProfiles: UserProfile[];
  selectedFriendIds: string[];
  setSelectedFriendIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleFriendSelection: (friendId: string) => void;
  primaryComparedFriend: UserProfile | null;
  overlappingFreePeriods: OverlappingFreePeriod[];
  myFreePeriods: Record<DayOfWeek, FreePeriod[]>;
  liveStatus: LiveStatus;
  
  // Theme & Appearance
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Timetable editing
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (courseId: string) => void;
  
  // Friend Management
  addFriendByCode: (code: string) => { success: boolean; message: string };
  addNewFriendManually: (friend: Omit<UserProfile, 'id' | 'updatedAt' | 'friendCode'>) => void;
  removeFriend: (friendId: string) => void;
  switchActiveUser: (userId: string) => void;
  
  // Notifications
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (newSettings: Partial<NotificationSettings>) => void;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationsAsRead: () => void;
  clearNotifications: () => void;
  sendTestNotification: (kind: 'free_start' | 'mutual_free' | 'class_start') => void;
  
  // Widgets
  isWidgetOpen: boolean;
  setIsWidgetOpen: (open: boolean) => void;
  widgetViewMode: 'floating' | 'embedded' | 'fullscreen';
  setWidgetViewMode: (mode: 'floating' | 'embedded' | 'fullscreen') => void;
  
  // Cloud Backup
  backups: CloudBackupItem[];
  createBackup: (name?: string) => void;
  restoreBackup: (backupId: string) => void;
  deleteBackup: (backupId: string) => void;
  exportDataJson: () => string;
  exportDataToExcel: () => void;
  importDataJson: (jsonStr: string) => { success: boolean; message: string };
  resetDefaultData: () => void;
  
  // Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const STORAGE_KEYS = {
  CURRENT_USER: 'gonggang_current_user_v1',
  FRIENDS: 'gonggang_friends_v1',
  THEME: 'gonggang_theme_v1',
  SETTINGS: 'gonggang_notif_settings_v1',
  NOTIFICATIONS: 'gonggang_notifs_v1',
  BACKUPS: 'gonggang_backups_v1',
};

const AppContext = createContext<AppContextType | null>(null);

// BroadcastChannel for cross-tab real-time sync
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('gonggang_sync_channel');
  }
} catch {
  // ignore
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // 2. Current User & Friends
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_USER;
  });

  const [friends, setFriends] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FRIENDS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_FRIENDS;
  });

  // Selected friends for comparison (defaults to first friend if available)
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(() => {
    return friends.length > 0 ? [friends[0].id] : [];
  });

  // 3. Notification Settings & In-App Notifications
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return { ...INITIAL_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return INITIAL_NOTIFICATION_SETTINGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'notif-welcome',
        title: '🎉 공강메이트에 오신 것을 환영합니다!',
        message: '친구를 추가하고 실시간으로 겹치는 공강 시간을 확인해보세요.',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'schedule_sync',
      },
      {
        id: 'notif-sample-mutual',
        title: '🍱 [오늘 공강] 이지민 친구와 겹치는 공강 발견!',
        message: '화요일 12:00 ~ 15:00 (3시간) 함께 식사나 과제를 할 수 있습니다.',
        timestamp: '방금 전',
        read: false,
        type: 'mutual_free',
      },
    ];
  });

  // 4. Cloud Backups
  const [backups, setBackups] = useState<CloudBackupItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BACKUPS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'backup-initial',
        timestamp: new Date().toLocaleString('ko-KR'),
        name: '2026학년도 2학기 기본 시간표',
        profileName: '김민우',
        coursesCount: INITIAL_USER.schedule.length,
        sizeKb: 1.8,
        autoBackup: true,
        snapshot: {
          profile: INITIAL_USER,
          friends: INITIAL_FRIENDS,
          settings: INITIAL_NOTIFICATION_SETTINGS,
        },
      },
    ];
  });

  // 5. Toast System
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  }, []);

  // 6. Widget State
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [widgetViewMode, setWidgetViewMode] = useState<'floating' | 'embedded' | 'fullscreen'>('floating');

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends));
  }, [friends]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
  }, [backups]);

  // Real-time BroadcastChannel synchronization
  const broadcastSync = useCallback((actionType: string) => {
    if (syncChannel) {
      syncChannel.postMessage({ type: actionType, timestamp: Date.now() });
    }
  }, []);

  useEffect(() => {
    if (!syncChannel) return;
    const handleSyncMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SCHEDULE_UPDATED') {
        showToast('⚡ 다른 기기/창에서 시간표가 변경되어 실시간 동기화되었습니다.');
        // Reload fresh storage
        try {
          const freshUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
          const freshFriends = localStorage.getItem(STORAGE_KEYS.FRIENDS);
          if (freshUser) setCurrentUser(JSON.parse(freshUser));
          if (freshFriends) setFriends(JSON.parse(freshFriends));
        } catch {
          // ignore
        }
      }
    };
    syncChannel.addEventListener('message', handleSyncMessage);
    return () => {
      syncChannel?.removeEventListener('message', handleSyncMessage);
    };
  }, [showToast]);

  // Computed: All available profiles for switching perspective
  const allProfiles = useMemo(() => {
    return [currentUser, ...friends];
  }, [currentUser, friends]);

  // Computed: Primary compared friend
  const primaryComparedFriend = useMemo(() => {
    if (selectedFriendIds.length === 0) return null;
    return friends.find((f) => f.id === selectedFriendIds[0]) || null;
  }, [selectedFriendIds, friends]);

  // Computed: Overlapping free periods between currentUser and selected friends
  const overlappingFreePeriods = useMemo(() => {
    const comparedUsers = [
      currentUser,
      ...friends.filter((f) => selectedFriendIds.includes(f.id)),
    ];
    if (comparedUsers.length < 2) return [];
    return findOverlappingFreePeriods(comparedUsers, 20);
  }, [currentUser, friends, selectedFriendIds]);

  // Computed: My free periods by day
  const myFreePeriods = useMemo(() => {
    const days: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    const map: Record<DayOfWeek, FreePeriod[]> = {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
    };
    days.forEach((day) => {
      map[day] = calculateUserFreePeriods(currentUser.schedule, day);
    });
    return map;
  }, [currentUser.schedule]);

  // Computed: Live real-time status (tick every 30 seconds)
  const [liveNow, setLiveNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveNow(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const liveStatus = useMemo(() => {
    return calculateLiveStatus(currentUser, liveNow);
  }, [currentUser, liveNow]);

  // Toggle friend selection for comparison
  const toggleFriendSelection = useCallback((friendId: string) => {
    setSelectedFriendIds((prev) => {
      if (prev.includes(friendId)) {
        return prev.filter((id) => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  }, []);

  // Course actions
  const addCourse = useCallback(
    (courseData: Omit<Course, 'id'>) => {
      const newCourse: Course = {
        ...courseData,
        id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      setCurrentUser((prev) => {
        const updated = {
          ...prev,
          schedule: [...prev.schedule, newCourse],
          updatedAt: new Date().toISOString(),
        };
        return updated;
      });
      showToast(`'${courseData.title}' 강의가 시간표에 추가되었습니다.`);
      broadcastSync('SCHEDULE_UPDATED');
    },
    [showToast, broadcastSync]
  );

  const updateCourse = useCallback(
    (course: Course) => {
      setCurrentUser((prev) => ({
        ...prev,
        schedule: prev.schedule.map((c) => (c.id === course.id ? course : c)),
        updatedAt: new Date().toISOString(),
      }));
      showToast(`'${course.title}' 강의 정보가 수정되었습니다.`);
      broadcastSync('SCHEDULE_UPDATED');
    },
    [showToast, broadcastSync]
  );

  const deleteCourse = useCallback(
    (courseId: string) => {
      const target = currentUser.schedule.find((c) => c.id === courseId);
      setCurrentUser((prev) => ({
        ...prev,
        schedule: prev.schedule.filter((c) => c.id !== courseId),
        updatedAt: new Date().toISOString(),
      }));
      if (target) {
        showToast(`'${target.title}' 강의가 삭제되었습니다.`);
      }
      broadcastSync('SCHEDULE_UPDATED');
    },
    [currentUser.schedule, showToast, broadcastSync]
  );

  // Friend actions
  const addFriendByCode = useCallback(
    (code: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) {
        return { success: false, message: '친구 코드를 입력해주세요.' };
      }
      if (trimmed === currentUser.friendCode) {
        return { success: false, message: '본인의 친구 코드는 추가할 수 없습니다.' };
      }
      if (friends.some((f) => f.friendCode === trimmed)) {
        return { success: false, message: '이미 추가된 친구입니다.' };
      }

      // Check if it matches any pre-known or generate a friendly peer
      const matched = INITIAL_FRIENDS.find((f) => f.friendCode === trimmed);
      const newFriend: UserProfile = matched
        ? { ...matched, id: `friend-${Date.now()}` }
        : {
            id: `friend-${Date.now()}`,
            name: `새 친구 (${trimmed.slice(-4)})`,
            avatar: '🎓',
            major: '자유전공학부',
            studentIdPrefix: '24학번',
            friendCode: trimmed,
            bio: '시간표를 공유하고 함께 공강을 즐겨요!',
            updatedAt: new Date().toISOString(),
            schedule: [
              {
                id: `nc-1-${Date.now()}`,
                title: '교양 글쓰기',
                room: '인문관 201호',
                day: 'MON',
                startTime: '10:00',
                endTime: '11:30',
                color: 'sky',
                category: 'general',
              },
              {
                id: `nc-2-${Date.now()}`,
                title: '대학 수학',
                room: '자연관 301호',
                day: 'TUE',
                startTime: '13:00',
                endTime: '14:30',
                color: 'amber',
                category: 'major',
              },
              {
                id: `nc-3-${Date.now()}`,
                title: '디지털 사회와 윤리',
                room: '사회관 105호',
                day: 'THU',
                startTime: '10:30',
                endTime: '12:00',
                color: 'emerald',
                category: 'general',
              },
            ],
          };

      setFriends((prev) => [...prev, newFriend]);
      setSelectedFriendIds((prev) => [...prev, newFriend.id]);

      // Push notification & history
      const newNotif: AppNotification = {
        id: `notif-friend-${Date.now()}`,
        title: '🤝 새 친구 추가 완료!',
        message: `${newFriend.name}님과 친구가 되었습니다. 시간표를 비교해보세요!`,
        timestamp: '방금 전',
        read: false,
        type: 'friend_add',
      };
      setNotifications((prev) => [newNotif, ...prev]);

      showToast(`'${newFriend.name}'님이 친구 목록에 추가되었습니다!`);
      broadcastSync('SCHEDULE_UPDATED');
      return { success: true, message: `'${newFriend.name}'님을 친구로 등록했습니다!` };
    },
    [currentUser.friendCode, friends, showToast, broadcastSync]
  );

  const addNewFriendManually = useCallback(
    (friendData: Omit<UserProfile, 'id' | 'updatedAt' | 'friendCode'>) => {
      const newFriend: UserProfile = {
        ...friendData,
        id: `friend-${Date.now()}`,
        friendCode: `GONG-${Math.floor(1000 + Math.random() * 9000)}-${friendData.name.slice(0, 2).toUpperCase()}`,
        updatedAt: new Date().toISOString(),
      };
      setFriends((prev) => [...prev, newFriend]);
      setSelectedFriendIds((prev) => [...prev, newFriend.id]);
      showToast(`'${newFriend.name}' 친구가 생성되어 등록되었습니다.`);
      broadcastSync('SCHEDULE_UPDATED');
    },
    [showToast, broadcastSync]
  );

  const removeFriend = useCallback(
    (friendId: string) => {
      const friend = friends.find((f) => f.id === friendId);
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      setSelectedFriendIds((prev) => prev.filter((id) => id !== friendId));
      if (friend) {
        showToast(`'${friend.name}' 친구를 삭제했습니다.`);
      }
      broadcastSync('SCHEDULE_UPDATED');
    },
    [friends, showToast, broadcastSync]
  );

  // Switch perspective: easily test how the app looks from another friend's perspective
  const switchActiveUser = useCallback(
    (targetUserId: string) => {
      if (targetUserId === currentUser.id) return;
      const targetUser = friends.find((f) => f.id === targetUserId);
      if (!targetUser) return;

      const previousUser = currentUser;
      const newFriends = [previousUser, ...friends.filter((f) => f.id !== targetUserId)];

      setCurrentUser(targetUser);
      setFriends(newFriends);
      setSelectedFriendIds([previousUser.id]);
      showToast(`'${targetUser.name}' 프로필 시점으로 전환되었습니다.`);
      broadcastSync('SCHEDULE_UPDATED');
    },
    [currentUser, friends, showToast, broadcastSync]
  );

  // Notifications Settings
  const updateNotificationSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      return updated;
    });
  }, []);

  const markNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const sendTestNotification = useCallback(
    (kind: 'free_start' | 'mutual_free' | 'class_start') => {
      let title = '';
      let body = '';

      if (kind === 'mutual_free') {
        const friend = friends[0]?.name || '이지민';
        title = `🍱 [공강 알림] ${friend} 친구와 함께 비는 공강입니다!`;
        body = `화요일 12:00 ~ 15:00 (3시간) 동안 함께 점심 먹고 카페 갈 수 있어요!`;
      } else if (kind === 'free_start') {
        title = `🎉 [공강 시작 알림] 지금부터 2시간 30분 공강입니다!`;
        body = `다음 강의(대학 영어회화)는 14:00에 시작합니다. 편안한 시간 보내세요.`;
      } else {
        title = `🔔 [수업 시작 알림] 10분 후 '자료구조' 수업이 시작됩니다!`;
        body = `강의실: 공학관 301호 (이정훈 교수님)`;
      }

      triggerNotification(
        title,
        {
          body,
          tag: `test-${kind}-${Date.now()}`,
        },
        notificationSettings
      );

      const notifItem: AppNotification = {
        id: `notif-${Date.now()}`,
        title,
        message: body,
        timestamp: '방금 전',
        read: false,
        type: kind,
      };
      setNotifications((prev) => [notifItem, ...prev]);
      showToast('푸시 알림 테스트가 성공적으로 전송되었습니다.');
    },
    [friends, notificationSettings, showToast]
  );

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Cloud Backups
  const createBackup = useCallback(
    (customName?: string) => {
      const newBackup: CloudBackupItem = {
        id: `backup-${Date.now()}`,
        timestamp: new Date().toLocaleString('ko-KR'),
        name: customName || `${currentUser.name}의 시간표 백업 (${new Date().toLocaleDateString('ko-KR')})`,
        profileName: currentUser.name,
        coursesCount: currentUser.schedule.length,
        sizeKb: Number((JSON.stringify({ currentUser, friends }).length / 1024).toFixed(1)),
        autoBackup: false,
        snapshot: {
          profile: currentUser,
          friends,
          settings: notificationSettings,
        },
      };

      setBackups((prev) => [newBackup, ...prev]);
      showToast('☁️ 클라우드 백업이 안전하게 완료되었습니다.');
    },
    [currentUser, friends, notificationSettings, showToast]
  );

  const restoreBackup = useCallback(
    (backupId: string) => {
      const found = backups.find((b) => b.id === backupId);
      if (!found) {
        showToast('해당 백업 데이터를 찾을 수 없습니다.');
        return;
      }

      setCurrentUser(found.snapshot.profile);
      setFriends(found.snapshot.friends);
      setNotificationSettings(found.snapshot.settings);
      showToast(`'${found.name}' 백업 데이터로 시간표가 복원되었습니다.`);
      broadcastSync('SCHEDULE_UPDATED');
    },
    [backups, showToast, broadcastSync]
  );

  const deleteBackup = useCallback(
    (backupId: string) => {
      setBackups((prev) => prev.filter((b) => b.id !== backupId));
      showToast('백업 항목이 삭제되었습니다.');
    },
    [showToast]
  );

  const exportDataJson = useCallback(() => {
    const exportBundle = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: currentUser,
      friends,
      settings: notificationSettings,
      backups,
    };
    return JSON.stringify(exportBundle, null, 2);
  }, [currentUser, friends, notificationSettings, backups]);

  const exportDataToExcel = useCallback(() => {
    try {
      exportAllDataToExcel({
        user: currentUser,
        friends,
        overlappingFreePeriods,
        myFreePeriods,
      });
      showToast('📊 엑셀(.xlsx) 파일 저장이 완료되었습니다!');
    } catch (err: any) {
      showToast('엑셀 저장 중 오류가 발생했습니다: ' + (err?.message || '알 수 없음'));
    }
  }, [currentUser, friends, overlappingFreePeriods, myFreePeriods, showToast]);

  const importDataJson = useCallback(
    (jsonStr: string) => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (!parsed.user || !parsed.user.schedule) {
          return { success: false, message: '올바른 시간표 백업 파일 형식이 아닙니다.' };
        }
        setCurrentUser(parsed.user);
        if (Array.isArray(parsed.friends)) {
          setFriends(parsed.friends);
        }
        if (parsed.settings) {
          setNotificationSettings(parsed.settings);
        }
        if (Array.isArray(parsed.backups)) {
          setBackups(parsed.backups);
        }
        showToast('📦 백업 파일에서 시간표와 친구 목록을 모두 성공적으로 불러왔습니다!');
        broadcastSync('SCHEDULE_UPDATED');
        return { success: true, message: '불러오기 완료' };
      } catch (err: any) {
        return { success: false, message: 'JSON 파싱 오류: ' + (err?.message || '알 수 없는 에러') };
      }
    },
    [showToast, broadcastSync]
  );

  const resetDefaultData = useCallback(() => {
    setCurrentUser(INITIAL_USER);
    setFriends(INITIAL_FRIENDS);
    setSelectedFriendIds([INITIAL_FRIENDS[0].id]);
    setNotificationSettings(INITIAL_NOTIFICATION_SETTINGS);
    showToast('초기 기본 시간표 및 샘플 친구 데이터로 재설정되었습니다.');
    broadcastSync('SCHEDULE_UPDATED');
  }, [showToast, broadcastSync]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        friends,
        allProfiles,
        selectedFriendIds,
        setSelectedFriendIds,
        toggleFriendSelection,
        primaryComparedFriend,
        overlappingFreePeriods,
        myFreePeriods,
        liveStatus,
        theme,
        toggleTheme,
        addCourse,
        updateCourse,
        deleteCourse,
        addFriendByCode,
        addNewFriendManually,
        removeFriend,
        switchActiveUser,
        notificationSettings,
        updateNotificationSettings,
        notifications,
        unreadNotificationCount,
        markNotificationsAsRead,
        clearNotifications,
        sendTestNotification,
        isWidgetOpen,
        setIsWidgetOpen,
        widgetViewMode,
        setWidgetViewMode,
        backups,
        createBackup,
        restoreBackup,
        deleteBackup,
        exportDataJson,
        exportDataToExcel,
        importDataJson,
        resetDefaultData,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
