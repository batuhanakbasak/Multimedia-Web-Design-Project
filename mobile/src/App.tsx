import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SourceSans3_400Regular, SourceSans3_600SemiBold, SourceSans3_700Bold, useFonts as useSourceSansFonts } from '@expo-google-fonts/source-sans-3';
import { SpaceGrotesk_700Bold, useFonts as useSpaceFonts } from '@expo-google-fonts/space-grotesk';

import { LoadingView } from './components/common/LoadingView';
import { ToastProvider } from './components/common/ToastProvider';
import { navigationTheme } from './constants/theme';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  const [bodyFontsLoaded] = useSourceSansFonts({
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
  });
  const [headingFontsLoaded] = useSpaceFonts({
    SpaceGrotesk_700Bold,
  });

  if (!bodyFontsLoaded || !headingFontsLoaded) {
    return <LoadingView />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
          </NavigationContainer>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
