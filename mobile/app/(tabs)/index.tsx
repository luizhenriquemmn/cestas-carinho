import { useCallback, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import type { FinanceData, Order, Product } from '@/lib/types'
import { Card, Header, Metric, Screen } from '@/components/ui'
import { useAuth } from '@/contexts/auth'
import { theme } from '@/lib/theme'

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Dashboard() {
  const { signOut } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [finance, setFinance] = useState<FinanceData | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  const load = useCallback(async () => {
    setRefreshing(true)
    const now = new Date(); const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`; const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    const [ordersResult, financeResult, productsResult] = await Promise.allSettled([
      api<Order[]>('/api/admin/pedidos'), api<FinanceData>(`/api/admin/financeiro?from=${from}&to=${to}`), api<{ products: Product[] }>('/api/admin/produtos'),
    ])
    if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value)
    if (financeResult.status === 'fulfilled') setFinance(financeResult.value)
    if (productsResult.status === 'fulfilled') setProducts(productsResult.value.products)
    setRefreshing(false)
  }, [])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const valid = orders.filter((order) => !['cancelado', 'rejeitado'].includes(order.status))
  const revenue = valid.reduce((sum, order) => sum + Number(order.total), 0)

  return <Screen><ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.colors.primary} />} contentContainerStyle={styles.content}>
    <Header title="Visão geral" subtitle="Acompanhe seu negócio em tempo real" action={<MaterialCommunityIcons name="logout" size={24} color={theme.colors.muted} onPress={signOut} />} />
    <View style={styles.metrics}><Metric label="Pedidos" value={String(orders.length)} /><Metric label="Faturamento" value={money(revenue)} accent={theme.colors.success} /><Metric label="Saldo" value={money(finance?.summary.saldoContas ?? 0)} accent="#2563EB" /><Metric label="Produtos ativos" value={String(products.filter((p) => p.ativo).length)} accent="#D97706" /></View>
    <Text style={styles.section}>Atenção necessária</Text>
    <Card><View style={styles.attentionRow}><View style={[styles.iconBox, { backgroundColor: theme.colors.warningSoft }]}><MaterialCommunityIcons name="clock-outline" size={23} color={theme.colors.warning} /></View><View style={{ flex: 1 }}><Text style={styles.attentionValue}>{orders.filter((o) => o.status === 'aguardando_confirmacao').length} pedidos</Text><Text style={styles.attentionLabel}>Aguardando confirmação</Text></View></View>
      <View style={styles.divider} /><View style={styles.attentionRow}><View style={[styles.iconBox, { backgroundColor: theme.colors.dangerSoft }]}><MaterialCommunityIcons name="arrow-up-bold-circle-outline" size={23} color={theme.colors.danger} /></View><View style={{ flex: 1 }}><Text style={styles.attentionValue}>{money(finance?.summary.aPagar ?? 0)}</Text><Text style={styles.attentionLabel}>Contas pendentes a pagar</Text></View></View></Card>
    <Text style={styles.section}>Últimos pedidos</Text>
    {orders.slice(0, 4).map((order) => <Card key={order.id} style={styles.orderCard}><View style={styles.orderTop}><Text style={styles.customer}>{order.clientes?.nome ?? 'Cliente'}</Text><Text style={styles.orderValue}>{money(Number(order.total))}</Text></View><Text style={styles.orderMeta}>{new Date(order.created_at).toLocaleDateString('pt-BR')} · {order.pedido_itens.length} produto(s)</Text></Card>)}
  </ScrollView></Screen>
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 }, metrics: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  section: { marginHorizontal: 20, marginTop: 24, marginBottom: 10, fontSize: 16, fontWeight: '800', color: theme.colors.text },
  attentionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  attentionValue: { fontWeight: '800', fontSize: 17, color: theme.colors.text }, attentionLabel: { color: theme.colors.muted, fontSize: 12, marginTop: 2 }, divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 14 },
  orderCard: { marginHorizontal: 20, marginBottom: 10 }, orderTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, customer: { fontWeight: '800', color: theme.colors.text }, orderValue: { fontWeight: '800', color: theme.colors.primary }, orderMeta: { marginTop: 7, fontSize: 12, color: theme.colors.muted },
})
