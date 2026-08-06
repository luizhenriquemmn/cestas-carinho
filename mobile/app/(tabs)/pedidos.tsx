import { useCallback, useMemo, useState } from 'react'
import { Alert, FlatList, Linking, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import type { Order } from '@/lib/types'
import { Card, Empty, Header, Loading, PrimaryButton, Screen } from '@/components/ui'
import { theme } from '@/lib/theme'

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const labels: Record<string, string> = { aguardando_confirmacao: 'Aguardando', confirmado: 'Confirmado', em_preparo: 'Em preparo', saiu_para_entrega: 'Em entrega', entregue: 'Entregue', cancelado: 'Cancelado', rejeitado: 'Rejeitado' }

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try { setOrders(await api<Order[]>('/api/admin/pedidos')) }
    catch (e) { Alert.alert('Pedidos', e instanceof Error ? e.message : 'Erro ao carregar.') }
    finally { setLoading(false) }
  }, [])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const filtered = useMemo(() => orders.filter((order) => [order.clientes?.nome, order.clientes?.telefone, order.id].some((value) => value?.toLowerCase().includes(search.toLowerCase()))), [orders, search])

  function whatsapp(order: Order) {
    const phone = order.clientes?.telefone?.replace(/\D/g, '')
    if (!phone) return Alert.alert('WhatsApp', 'Este cliente não possui telefone cadastrado.')
    const number = phone.startsWith('55') ? phone : `55${phone}`
    const message = encodeURIComponent(`Olá, ${order.clientes?.nome ?? ''}! Estou entrando em contato sobre seu pedido na Cestas & Carinho.`)
    Linking.openURL(`https://wa.me/${number}?text=${message}`).catch(() => Alert.alert('WhatsApp', 'Não foi possível abrir o WhatsApp.'))
  }

  async function changeStatus(order: Order, status: string) {
    setSaving(true)
    try {
      const discount = Number(order.desconto_valor ?? 0)
      await api(`/api/admin/pedidos/${order.id}`, { method: 'PATCH', body: JSON.stringify({
        status, deliveryFee: Number(order.taxa_entrega ?? 0), discountType: discount > 0 ? 'valor' : null,
        discountInput: discount, discountReason: '', decisionAction: status === 'cancelado' ? 'cancelar' : undefined, decisionComment: '',
      }) })
      const updated = { ...order, status }; setOrders((rows) => rows.map((row) => row.id === order.id ? updated : row)); setSelected(updated)
    } catch (e) { Alert.alert('Pedido', e instanceof Error ? e.message : 'Erro ao atualizar.') }
    finally { setSaving(false) }
  }

  return <Screen>
    <Header title="Pedidos" subtitle={`${filtered.length} pedidos encontrados`} />
    <View style={styles.search}><MaterialCommunityIcons name="magnify" size={21} color={theme.colors.muted} /><TextInput style={{ flex: 1 }} placeholder="Cliente, telefone ou código" value={search} onChangeText={setSearch} /></View>
    {loading ? <Loading /> : <FlatList data={filtered} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />} contentContainerStyle={styles.list} ListEmptyComponent={<Empty text="Nenhum pedido encontrado." />} renderItem={({ item }) => <Pressable onPress={() => setSelected(item)}><Card style={styles.card}>
      <View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.customer}>{item.clientes?.nome ?? 'Cliente'}</Text><Text style={styles.meta}>{new Date(item.created_at).toLocaleDateString('pt-BR')} · {item.pedido_itens.reduce((sum, product) => sum + product.quantidade, 0)} item(ns)</Text></View><Text style={styles.value}>{money(Number(item.total))}</Text></View>
      <View style={styles.row}><View style={[styles.status, item.status === 'entregue' && styles.success]}><Text style={styles.statusText}>{labels[item.status] ?? item.status}</Text></View><Pressable onPress={() => whatsapp(item)} style={styles.whatsapp}><MaterialCommunityIcons name="whatsapp" size={19} color="#fff" /><Text style={styles.whatsappText}>Conversar</Text></Pressable></View>
    </Card></Pressable>} />}

    <Modal visible={Boolean(selected)} animationType="slide" onRequestClose={() => setSelected(null)}><Screen><ScrollView contentContainerStyle={styles.modalContent}>
      <View style={styles.modalHeader}><Pressable onPress={() => setSelected(null)}><MaterialCommunityIcons name="close" size={26} color={theme.colors.text} /></Pressable><Text style={styles.modalTitle}>Detalhes do pedido</Text><View style={{ width: 26 }} /></View>
      {selected && <><Card><Text style={styles.customer}>{selected.clientes?.nome ?? 'Cliente'}</Text><Text style={styles.meta}>{selected.clientes?.telefone} · {selected.clientes?.email}</Text>{selected.endereco_entrega ? <Text style={styles.address}>{selected.endereco_entrega}</Text> : null}<PrimaryButton title="Chamar no WhatsApp" onPress={() => whatsapp(selected)} /></Card>
      <Text style={styles.section}>Produtos</Text>{selected.pedido_itens.map((item) => { const product = { ...(item.produtos ?? {}), ...(item.produto_snapshot ?? {}) }; return <Card key={item.id} style={styles.product}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.productName}>{product.nome ?? item.produto_id}</Text><Text style={styles.meta}>{item.quantidade} × {money(Number(item.preco_unitario))}</Text></View><Text style={styles.value}>{money(item.quantidade * Number(item.preco_unitario))}</Text></View>{product.itens?.length ? <Text style={styles.composition}>{product.itens.join(' · ')}</Text> : null}</Card> })}
      <Card><View style={styles.row}><Text style={styles.totalLabel}>Total</Text><Text style={styles.total}>{money(Number(selected.total))}</Text></View></Card>
      <Text style={styles.section}>Atualizar situação</Text><View style={styles.actions}><PrimaryButton title="Confirmar" onPress={() => changeStatus(selected, 'confirmado')} loading={saving} /><PrimaryButton title="Em preparo" onPress={() => changeStatus(selected, 'em_preparo')} loading={saving} /><PrimaryButton title="Saiu para entrega" onPress={() => changeStatus(selected, 'saiu_para_entrega')} loading={saving} /><PrimaryButton title="Marcar entregue" onPress={() => changeStatus(selected, 'entregue')} loading={saving} /><PrimaryButton title="Cancelar pedido" danger onPress={() => Alert.alert('Cancelar pedido?', 'O pedido será marcado como cancelado.', [{ text: 'Voltar' }, { text: 'Cancelar pedido', style: 'destructive', onPress: () => changeStatus(selected, 'cancelado') }])} loading={saving} /></View></>}
    </ScrollView></Screen></Modal>
  </Screen>
}

const styles = StyleSheet.create({
  search: { marginHorizontal: 20, height: 48, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14 }, list: { padding: 20, paddingBottom: 100 }, card: { marginBottom: 12 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, customer: { fontSize: 16, fontWeight: '800', color: theme.colors.text }, meta: { color: theme.colors.muted, fontSize: 12, marginTop: 4 }, value: { color: theme.colors.primary, fontWeight: '800' },
  status: { marginTop: 14, borderRadius: 999, backgroundColor: theme.colors.warningSoft, paddingHorizontal: 10, paddingVertical: 5 }, success: { backgroundColor: theme.colors.successSoft }, statusText: { fontSize: 11, fontWeight: '700', color: theme.colors.text }, whatsapp: { marginTop: 14, backgroundColor: '#16A34A', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', gap: 6, alignItems: 'center' }, whatsappText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  modalContent: { padding: 20, paddingBottom: 50, gap: 12 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, modalTitle: { fontSize: 19, fontWeight: '800' }, address: { color: theme.colors.text, marginVertical: 14, lineHeight: 20 }, section: { fontSize: 16, fontWeight: '800', marginTop: 10 }, product: { marginBottom: 0 }, productName: { fontWeight: '800', color: theme.colors.text }, composition: { fontSize: 12, color: theme.colors.muted, marginTop: 10, lineHeight: 18 }, totalLabel: { fontSize: 16, fontWeight: '700' }, total: { fontSize: 20, fontWeight: '900', color: theme.colors.primary }, actions: { gap: 10 },
})
