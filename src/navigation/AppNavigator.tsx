import React, { createRef, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@contexts/AuthContext';
import { logScreenView } from '../services/analyticsService';
import { COLORS } from '@themes/colors';
import AuthScreen from '../screens/AuthScreen';
import TabNavigator from './TabNavigator';
import AddEventScreen from '../screens/AddEventScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import EventsListScreen from '../screens/EventsListScreen';
import MBTISurveyScreen from '../screens/MBTISurveyScreen';
import PersonalitySurveyScreen from '../screens/PersonalitySurveyScreen';
import GiftSuggestionsScreen from '../screens/GiftSuggestionsScreen';
import ActivitySuggestionsScreen from '../screens/ActivitySuggestionsScreen';
import PremiumScreen from '../screens/PremiumScreen';
import ArticleDetailScreen from '../screens/ArticleDetailScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ExperienceDetailScreen from '../screens/ExperienceDetailScreen';
import OccasionProductsScreen from '../screens/OccasionProductsScreen';
import AllProductsScreen from '../screens/AllProductsScreen';
import AllArticlesScreen from '../screens/AllArticlesScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

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
  const routeNameRef = useRef<string | undefined>(undefined);

  if (isLoading) {
    // Show splash screen while auto-creating anonymous account
    return null;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
      }}
      onStateChange={() => {
        const currentRoute = navigationRef.current?.getCurrentRoute();
        const currentName = currentRoute?.name;
        if (currentName && currentName !== routeNameRef.current) {
          logScreenView(currentName);
          routeNameRef.current = currentName;
        }
      }}
    >
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
          name="PersonalitySurvey"
          component={PersonalitySurveyScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
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
        <Stack.Screen
          name="ExperienceDetail"
          component={ExperienceDetailScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="OccasionProducts"
          component={OccasionProductsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AllProducts"
          component={AllProductsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AllArticles"
          component={AllArticlesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ headerShown: false }}
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
