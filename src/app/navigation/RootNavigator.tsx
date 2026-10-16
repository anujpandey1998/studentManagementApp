import React from 'react';
import { useSelector } from 'react-redux';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootState } from '../../store';
import { theme } from '../../theme';
import { ForgotPasswordScreen } from '../../features/auth/screens/ForgotPasswordScreen';
import {
  AuthErrorScreen,
  AuthLoadingScreen,
} from '../../features/auth/screens/AuthStatusScreen';
import { SignInScreen } from '../../features/auth/screens/SignInScreen';
import { UpdatePasswordScreen } from '../../features/auth/screens/UpdatePasswordScreen';
import { RoleDashboardScreen } from '../../features/dashboard/screens/RoleDashboardScreen';
import { SchoolFeatureScreen } from '../../features/school/screens/SchoolFeatureScreen';
import type { Role } from '../../types/domain';
import type { RootStackParams } from './types';
import { getHomeRouteName } from './roleHomeRoute';

const Stack = createNativeStackNavigator<RootStackParams>();

function AdminHome() {
  return <RoleDashboardScreen role="admin" />;
}
function TeacherHome() {
  return <RoleDashboardScreen role="teacher" />;
}
function StudentHome() {
  return <RoleDashboardScreen role="student" />;
}

const homeScreens: Record<Role, React.ComponentType> = {
  admin: AdminHome,
  teacher: TeacherHome,
  student: StudentHome,
};

export function RootNavigator() {
  const { user, isHydrating, error, passwordRecovery } = useSelector(
    (state: RootState) => state.auth,
  );
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.colors.background,
          primary: theme.colors.primary,
          text: theme.colors.text,
        },
      }}
    >
      {isHydrating ? (
        <AuthLoadingScreen />
      ) : error ? (
        <AuthErrorScreen message={error} />
      ) : (
        <Stack.Navigator
          key={user ? `${user.id}:${user.role}` : 'signed-out'}
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: theme.colors.background },
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          {user && passwordRecovery ? (
            <Stack.Screen
              name="ResetPassword"
              component={UpdatePasswordScreen}
              options={{ title: 'Secure account recovery' }}
            />
          ) : user ? (
            <>
              <Stack.Screen
                name={getHomeRouteName(user.role)}
                component={homeScreens[user.role]}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="SchoolFeature"
                component={SchoolFeatureScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="SignIn"
                component={SignInScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
                options={{ title: 'Password recovery' }}
              />
            </>
          )}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
