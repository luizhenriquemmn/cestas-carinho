import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import 'react-native-reanimated'
import { AuthProvider, useAuth } from '@/contexts/auth'
import { theme } from '@/lib/theme'

function Navigator() {
  const { session, loading } = useAuth()
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
    <Stack.Protected guard={!session}><Stack.Screen name="sign-in" /></Stack.Protected>
    <Stack.Protected guard={Boolean(session)}><Stack.Screen name="(tabs)" /></Stack.Protected>
  </Stack>
}

export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><StatusBar style="dark" /><Navigator /></AuthProvider></SafeAreaProvider>
}
