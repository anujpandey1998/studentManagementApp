export type Role = 'admin' | 'teacher' | 'student';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type UUID = string;
export interface SessionUser {
  id: UUID;
  instituteId: UUID;
  fullName: string;
  role: Role;
}
