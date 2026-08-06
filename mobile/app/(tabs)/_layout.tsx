import { Tabs } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { theme } from '@/lib/theme'

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.colors.primary, tabBarInactiveTintColor: '#A1A1AA', tabBarStyle: { height: 68, paddingTop: 7, paddingBottom: 8, borderTopColor: theme.colors.border, backgroundColor: '#fff' }, tabBarLabelStyle: { fontSize: 11, fontWeight: '700' } }}>
    <Tabs.Screen name="index" options={{ title: 'Visão geral', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard-outline" size={24} color={color} /> }} />
    <Tabs.Screen name="pedidos" options={{ title: 'Pedidos', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={color} /> }} />
    <Tabs.Screen name="financeiro" options={{ title: 'Financeiro', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="wallet-outline" size={24} color={color} /> }} />
    <Tabs.Screen name="produtos" options={{ title: 'Produtos', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="package-variant-closed" size={24} color={color} /> }} />
  </Tabs>
}
