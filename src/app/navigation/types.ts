import type { SchoolFeature } from '../../features/school/api/schoolApi';

export type RootStackParams = {
  SignIn: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  AdminHome: undefined;
  TeacherHome: undefined;
  StudentHome: undefined;
  SchoolFeature: { feature: SchoolFeature };
};
