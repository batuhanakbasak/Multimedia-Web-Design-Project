import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  ORGANIZER_STACK_ROUTES,
  ORGANIZER_TAB_ROUTES,
  type OrganizerStackParamList,
  type OrganizerTabParamList,
} from '../constants/routes';
import { theme } from '../constants/theme';
import { OrganizerAddMemberScreen } from '../screens/organizer/OrganizerAddMemberScreen';
import { OrganizerChangePasswordScreen } from '../screens/organizer/OrganizerChangePasswordScreen';
import { OrganizerClubMembersScreen } from '../screens/organizer/OrganizerClubMembersScreen';
import { OrganizerClubsScreen } from '../screens/organizer/OrganizerClubsScreen';
import { OrganizerCreateEventScreen } from '../screens/organizer/OrganizerCreateEventScreen';
import { OrganizerDashboardScreen } from '../screens/organizer/OrganizerDashboardScreen';
import { OrganizerEditEventScreen } from '../screens/organizer/OrganizerEditEventScreen';
import { OrganizerEditProfileScreen } from '../screens/organizer/OrganizerEditProfileScreen';
import { OrganizerEventDetailScreen } from '../screens/organizer/OrganizerEventDetailScreen';
import { OrganizerEventsScreen } from '../screens/organizer/OrganizerEventsScreen';
import { OrganizerParticipantsScreen } from '../screens/organizer/OrganizerParticipantsScreen';
import { OrganizerProfileScreen } from '../screens/organizer/OrganizerProfileScreen';

const Tab = createBottomTabNavigator<OrganizerTabParamList>();
const Stack = createNativeStackNavigator<OrganizerStackParamList>();

const OrganizerTabs = () => {
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
          const iconMap: Record<keyof OrganizerTabParamList, keyof typeof Ionicons.glyphMap> = {
            OrganizerDashboardTab: 'grid-outline',
            OrganizerEventsTab: 'calendar-outline',
            OrganizerCreateEventTab: 'add-circle-outline',
            OrganizerClubsTab: 'people-outline',
            OrganizerProfileTab: 'person-outline',
          };

          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name={ORGANIZER_TAB_ROUTES.Dashboard} component={OrganizerDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name={ORGANIZER_TAB_ROUTES.Events} component={OrganizerEventsScreen} options={{ title: 'My Events' }} />
      <Tab.Screen name={ORGANIZER_TAB_ROUTES.CreateEvent} component={OrganizerCreateEventScreen} options={{ title: 'Create' }} />
      <Tab.Screen name={ORGANIZER_TAB_ROUTES.Clubs} component={OrganizerClubsScreen} options={{ title: 'Clubs' }} />
      <Tab.Screen name={ORGANIZER_TAB_ROUTES.Profile} component={OrganizerProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export const OrganizerNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ORGANIZER_STACK_ROUTES.Tabs}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name={ORGANIZER_STACK_ROUTES.Tabs} component={OrganizerTabs} />
      <Stack.Screen name={ORGANIZER_STACK_ROUTES.EventDetail} component={OrganizerEventDetailScreen} />
      <Stack.Screen name={ORGANIZER_STACK_ROUTES.EditEvent} component={OrganizerEditEventScreen} />
      <Stack.Screen name={ORGANIZER_STACK_ROUTES.Participants} component={OrganizerParticipantsScreen} />
      <Stack.Screen name={ORGANIZER_STACK_ROUTES.ClubMembers} component={OrganizerClubMembersScreen} />
      <Stack.Screen name={ORGANIZER_STACK_ROUTES.AddMember} component={OrganizerAddMemberScreen} />
      <Stack.Screen name={ORGANIZER_STACK_ROUTES.EditProfile} component={OrganizerEditProfileScreen} />
      <Stack.Screen name={ORGANIZER_STACK_ROUTES.ChangePassword} component={OrganizerChangePasswordScreen} />
    </Stack.Navigator>
  );
};
