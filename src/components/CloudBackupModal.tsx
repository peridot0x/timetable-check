import React, { useState, useRef } from 'react';
import {
  Cloud,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Calendar,
  HardDrive,
  FileJson,
  FileSpreadsheet,
  X,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CloudBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudBackupModal: React.FC<CloudBackupModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    backups,
    createBackup,
    restoreBackup,
    deleteBackup,
    exportDataJson,
    exportDataToExcel,
    importDataJson,
    resetDefaultData,
    showToast,
  } = useApp();

  const [backupNameInput, setBackupNameInput] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createBackup(backupNameInput.trim() || undefined);
    setBackupNameInput('');
  };

  const handleDownloadJson = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gonggang_backup_${currentUser.name}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('시간표 백업 JSON 파일이 다운로드되었습니다.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataJson(content);
      if (!res.success) {
        showToast(res.message);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleTextImport = () => {
    if (!importJsonText.trim()) return;
    const res = importDataJson(importJsonText);
    if (res.success) {
      setImportJsonText('');
      setShowImportArea(false);
    } else {
      showToast(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                데이터 백업 & 안전 복원
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                시간표, 친구 목록, 알림 설정을 클라우드에 백업하고 언제든 복원하세요.
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 text-sm">
          
          {/* Cloud Status Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-500 text-white">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  클라우드 스토리지 활성화됨
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  현재 사용자: {currentUser.name} ({currentUser.schedule.length}개 강의 보관 중)
                </p>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              보안 암호화
            </span>
          </div>

          {/* Create Backup Form */}
          <form onSubmit={handleCreate} className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
              새 클라우드 백업 생성
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="백업 이름 (예: 2학기 중간고사 이후 시간표)"
                value={backupNameInput}
                onChange={(e) => setBackupNameInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
              >
                지금 백업하기
              </button>
            </div>
          </form>

          {/* Backup History List */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
              저장된 백업 기록 ({backups.length}개)
            </span>

            {backups.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-400">
                아직 생성된 백업이 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {backups.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                          {b.name}
                        </span>
                        {b.autoBackup && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            기본
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {b.timestamp} · 강의 {b.coursesCount}개 · {b.sizeKb}KB
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => restoreBackup(b.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200 dark:border-indigo-800 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>복원</span>
                      </button>

                      <button
                        onClick={() => deleteBackup(b.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="백업 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Excel Export Feature Block */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    엑셀(.xlsx) 파일로 전체 데이터 저장
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    내 시간표, 친구와 겹치는 공강, 공강 분석, 주간 매트릭스 표, 친구 목록을 엑셀로 한 번에 다운로드합니다.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={exportDataToExcel}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>엑셀(.xlsx) 파일 즉시 다운로드 & 저장</span>
            </button>
          </div>

          {/* Export & Import Files */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
              로컬 파일 내보내기 / 불러오기:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleDownloadJson}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>JSON 파일로 내보내기</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
              >
                <Upload className="w-4 h-4 text-indigo-500" />
                <span>JSON 파일 불러오기</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Toggle direct paste text import */}
            <button
              onClick={() => setShowImportArea(!showImportArea)}
              className="text-xs text-indigo-500 hover:underline block"
            >
              {showImportArea ? '▲ 텍스트 입력창 접기' : '▼ 백업 텍스트 직접 붙여넣기'}
            </button>

            {showImportArea && (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  placeholder="내보냈던 JSON 백업 코드를 여기에 붙여넣으세요..."
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-100"
                />
                <button
                  onClick={handleTextImport}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                >
                  텍스트 데이터 복원 실행
                </button>
              </div>
            )}
          </div>

          {/* Reset System default */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                if (window.confirm('기본 대학생 시간표 샘플 데이터로 초기화하시겠습니까?')) {
                  resetDefaultData();
                }
              }}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
            >
              ⚠️ 초기 기본 시간표 및 샘플 친구 데이터로 재설정
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
