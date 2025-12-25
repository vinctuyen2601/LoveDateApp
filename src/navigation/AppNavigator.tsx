import React, { createRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../store/AuthContext';
import { COLORS } from '../constants/colors';
import AuthScreen from '../screens/AuthScreen';
import TabNavigator from './TabNavigator';
import AddEventScreen from '../screens/AddEventScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import EventsListScreen from '../screens/EventsListScreen';
import MBTISurveyScreen from '../screens/MBTISurveyScreen';

const Stack = createStackNavigator();

// Navigation ref for accessing navigation outside React components
export const navigationRef = createRef<any>();

export function navigate(name: string, params?: any) {
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  }
}

const AppNavigator: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    // Show splash screen while auto-creating anonymous account
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.surface,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      >
        {/* Always show main app - anonymous account created automatically */}
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddEvent"
          component={AddEventScreen}
          options={{
            title: 'Thêm sự kiện',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="EventsList"
          component={EventsListScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MBTISurvey"
          component={MBTISurveyScreen}
          options={{
            title: 'Khảo sát MBTI',
            presentation: 'modal',
            headerShown: false,
          }}
        />
        {/* Auth screen available from Settings if user wants to link account */}
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            title: 'Đăng nhập / Đăng ký',
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
