import type { Role } from '../../types/domain';

export type HomeRouteName = 'AdminHome' | 'TeacherHome' | 'StudentHome';

export function getHomeRouteName(role: Role): HomeRouteName {
  switch (role) {
    case 'admin':
      return 'AdminHome';
    case 'teacher':
      return 'TeacherHome';
    case 'student':
      return 'StudentHome';
  }
}
