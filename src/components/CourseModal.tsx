import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Clock,
  Calendar,
  User,
  MapPin,
  Palette,
  FileText,
  Plus,
  Save,
} from 'lucide-react';
import { ALL_DAYS, Course, CourseCategory, DAY_NAMES, DayOfWeek } from '../types';
import { COLOR_PALETTE } from '../data/initialData';
import { timeToMinutes } from '../utils/timeCalculations';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (courseData: Omit<Course, 'id'>, existingId?: string) => void;
  editingCourse?: Course | null;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCourse,
}) => {
  const [title, setTitle] = useState('');
  const [day, setDay] = useState<DayOfWeek>('MON');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:30');
  const [room, setRoom] = useState('');
  const [professor, setProfessor] = useState('');
  const [category, setCategory] = useState<CourseCategory>('major');
  const [color, setColor] = useState('indigo');
  const [memo, setMemo] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingCourse) {
      setTitle(editingCourse.title);
      setDay(editingCourse.day);
      setStartTime(editingCourse.startTime);
      setEndTime(editingCourse.endTime);
      setRoom(editingCourse.room || '');
      setProfessor(editingCourse.professor || '');
      setCategory(editingCourse.category || 'major');
      setColor(editingCourse.color || 'indigo');
      setMemo(editingCourse.memo || '');
    } else {
      setTitle('');
      setDay('MON');
      setStartTime('10:00');
      setEndTime('11:30');
      setRoom('');
      setProfessor('');
      setCategory('major');
      setColor('indigo');
      setMemo('');
    }
    setErrorMsg(null);
  }, [editingCourse, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('강의명 또는 일정 제목을 입력해주세요.');
      return;
    }

    const startM = timeToMinutes(startTime);
    const endM = timeToMinutes(endTime);

    if (endM <= startM) {
      setErrorMsg('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    onSave(
      {
        title: title.trim(),
        day,
        startTime,
        endTime,
        room: room.trim() || undefined,
        professor: professor.trim() || undefined,
        category,
        color,
        memo: memo.trim() || undefined,
      },
      editingCourse?.id
    );

    onClose();
  };

  // Generate 30-min time slots from 09:00 to 20:00
  const timeOptions: string[] = [];
  for (let h = 9; h <= 20; h++) {
    timeOptions.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 20) {
      timeOptions.push(`${String(h).padStart(2, '0')}:30`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {editingCourse ? '강의 정보 수정' : '새 강의/일정 추가'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notice */}
        {errorMsg && (
          <div className="mt-4 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          
          {/* Title */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
              강의명 / 일정 제목 *
            </label>
            <input
              type="text"
              placeholder="예: 운영체제, 객체지향프로그래밍, 헬스"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              autoFocus
            />
          </div>

          {/* Day of Week */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
              요일 선택 *
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {ALL_DAYS.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDay(d)}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    day === d
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {DAY_NAMES[d].replace('요일', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Time: Start & End */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                시작 시간 *
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                {timeOptions.slice(0, -1).map((t) => (
                  <option key={`start-${t}`} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                종료 시간 *
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                {timeOptions.slice(1).map((t) => (
                  <option key={`end-${t}`} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Room & Professor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                강의실
              </label>
              <input
                type="text"
                placeholder="예: 공학관 301호"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
                교수명 / 주관
              </label>
              <input
                type="text"
                placeholder="예: 홍길동 교수"
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
              카테고리
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'major', label: '전공' },
                { id: 'general', label: '교양' },
                { id: 'study', label: '스터디' },
                { id: 'work', label: '알바/활동' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id as CourseCategory)}
                  className={`py-1.5 rounded-lg text-xs font-semibold ${
                    category === c.id
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color palette */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
              테마 색상
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PALETTE.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setColor(p.id)}
                  className={`w-7 h-7 rounded-full ${p.dot} transition-transform ${
                    color === p.id ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={p.name}
                />
              ))}
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-200 block mb-1">
              메모 (선택사항)
            </label>
            <input
              type="text"
              placeholder="예: 출석체크 엄격, 중간고사 과제 있음"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{editingCourse ? '수정 완료' : '시간표에 추가'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
