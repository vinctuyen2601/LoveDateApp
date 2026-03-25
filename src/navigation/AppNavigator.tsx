import React, { createRef, useRef, useState, useEffect } from "react";
import { DeviceEventEmitter } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuth } from "@contexts/AuthContext";
import { useEvents } from "@contexts/EventsContext";
import { logScreenView } from "../services/analyticsService";
import { COLORS } from "@themes/colors";
import AuthScreen from "../screens/AuthScreen";
import TabNavigator from "./TabNavigator";
import AddEventScreen from "../screens/AddEventScreen";
import EventDetailScreen from "../screens/EventDetailScreen";
import EventsListScreen from "../screens/EventsListScreen";
import MBTISurveyScreen from "../screens/MBTISurveyScreen";
import PersonalitySurveyScreen from "../screens/PersonalitySurveyScreen";
import ActivitySuggestionsScreen from "../screens/ActivitySuggestionsScreen";
import PremiumScreen from "../screens/PremiumScreen";
import ArticleDetailScreen from "../screens/ArticleDetailScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import ExperienceDetailScreen from "../screens/ExperienceDetailScreen";
import OccasionProductsScreen from "../screens/OccasionProductsScreen";
import AllProductsScreen from "../screens/AllProductsScreen";
import AllArticlesScreen from "../screens/AllArticlesScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import OccasionPrepScreen from "../screens/OccasionPrepScreen";
import LocalShopScreen from "../screens/LocalShopScreen";
import MBTIGuideScreen from "../screens/MBTIGuideScreen";
import MBTITypeDetailScreen from "../screens/MBTITypeDetailScreen";
import ConnectionsScreen from "../screens/ConnectionsScreen";
import QRScreen from "../screens/QRScreen";
import SharedInboxScreen from "../screens/SharedInboxScreen";
import OnboardingOverlay, {
  checkOnboardingComplete,
} from "../components/organisms/OnboardingOverlay";

const Stack = createStackNavigator();

// Navigation ref for accessing navigation outside React components
export const navigationRef = createRef<any>();

export function navigate(name: string, params?: any) {
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  }
}

const AppNavigator: React.FC = () => {
  const { isLoading, user } = useAuth();
  const { addEvent } = useEvents();
  const routeNameRef = useRef<string | undefined>(undefined);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboardingComplete().then((done) => {
      setShowOnboarding(!done);
    });
  }, [user?.id]);

  if (isLoading) {
    // Show splash screen while auto-creating anonymous account
    return null;
  }

  return (
    <>
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
              fontFamily: 'Manrope_600SemiBold',
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
              title: "Thêm sự kiện",
              presentation: "modal",
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
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="MBTISurvey"
            component={MBTISurveyScreen}
            options={{
              title: "Khảo sát MBTI",
              presentation: "modal",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="MBTIGuide"
            component={MBTIGuideScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="MBTITypeDetail"
            component={MBTITypeDetailScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="PersonalitySurvey"
            component={PersonalitySurveyScreen}
            options={{
              headerShown: false,
              presentation: "modal",
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
            name="OccasionPrep"
            component={OccasionPrepScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LocalShop"
            component={LocalShopScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Connections"
            component={ConnectionsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="QRScreen"
            component={QRScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SharedInbox"
            component={SharedInboxScreen}
            options={{ headerShown: false }}
          />
          {/* Auth screen available from Settings if user wants to link account */}
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      {showOnboarding === true && (
        <OnboardingOverlay
          onComplete={() => {
            setShowOnboarding(false);
            DeviceEventEmitter.emit("onboardingComplete");
          }}
          onRegister={() => {
            setShowOnboarding(false);
            navigate("Auth");
          }}
          onAddEvent={() => {
            setShowOnboarding(false);
            navigate("AddEvent");
          }}
          addEvent={addEvent}
        />
      )}
    </>
  );
};

export default AppNavigator;
