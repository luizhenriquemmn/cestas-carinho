import type { PropsWithChildren, ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '@/lib/theme'

export function Screen({ children }: PropsWithChildren) {
  return <SafeAreaView style={styles.screen} edges={['top']}>{children}</SafeAreaView>
}

export function Header({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <View style={styles.header}><View style={{ flex: 1 }}><Text style={styles.title}>{title}</Text>{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}</View>{action}</View>
}

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Metric({ label, value, accent = theme.colors.primary }: { label: string; value: string; accent?: string }) {
  return <Card style={{ flex: 1, minWidth: 150 }}><View style={[styles.metricBar, { backgroundColor: accent }]} /><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></Card>
}

export function PrimaryButton({ title, onPress, loading, disabled, danger }: { title: string; onPress: () => void; loading?: boolean; disabled?: boolean; danger?: boolean }) {
  return <Pressable onPress={onPress} disabled={loading || disabled} style={({ pressed }) => [styles.button, danger && { backgroundColor: theme.colors.danger }, (pressed || disabled) && { opacity: .65 }]}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{title}</Text>}</Pressable>
}

export function Empty({ text }: { text: string }) { return <View style={styles.empty}><Text style={styles.emptyText}>{text}</Text></View> }
export function Loading() { return <View style={styles.empty}><ActivityIndicator size="large" color={theme.colors.primary} /></View> }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: theme.colors.text },
  subtitle: { color: theme.colors.muted, marginTop: 3, fontSize: 13 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: 16 },
  metricBar: { width: 30, height: 4, borderRadius: 4, marginBottom: 12 },
  metricLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: '600' },
  metricValue: { color: theme.colors.text, fontSize: 22, fontWeight: '800', marginTop: 4 },
  button: { minHeight: 46, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: theme.colors.muted, textAlign: 'center' },
})
