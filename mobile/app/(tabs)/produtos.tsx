import { useCallback, useMemo, useState } from 'react'
import { Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Image } from 'expo-image'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import type { Product } from '@/lib/types'
import { Card, Empty, Header, Loading, PrimaryButton, Screen } from '@/components/ui'
import { theme } from '@/lib/theme'

type FormState = { id?: string; nome: string; descricao: string; preco: string; categoria: string; fotoUrl: string; ativo: boolean; itens: string }
const emptyForm: FormState = { nome: '', descricao: '', preco: '', categoria: '', fotoUrl: '', ativo: true, itens: '' }
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)

  const load = useCallback(async () => {
    try { const result = await api<{ products: Product[]; categories: { id: string; nome: string }[] }>('/api/admin/produtos'); setProducts(result.products); setCategories(result.categories) }
    catch (e) { Alert.alert('Produtos', e instanceof Error ? e.message : 'Erro ao carregar.') }
    finally { setLoading(false) }
  }, [])
  useFocusEffect(useCallback(() => { load() }, [load]))
  const filtered = useMemo(() => products.filter((product) => `${product.nome} ${product.categoria}`.toLowerCase().includes(search.toLowerCase())), [products, search])

  function open(product?: Product) {
    setForm(product ? { id: product.id, nome: product.nome, descricao: product.descricao ?? '', preco: String(product.preco), categoria: product.categoria ?? '', fotoUrl: product.foto_url ?? '', ativo: product.ativo, itens: (product.itens ?? []).join('\n') } : { ...emptyForm, categoria: categories[0]?.nome ?? '' })
    setModal(true)
  }

  async function save() {
    const price = Number(form.preco.replace(',', '.'))
    if (!form.nome.trim() || !Number.isFinite(price) || price <= 0 || !form.categoria) return Alert.alert('Produto', 'Preencha nome, preço e categoria.')
    setSaving(true)
    try {
      const body = JSON.stringify({ nome: form.nome, descricao: form.descricao, preco: price, categoria: form.categoria, fotoUrl: form.fotoUrl, ativo: form.ativo, itens: form.itens.split('\n').map((item) => item.trim()).filter(Boolean) })
      await api(form.id ? `/api/admin/produtos/${form.id}` : '/api/admin/produtos', { method: form.id ? 'PATCH' : 'POST', body })
      setModal(false); await load()
    } catch (e) { Alert.alert('Produto', e instanceof Error ? e.message : 'Erro ao salvar.') }
    finally { setSaving(false) }
  }

  async function toggle(product: Product) {
    try { await api(`/api/admin/produtos/${product.id}`, { method: 'PATCH', body: JSON.stringify({ nome: product.nome, descricao: product.descricao ?? '', preco: Number(product.preco), categoria: product.categoria, fotoUrl: product.foto_url ?? '', ativo: !product.ativo, itens: product.itens ?? [] }) }); setProducts((rows) => rows.map((row) => row.id === product.id ? { ...row, ativo: !row.ativo } : row)) }
    catch (e) { Alert.alert('Produto', e instanceof Error ? e.message : 'Erro ao atualizar.') }
  }

  return <Screen>
    <Header title="Produtos" subtitle={`${products.filter((p) => p.ativo).length} ativos de ${products.length}`} action={<Pressable style={styles.add} onPress={() => open()}><MaterialCommunityIcons name="plus" size={24} color="#fff" /></Pressable>} />
    <View style={styles.search}><MaterialCommunityIcons name="magnify" size={21} color={theme.colors.muted} /><TextInput style={{ flex: 1 }} placeholder="Buscar produto ou categoria" value={search} onChangeText={setSearch} /></View>
    {loading ? <Loading /> : <FlatList data={filtered} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />} contentContainerStyle={styles.list} ListEmptyComponent={<Empty text="Nenhum produto encontrado." />} renderItem={({ item }) => <Pressable onPress={() => open(item)}><Card style={styles.card}><View style={styles.row}>{item.foto_url ? <Image source={item.foto_url} style={styles.image} contentFit="cover" transition={200} /> : <View style={styles.placeholder}><MaterialCommunityIcons name="image-outline" size={25} color={theme.colors.muted} /></View>}<View style={{ flex: 1 }}><Text style={styles.name}>{item.nome}</Text><Text style={styles.meta}>{item.categoria || 'Sem categoria'} · {(item.itens ?? []).length} componente(s)</Text><Text style={styles.price}>{money(Number(item.preco))}</Text></View><View style={{ alignItems: 'center', gap: 5 }}><Switch value={item.ativo} onValueChange={() => toggle(item)} trackColor={{ true: theme.colors.primary }} /><Text style={styles.active}>{item.ativo ? 'Ativo' : 'Inativo'}</Text></View></View></Card></Pressable>} />}

    <Modal visible={modal} animationType="slide" onRequestClose={() => setModal(false)}><Screen><ScrollView contentContainerStyle={styles.modal} keyboardShouldPersistTaps="handled">
      <View style={styles.modalHeader}><Pressable onPress={() => setModal(false)}><MaterialCommunityIcons name="close" size={26} color={theme.colors.text} /></Pressable><Text style={styles.modalTitle}>{form.id ? 'Editar produto' : 'Novo produto'}</Text><View style={{ width: 26 }} /></View>
      <Text style={styles.label}>Nome</Text><TextInput style={styles.input} value={form.nome} onChangeText={(nome) => setForm((f) => ({ ...f, nome }))} />
      <Text style={styles.label}>Descrição</Text><TextInput style={[styles.input, styles.multiline]} multiline value={form.descricao} onChangeText={(descricao) => setForm((f) => ({ ...f, descricao }))} />
      <Text style={styles.label}>Preço</Text><TextInput style={styles.input} value={form.preco} onChangeText={(preco) => setForm((f) => ({ ...f, preco }))} keyboardType="decimal-pad" placeholder="0,00" />
      <Text style={styles.label}>Categoria</Text><View style={styles.chips}>{categories.map((category) => <Pressable key={category.id} onPress={() => setForm((f) => ({ ...f, categoria: category.nome }))} style={[styles.chip, form.categoria === category.nome && styles.chipActive]}><Text style={[styles.chipText, form.categoria === category.nome && styles.chipTextActive]}>{category.nome}</Text></Pressable>)}</View>
      <Text style={styles.label}>URL da foto</Text><TextInput style={styles.input} autoCapitalize="none" value={form.fotoUrl} onChangeText={(fotoUrl) => setForm((f) => ({ ...f, fotoUrl }))} placeholder="https://..." />
      <Text style={styles.label}>Composição — um item por linha</Text><TextInput style={[styles.input, styles.composition]} multiline value={form.itens} onChangeText={(itens) => setForm((f) => ({ ...f, itens }))} placeholder={'1 caneca\n2 chocolates\n1 cartão'} />
      <View style={styles.activeRow}><Text style={styles.label}>Produto disponível para venda</Text><Switch value={form.ativo} onValueChange={(ativo) => setForm((f) => ({ ...f, ativo }))} trackColor={{ true: theme.colors.primary }} /></View>
      <PrimaryButton title={form.id ? 'Salvar alterações' : 'Criar produto'} onPress={save} loading={saving} />
    </ScrollView></Screen></Modal>
  </Screen>
}

const styles = StyleSheet.create({
  add: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }, search: { marginHorizontal: 20, height: 48, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14 }, list: { padding: 20, paddingBottom: 100 }, card: { marginBottom: 11 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, image: { width: 64, height: 64, borderRadius: 13, backgroundColor: '#eee' }, placeholder: { width: 64, height: 64, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F4F5' }, name: { fontWeight: '800', color: theme.colors.text }, meta: { color: theme.colors.muted, fontSize: 11, marginTop: 3 }, price: { color: theme.colors.primary, fontWeight: '900', marginTop: 7 }, active: { color: theme.colors.muted, fontSize: 10 },
  modal: { padding: 20, paddingBottom: 50, gap: 8 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, modalTitle: { fontSize: 19, fontWeight: '800' }, label: { fontWeight: '800', fontSize: 13, color: theme.colors.text, marginTop: 8 }, input: { minHeight: 50, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#fff' }, multiline: { minHeight: 85, paddingTop: 12, textAlignVertical: 'top' }, composition: { minHeight: 120, paddingTop: 12, textAlignVertical: 'top' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#fff' }, chipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft }, chipText: { color: theme.colors.muted, fontSize: 12, fontWeight: '700' }, chipTextActive: { color: theme.colors.primaryDark }, activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
})
