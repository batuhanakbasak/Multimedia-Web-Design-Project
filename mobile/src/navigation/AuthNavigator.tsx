import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AUTH_ROUTES, type AuthStackParamList } from '../constants/routes';
import { OrganizerLoginScreen } from '../screens/auth/OrganizerLoginScreen';
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { StudentLoginScreen } from '../screens/auth/StudentLoginScreen';
import { StudentRegisterScreen } from '../screens/auth/StudentRegisterScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={AUTH_ROUTES.RoleSelection}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f7f2ea' },
      }}
    >
      <Stack.Screen name={AUTH_ROUTES.Splash} component={SplashScreen} />
      <Stack.Screen name={AUTH_ROUTES.RoleSelection} component={RoleSelectionScreen} />
      <Stack.Screen name={AUTH_ROUTES.StudentLogin} component={StudentLoginScreen} />
      <Stack.Screen name={AUTH_ROUTES.StudentRegister} component={StudentRegisterScreen} />
      <Stack.Screen name={AUTH_ROUTES.OrganizerLogin} component={OrganizerLoginScreen} />
    </Stack.Navigator>
  );
};
