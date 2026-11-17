import {Stack} from 'expo-router';
import {useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold} from '@expo-google-fonts/inter';
import {ActivityIndicator, View} from 'react-native';

export default function Layout() {
  const [loaded, error] = useFonts({Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold});
  // If fonts fail to load (e.g. offline first run) fall back to the system font instead of blocking the app.
  if (!loaded && !error) return <View style={{flex: 1, backgroundColor: '#dce2ff', justifyContent: 'center'}}><ActivityIndicator color="#2635a3" /></View>;
  return <Stack screenOptions={{headerShown: false, animation: 'fade'}} />;
}
