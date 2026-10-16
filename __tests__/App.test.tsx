import { getHomeRouteName } from '../src/app/navigation/roleHomeRoute';

test.each([
  ['admin', 'AdminHome'],
  ['teacher', 'TeacherHome'],
  ['student', 'StudentHome'],
] as const)('maps %s only to its own home route', (role, route) => {
  expect(getHomeRouteName(role)).toBe(route);
});
