import {
  attendancePercentage,
  gradeForScore,
  summarizeAttendance,
} from '../src/features/school/utils/metrics';

describe('attendance metrics', () => {
  it('excludes excused days and counts late arrivals as attended', () => {
    expect(
      summarizeAttendance([
        { student_id: 'student-1', status: 'present' },
        { student_id: 'student-1', status: 'late' },
        { student_id: 'student-1', status: 'absent' },
        { student_id: 'student-1', status: 'excused' },
      ]),
    ).toEqual([
      {
        student_id: 'student-1',
        attended_days: 2,
        recorded_days: 3,
      },
    ]);
  });

  it('returns zero when no attendance days are recorded', () => {
    expect(attendancePercentage(0, 0)).toBe(0);
  });

  it.each([
    [95, 100, 'A+'],
    [80, 100, 'A'],
    [72, 100, 'B'],
    [60, 100, 'C'],
    [45, 100, 'D'],
    [39, 100, 'F'],
  ] as const)('maps %i/%i to grade %s', (score, maxMarks, expectedGrade) => {
    expect(gradeForScore(score, maxMarks)).toBe(expectedGrade);
  });

  it('rejects impossible marks instead of assigning a grade', () => {
    expect(gradeForScore(101, 100)).toBeNull();
    expect(gradeForScore(10, 0)).toBeNull();
  });
});
