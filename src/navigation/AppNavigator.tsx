import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootStackParamList } from './types';

import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import TimetableScreen from '../screens/TimetableScreen';
import NoticesScreen from '../screens/NoticesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StudentListScreen from '../screens/StudentListScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen name="SignUp" component={SignUpScreen} />

        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />

        <Stack.Screen name="Timetable" component={TimetableScreen} />
        <Stack.Screen name="Notices" component={NoticesScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />

        <Stack.Screen
          name="StudentList"
          component={StudentListScreen}
          options={{ headerShown: true, title: 'Students' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
