import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  STUDENT_STACK_ROUTES,
  STUDENT_TAB_ROUTES,
  type StudentStackParamList,
  type StudentTabParamList,
} from '../constants/routes';
import { theme } from '../constants/theme';
import { StudentClubDetailScreen } from '../screens/student/StudentClubDetailScreen';
import { StudentClubsScreen } from '../screens/student/StudentClubsScreen';
import { StudentChangePasswordScreen } from '../screens/student/StudentChangePasswordScreen';
import { StudentEditProfileScreen } from '../screens/student/StudentEditProfileScreen';
import { StudentEventDetailScreen } from '../screens/student/StudentEventDetailScreen';
import { StudentExploreScreen } from '../screens/student/StudentExploreScreen';
import { StudentFavoritesScreen } from '../screens/student/StudentFavoritesScreen';
import { StudentHomeScreen } from '../screens/student/StudentHomeScreen';
import { StudentMyEventsScreen } from '../screens/student/StudentMyEventsScreen';
import { StudentProfileScreen } from '../screens/student/StudentProfileScreen';

const Tab = createBottomTabNavigator<StudentTabParamList>();
const Stack = createNativeStackNavigator<StudentStackParamList>();

const StudentTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSoft,
        tabBarStyle: {
          height: 84,
          paddingTop: 10,
          paddingBottom: 14,
          backgroundColor: theme.colors.surfaceStrong,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.bodySemiBold,
          fontSize: 13,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<keyof StudentTabParamList, keyof typeof Ionicons.glyphMap> = {
            StudentHomeTab: 'home-outline',
            StudentExploreTab: 'search-outline',
            StudentMyEventsTab: 'calendar-outline',
            StudentFavoritesTab: 'heart-outline',
            StudentProfileTab: 'person-outline',
          };

          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name={STUDENT_TAB_ROUTES.Home} component={StudentHomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name={STUDENT_TAB_ROUTES.Explore} component={StudentExploreScreen} options={{ title: 'Explore' }} />
      <Tab.Screen name={STUDENT_TAB_ROUTES.MyEvents} component={StudentMyEventsScreen} options={{ title: 'My Events' }} />
      <Tab.Screen name={STUDENT_TAB_ROUTES.Favorites} component={StudentFavoritesScreen} options={{ title: 'Favorites' }} />
      <Tab.Screen name={STUDENT_TAB_ROUTES.Profile} component={StudentProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export const StudentNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={STUDENT_STACK_ROUTES.Tabs}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name={STUDENT_STACK_ROUTES.Tabs} component={StudentTabs} />
      <Stack.Screen name={STUDENT_STACK_ROUTES.Clubs} component={StudentClubsScreen} />
      <Stack.Screen name={STUDENT_STACK_ROUTES.EventDetail} component={StudentEventDetailScreen} />
      <Stack.Screen name={STUDENT_STACK_ROUTES.ClubDetail} component={StudentClubDetailScreen} />
      <Stack.Screen name={STUDENT_STACK_ROUTES.EditProfile} component={StudentEditProfileScreen} />
      <Stack.Screen name={STUDENT_STACK_ROUTES.ChangePassword} component={StudentChangePasswordScreen} />
    </Stack.Navigator>
  );
};
