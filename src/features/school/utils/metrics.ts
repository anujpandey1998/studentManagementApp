import type { AttendanceStatus, UUID } from '../../../types/domain';

export interface AttendanceStatusRecord {
  student_id: UUID;
  status: AttendanceStatus;
}

export interface AttendanceSummary {
  student_id: UUID;
  attended_days: number;
  recorded_days: number;
}

export function attendancePercentage(
  attendedDays: number,
  recordedDays: number,
): number {
  if (recordedDays <= 0) {
    return 0;
  }
  return Math.round((attendedDays / recordedDays) * 100);
}

export function gradeForScore(score: number, maxMarks: number): string | null {
  if (
    !Number.isFinite(score) ||
    !Number.isFinite(maxMarks) ||
    maxMarks <= 0 ||
    score < 0 ||
    score > maxMarks
  ) {
    return null;
  }
  const percentage = (score / maxMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

export function summarizeAttendance(
  records: readonly AttendanceStatusRecord[],
): AttendanceSummary[] {
  const summary = new Map<UUID, AttendanceSummary>();
  for (const record of records) {
    if (record.status === 'excused') {
      continue;
    }
    const current = summary.get(record.student_id) ?? {
      student_id: record.student_id,
      attended_days: 0,
      recorded_days: 0,
    };
    current.recorded_days += 1;
    if (record.status === 'present' || record.status === 'late') {
      current.attended_days += 1;
    }
    summary.set(record.student_id, current);
  }
  return [...summary.values()];
}
