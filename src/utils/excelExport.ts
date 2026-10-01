import * as XLSX from 'xlsx';
import { Course, DAY_NAMES, DayOfWeek, OverlappingFreePeriod, UserProfile } from '../types';
import { formatDuration, timeToMinutes } from './timeCalculations';

export interface ExcelExportOptions {
  user: UserProfile;
  friends: UserProfile[];
  overlappingFreePeriods: OverlappingFreePeriod[];
  myFreePeriods: Record<DayOfWeek, any[]>;
}

export function exportAllDataToExcel({
  user,
  friends,
  overlappingFreePeriods,
  myFreePeriods,
}: ExcelExportOptions): void {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: 내 강의 목록 (Courses List)
  const courseRows = user.schedule.map((c, idx) => {
    const duration = timeToMinutes(c.endTime) - timeToMinutes(c.startTime);
    return {
      'No': idx + 1,
      '강의명': c.title,
      '요일': DAY_NAMES[c.day],
      '시작 시간': c.startTime,
      '종료 시간': c.endTime,
      '강의 시간': formatDuration(duration),
      '강의실': c.room || '-',
      '담당 교수': c.professor || '-',
      '구분': c.category === 'major' ? '전공' : c.category === 'general' ? '교양' : c.category === 'study' ? '스터디' : '기타',
      '메모': c.memo || '',
    };
  });
  const wsCourses = XLSX.utils.json_to_sheet(courseRows);
  // Auto column widths
  wsCourses['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCourses, '내 시간표');

  // 2. Sheet 2: 겹치는 공강 시간표 (Overlapping Free Periods)
  const overlapRows = overlappingFreePeriods.map((o, idx) => {
    const friendNames = o.users
      .filter((u) => u.id !== user.id)
      .map((u) => u.name)
      .join(', ');

    return {
      'No': idx + 1,
      '요일': DAY_NAMES[o.day],
      '시작 시간': o.startTime,
      '종료 시간': o.endTime,
      '겹치는 공강 시간': o.formattedDuration,
      '함께 비는 친구': friendNames || '전체',
      '추천 활동': o.activitySuggestions.join(', '),
    };
  });
  const wsOverlap = XLSX.utils.json_to_sheet(overlapRows.length > 0 ? overlapRows : [
    { '알림': '현재 선택된 친구와 겹치는 공강 시간이 없습니다.' }
  ]);
  wsOverlap['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsOverlap, '친구와 겹치는 공강');

  // 3. Sheet 3: 내 공강 시간 분석 (My Free Periods)
  const freePeriodRows: any[] = [];
  const days: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  let freeIdx = 1;

  days.forEach((day) => {
    const list = myFreePeriods[day] || [];
    list.forEach((fp) => {
      const typeLabel =
        fp.type === 'between_classes'
          ? '수업 사이 공강 (꿀공강/우주공강)'
          : fp.type === 'morning_empty'
          ? '아침 공강'
          : '오후 수업 종료 후 공강';

      freePeriodRows.push({
        'No': freeIdx++,
        '요일': DAY_NAMES[day],
        '시작 시간': fp.startTime,
        '종료 시간': fp.endTime,
        '공강 시간': fp.formattedDuration,
        '공강 구분': typeLabel,
      });
    });
  });

  const wsFree = XLSX.utils.json_to_sheet(freePeriodRows);
  wsFree['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsFree, '내 공강 분석');

  // 4. Sheet 4: 시간표 주간 매트릭스 그리드 뷰 (Visual Matrix in Excel)
  const hours = Array.from({ length: 10 }, (_, i) => 9 + i); // 09:00 to 18:00
  const matrixData: any[] = [];

  hours.forEach((h) => {
    const timeLabel = `${String(h).padStart(2, '0')}:00 ~ ${String(h + 1).padStart(2, '0')}:00`;
    const rowObj: any = { '시간대': timeLabel };

    days.forEach((day) => {
      const hStart = h * 60;
      const hEnd = (h + 1) * 60;
      // Find course running in this hour
      const matchingCourse = user.schedule.find((c) => {
        if (c.day !== day) return false;
        const cStart = timeToMinutes(c.startTime);
        const cEnd = timeToMinutes(c.endTime);
        return Math.max(hStart, cStart) < Math.min(hEnd, cEnd);
      });

      if (matchingCourse) {
        rowObj[DAY_NAMES[day]] = `${matchingCourse.title} (${matchingCourse.startTime}~${matchingCourse.endTime}${matchingCourse.room ? ' / ' + matchingCourse.room : ''})`;
      } else {
        rowObj[DAY_NAMES[day]] = '공강';
      }
    });

    matrixData.push(rowObj);
  });

  const wsMatrix = XLSX.utils.json_to_sheet(matrixData);
  wsMatrix['!cols'] = [
    { wch: 16 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMatrix, '주간 시간표 표형식');

  // 5. Sheet 5: 등록된 친구 목록 (Friends List)
  const friendRows = friends.map((f, idx) => ({
    'No': idx + 1,
    '이름': f.name,
    '학과': f.major,
    '학번': f.studentIdPrefix,
    '친구 코드': f.friendCode,
    '등록 강의 수': f.schedule.length,
    '상태 메시지': f.bio || '',
  }));
  const wsFriends = XLSX.utils.json_to_sheet(friendRows);
  wsFriends['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 18 },
    { wch: 10 },
    { wch: 18 },
    { wch: 14 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsFriends, '친구 목록');

  // Write and trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `공강메이트_${user.name}_시간표및공강데이터_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
