import { useCallback, useState } from 'react'
import { Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import type { FinanceData, FinanceEntry } from '@/lib/types'
import { Card, Empty, Header, Loading, Metric, PrimaryButton, Screen } from '@/components/ui'
import { theme } from '@/lib/theme'

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const today = () => new Date().toISOString().slice(0, 10)

export default function FinanceScreen() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ tipo: 'despesa' as 'receita' | 'despesa', descricao: '', valor: '', categoriaId: '', contaId: '', status: 'pago' as 'pago' | 'pendente' })
  const from = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
  const to = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)

  const load = useCallback(async () => {
    try { setData(await api<FinanceData>(`/api/admin/financeiro?from=${from}&to=${to}`)) }
    catch (e) { Alert.alert('Financeiro', e instanceof Error ? e.message : 'Erro ao carregar.') }
    finally { setLoading(false) }
  }, [from, to])
  useFocusEffect(useCallback(() => { load() }, [load]))

  async function create() {
    const value = Number(form.valor.replace(',', '.'))
    if (!form.descricao || !Number.isFinite(value) || value <= 0 || !form.categoriaId || !form.contaId) return Alert.alert('Novo lançamento', 'Preencha descrição, valor, categoria e conta.')
    setSaving(true)
    try {
      await api('/api/admin/financeiro', { method: 'POST', body: JSON.stringify({
        resource: 'lancamento', tipo: form.tipo, descricao: form.descricao, valor: value,
        categoriaId: form.categoriaId, contaId: form.contaId, pedidoId: null, status: form.status,
        dataCompetencia: today(), dataVencimento: null, dataPagamento: form.status === 'pago' ? today() : null,
        formaPagamento: null, documento: null, observacao: null,
      }) })
      setModal(false); setForm({ tipo: 'despesa', descricao: '', valor: '', categoriaId: '', contaId: '', status: 'pago' }); await load()
    } catch (e) { Alert.alert('Novo lançamento', e instanceof Error ? e.message : 'Erro ao salvar.') }
    finally { setSaving(false) }
  }

  async function togglePaid(entry: FinanceEntry) {
    const status = entry.status === 'pago' ? 'pendente' : 'pago'
    try { await api(`/api/admin/financeiro/lancamentos/${entry.id}`, { method: 'PATCH', body: JSON.stringify({ status, dataPagamento: status === 'pago' ? today() : null }) }); await load() }
    catch (e) { Alert.alert('Financeiro', e instanceof Error ? e.message : 'Erro ao atualizar.') }
  }

  const categories = data?.categories.filter((category) => category.tipo === form.tipo) ?? []
  return <Screen>
    <Header title="Financeiro" subtitle="Fluxo de caixa deste mês" action={<Pressable style={styles.add} onPress={() => setModal(true)}><MaterialCommunityIcons name="plus" size={24} color="#fff" /></Pressable>} />
    <View style={styles.metrics}><Metric label="Saldo" value={money(data?.summary.saldoContas ?? 0)} accent="#2563EB" /><Metric label="Resultado" value={money((data?.summary.receitas ?? 0) - (data?.summary.despesas ?? 0))} accent={theme.colors.success} /><Metric label="A receber" value={money(data?.summary.aReceber ?? 0)} accent={theme.colors.warning} /><Metric label="A pagar" value={money(data?.summary.aPagar ?? 0)} accent={theme.colors.danger} /></View>
    <Text style={styles.section}>Lançamentos</Text>
    {loading ? <Loading /> : <FlatList data={data?.entries ?? []} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />} contentContainerStyle={styles.list} ListEmptyComponent={<Empty text="Nenhum lançamento neste mês." />} renderItem={({ item }) => <Pressable onLongPress={() => togglePaid(item)}><Card style={styles.entry}><View style={styles.entryRow}><View style={[styles.entryIcon, { backgroundColor: item.tipo === 'receita' ? theme.colors.successSoft : theme.colors.dangerSoft }]}><MaterialCommunityIcons name={item.tipo === 'receita' ? 'arrow-down' : 'arrow-up'} size={21} color={item.tipo === 'receita' ? theme.colors.success : theme.colors.danger} /></View><View style={{ flex: 1 }}><Text style={styles.entryName}>{item.descricao}</Text><Text style={styles.entryMeta}>{item.financeiro_categorias?.nome ?? 'Sem categoria'} · {item.status}</Text></View><Text style={[styles.entryValue, { color: item.tipo === 'receita' ? theme.colors.success : theme.colors.danger }]}>{item.tipo === 'receita' ? '+' : '-'}{money(Number(item.valor))}</Text></View></Card></Pressable>} />}

    <Modal visible={modal} animationType="slide" onRequestClose={() => setModal(false)}><Screen><ScrollView contentContainerStyle={styles.modal}>
      <View style={styles.modalHeader}><Pressable onPress={() => setModal(false)}><MaterialCommunityIcons name="close" size={26} color={theme.colors.text} /></Pressable><Text style={styles.modalTitle}>Novo lançamento</Text><View style={{ width: 26 }} /></View>
      <Text style={styles.label}>Tipo</Text><View style={styles.chips}>{(['receita', 'despesa'] as const).map((type) => <Pressable key={type} onPress={() => setForm((f) => ({ ...f, tipo: type, categoriaId: '' }))} style={[styles.chip, form.tipo === type && styles.chipActive]}><Text style={[styles.chipText, form.tipo === type && styles.chipTextActive]}>{type === 'receita' ? 'Receita' : 'Despesa'}</Text></Pressable>)}</View>
      <Text style={styles.label}>Descrição</Text><TextInput style={styles.input} value={form.descricao} onChangeText={(descricao) => setForm((f) => ({ ...f, descricao }))} placeholder="Ex.: Compra de embalagens" />
      <Text style={styles.label}>Valor</Text><TextInput style={styles.input} value={form.valor} onChangeText={(valor) => setForm((f) => ({ ...f, valor }))} keyboardType="decimal-pad" placeholder="0,00" />
      <Text style={styles.label}>Categoria</Text><View style={styles.chips}>{categories.map((category) => <Pressable key={category.id} onPress={() => setForm((f) => ({ ...f, categoriaId: category.id }))} style={[styles.chip, form.categoriaId === category.id && styles.chipActive]}><Text style={[styles.chipText, form.categoriaId === category.id && styles.chipTextActive]}>{category.nome}</Text></Pressable>)}</View>
      <Text style={styles.label}>Conta</Text><View style={styles.chips}>{data?.accounts.map((account) => <Pressable key={account.id} onPress={() => setForm((f) => ({ ...f, contaId: account.id }))} style={[styles.chip, form.contaId === account.id && styles.chipActive]}><Text style={[styles.chipText, form.contaId === account.id && styles.chipTextActive]}>{account.nome}</Text></Pressable>)}</View>
      <Text style={styles.label}>Situação</Text><View style={styles.chips}>{(['pago', 'pendente'] as const).map((status) => <Pressable key={status} onPress={() => setForm((f) => ({ ...f, status }))} style={[styles.chip, form.status === status && styles.chipActive]}><Text style={[styles.chipText, form.status === status && styles.chipTextActive]}>{status === 'pago' ? 'Pago/recebido' : 'Pendente'}</Text></Pressable>)}</View>
      <PrimaryButton title="Salvar lançamento" onPress={create} loading={saving} />
    </ScrollView></Screen></Modal>
  </Screen>
}

const styles = StyleSheet.create({
  add: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }, metrics: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, section: { margin: 20, marginBottom: 2, fontSize: 16, fontWeight: '800' }, list: { padding: 20, paddingBottom: 100 }, entry: { marginBottom: 10 }, entryRow: { flexDirection: 'row', alignItems: 'center', gap: 11 }, entryIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, entryName: { fontWeight: '800', color: theme.colors.text }, entryMeta: { fontSize: 11, color: theme.colors.muted, marginTop: 3 }, entryValue: { fontWeight: '900', fontSize: 14 },
  modal: { padding: 20, gap: 10, paddingBottom: 50 }, modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, modalTitle: { fontSize: 19, fontWeight: '800' }, label: { fontSize: 13, fontWeight: '800', color: theme.colors.text, marginTop: 8 }, input: { height: 50, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#fff' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 5 }, chip: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 }, chipActive: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary }, chipText: { fontSize: 12, color: theme.colors.muted, fontWeight: '700' }, chipTextActive: { color: theme.colors.primaryDark },
})
