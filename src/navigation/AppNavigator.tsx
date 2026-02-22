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
import GiftSuggestionsScreen from '../screens/GiftSuggestionsScreen';
import ActivitySuggestionsScreen from '../screens/ActivitySuggestionsScreen';
import PremiumScreen from '../screens/PremiumScreen';
import ArticleDetailScreen from '../screens/ArticleDetailScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';

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
          name="GiftSuggestions"
          component={GiftSuggestionsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ActivitySuggestions"
          component={ActivitySuggestionsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Premium"
          component={PremiumScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
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
        <Stack.Screen
          name="ArticleDetail"
          component={ArticleDetailScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{
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
