"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button, Card, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Statistic, Table, Tag } from "antd"
import type { TableColumnsType } from "antd"
import { CircleDollarSign, FileSpreadsheet, Landmark, Plus, ReceiptText, Trash2, TrendingDown, TrendingUp, WalletCards } from "lucide-react"
import dayjs, { type Dayjs } from "dayjs"
import { supabase } from "@/lib/supabase"

type Account = { id: string; nome: string; tipo: string; saldo_inicial: number; saldo_atual: number }
type Category = { id: string; nome: string; tipo: "receita" | "despesa" }
type Entry = {
  id: string
  tipo: "receita" | "despesa"
  descricao: string
  valor: number
  status: "pendente" | "pago" | "cancelado"
  data_competencia: string
  data_vencimento: string | null
  data_pagamento: string | null
  forma_pagamento: string | null
  documento: string | null
  observacao: string | null
  financeiro_categorias: { nome: string } | null
  financeiro_contas: { nome: string } | null
}
type Summary = { receitas: number; despesas: number; aReceber: number; aPagar: number; saldoContas: number }
type FinanceData = { accounts: Account[]; categories: Category[]; entries: Entry[]; summary: Summary }

const paymentMethods = [
  { value: "dinheiro", label: "Dinheiro" }, { value: "pix", label: "Pix" },
  { value: "debito", label: "Cartão de débito" }, { value: "credito", label: "Cartão de crédito" },
  { value: "boleto", label: "Boleto" }, { value: "transferencia", label: "Transferência" }, { value: "outro", label: "Outro" },
]

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function FinanceiroPage() {
  const [data, setData] = useState<FinanceData>({ accounts: [], categories: [], entries: [], summary: { receitas: 0, despesas: 0, aReceber: 0, aPagar: 0, saldoContas: 0 } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [month, setMonth] = useState<Dayjs>(dayjs())
  const [entryModal, setEntryModal] = useState(false)
  const [accountModal, setAccountModal] = useState(false)
  const [categoryModal, setCategoryModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [entryType, setEntryType] = useState<"receita" | "despesa">("despesa")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>()
  const [entryForm] = Form.useForm()
  const [accountForm] = Form.useForm()
  const [categoryForm] = Form.useForm()

  const authHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    const response = await fetch(`/api/admin/financeiro?from=${month.startOf("month").format("YYYY-MM-DD")}&to=${month.endOf("month").format("YYYY-MM-DD")}`, { headers: await authHeaders() })
    const result = await response.json().catch(() => null)
    if (!response.ok) setError(result?.error ?? "Não foi possível carregar o financeiro.")
    else setData(result)
    setLoading(false)
  }, [authHeaders, month])

  useEffect(() => { load() }, [load])

  async function createResource(values: Record<string, unknown>, resource: "conta" | "categoria" | "lancamento") {
    setSaving(true)
    const response = await fetch("/api/admin/financeiro", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ resource, ...values }) })
    const result = await response.json().catch(() => null)
    setSaving(false)
    if (!response.ok) {
      alert(result?.error ?? "Não foi possível salvar.")
      return false
    }
    await load()
    return true
  }

  async function createEntry(values: Record<string, unknown>) {
    const status = values.status as string
    const success = await createResource({
      ...values,
      valor: Number(values.valor),
      dataCompetencia: (values.dataCompetencia as Dayjs).format("YYYY-MM-DD"),
      dataVencimento: values.dataVencimento ? (values.dataVencimento as Dayjs).format("YYYY-MM-DD") : null,
      dataPagamento: status === "pago" ? ((values.dataPagamento as Dayjs | undefined) ?? dayjs()).format("YYYY-MM-DD") : null,
      pedidoId: null,
    }, "lancamento")
    if (success) { setEntryModal(false); entryForm.resetFields() }
  }

  async function updateStatus(entry: Entry, status: Entry["status"]) {
    const response = await fetch(`/api/admin/financeiro/lancamentos/${entry.id}`, {
      method: "PATCH", headers: await authHeaders(),
      body: JSON.stringify({ status, dataPagamento: status === "pago" ? dayjs().format("YYYY-MM-DD") : null }),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) alert(result?.error ?? "Não foi possível atualizar.")
    else await load()
  }

  async function deleteEntry(id: string) {
    const response = await fetch(`/api/admin/financeiro/lancamentos/${id}`, { method: "DELETE", headers: await authHeaders() })
    if (!response.ok) alert("Não foi possível excluir o lançamento.")
    else await load()
  }

  const filteredEntries = useMemo(() => data.entries.filter((entry) => {
    const term = search.trim().toLowerCase()
    return (!term || [entry.descricao, entry.documento, entry.financeiro_categorias?.nome].some((value) => value?.toLowerCase().includes(term))) &&
      (!statusFilter || entry.status === statusFilter)
  }), [data.entries, search, statusFilter])

  async function exportFinance() {
    const XLSX = await import("xlsx")
    const rows = filteredEntries.map((entry) => ({
      Competência: dayjs(entry.data_competencia).format("DD/MM/YYYY"),
      Descrição: entry.descricao,
      Tipo: entry.tipo === "receita" ? "Receita" : "Despesa",
      Categoria: entry.financeiro_categorias?.nome ?? "",
      Conta: entry.financeiro_contas?.nome ?? "",
      Valor: Number(entry.valor),
      Situação: entry.status === "pago" ? "Pago" : entry.status === "pendente" ? "Pendente" : "Cancelado",
      Vencimento: entry.data_vencimento ? dayjs(entry.data_vencimento).format("DD/MM/YYYY") : "",
      Pagamento: entry.data_pagamento ? dayjs(entry.data_pagamento).format("DD/MM/YYYY") : "",
      "Forma de pagamento": paymentMethods.find((method) => method.value === entry.forma_pagamento)?.label ?? entry.forma_pagamento ?? "",
      Documento: entry.documento ?? "",
      Observação: entry.observacao ?? "",
    }))
    const sheet = XLSX.utils.json_to_sheet(rows)
    const summary = XLSX.utils.json_to_sheet([{
      Período: month.format("MM/YYYY"), "Saldo nas contas": data.summary.saldoContas,
      "Receitas recebidas": data.summary.receitas, "Despesas pagas": data.summary.despesas,
      Resultado: data.summary.receitas - data.summary.despesas, "A receber": data.summary.aReceber, "A pagar": data.summary.aPagar,
    }])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, "Lançamentos")
    XLSX.utils.book_append_sheet(workbook, summary, "Resumo")
    XLSX.writeFile(workbook, `financeiro-${month.format("YYYY-MM")}.xlsx`)
  }

  const columns: TableColumnsType<Entry> = [
    { title: "Competência", dataIndex: "data_competencia", width: 115, sorter: (a, b) => dayjs(a.data_competencia).valueOf() - dayjs(b.data_competencia).valueOf(), render: (value) => dayjs(value).format("DD/MM/YYYY") },
    { title: "Descrição", dataIndex: "descricao", width: 260, ellipsis: true },
    { title: "Categoria", width: 170, render: (_, entry) => entry.financeiro_categorias?.nome ?? "—" },
    { title: "Conta", width: 130, render: (_, entry) => entry.financeiro_contas?.nome ?? "—" },
    { title: "Tipo", dataIndex: "tipo", width: 100, render: (value) => <Tag color={value === "receita" ? "green" : "red"}>{value === "receita" ? "Receita" : "Despesa"}</Tag> },
    { title: "Status", dataIndex: "status", width: 105, render: (value) => <Tag color={value === "pago" ? "blue" : value === "pendente" ? "gold" : "default"}>{value === "pago" ? "Pago" : value === "pendente" ? "Pendente" : "Cancelado"}</Tag> },
    { title: "Valor", dataIndex: "valor", width: 130, align: "right", sorter: (a, b) => Number(a.valor) - Number(b.valor), render: (value, entry) => <span className={entry.tipo === "receita" ? "text-green-700 font-medium" : "text-red-700 font-medium"}>{entry.tipo === "receita" ? "+" : "-"}{money(Number(value))}</span> },
    { title: "Ações", width: 230, fixed: "right", render: (_, entry) => <Space size="small">
      {entry.status !== "pago" && <Button size="small" onClick={() => updateStatus(entry, "pago")}>Dar baixa</Button>}
      {entry.status === "pago" && <Button size="small" onClick={() => updateStatus(entry, "pendente")}>Reabrir</Button>}
      {entry.status !== "cancelado" && <Button size="small" onClick={() => updateStatus(entry, "cancelado")}>Cancelar</Button>}
      <Popconfirm title="Excluir lançamento?" description="Esta ação não pode ser desfeita." okText="Excluir" cancelText="Voltar" onConfirm={() => deleteEntry(entry.id)}><Button size="small" danger icon={<Trash2 className="w-3.5 h-3.5" />} /></Popconfirm>
    </Space> },
  ]

  const cards = [
    { title: "Saldo nas contas", value: data.summary.saldoContas, icon: WalletCards, color: "text-blue-600" },
    { title: "Receitas recebidas", value: data.summary.receitas, icon: TrendingUp, color: "text-green-600" },
    { title: "Despesas pagas", value: data.summary.despesas, icon: TrendingDown, color: "text-red-600" },
    { title: "Resultado do mês", value: data.summary.receitas - data.summary.despesas, icon: CircleDollarSign, color: data.summary.receitas - data.summary.despesas >= 0 ? "text-green-600" : "text-red-600" },
    { title: "A receber", value: data.summary.aReceber, icon: ReceiptText, color: "text-amber-600" },
    { title: "A pagar", value: data.summary.aPagar, icon: Landmark, color: "text-orange-600" },
  ]

  return <div className="space-y-6">
    <div className="flex flex-wrap justify-between gap-3">
      <div><h1 className="text-2xl font-semibold text-gray-900">Financeiro</h1><p className="text-sm text-gray-500 mt-1">Fluxo de caixa e compromissos do negócio</p></div>
      <Space wrap>
        <DatePicker picker="month" allowClear={false} value={month} format="MMMM [de] YYYY" onChange={(value) => value && setMonth(value)} />
        <Button onClick={() => setAccountModal(true)}>Nova conta</Button>
        <Button onClick={() => setCategoryModal(true)}>Nova categoria</Button>
        <Button icon={<FileSpreadsheet className="w-4 h-4" />} onClick={exportFinance}>Exportar Excel</Button>
        <Button type="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { setEntryType("despesa"); entryForm.setFieldsValue({ tipo: "despesa", status: "pago", dataCompetencia: dayjs(), dataPagamento: dayjs() }); setEntryModal(true) }}>Novo lançamento</Button>
      </Space>
    </div>

    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">{cards.map((item) => <Card key={item.title} loading={loading}><div className="flex justify-between gap-3"><Statistic title={item.title} value={item.value} precision={2} prefix="R$" decimalSeparator="," groupSeparator="." /><item.icon className={`w-5 h-5 ${item.color}`} /></div></Card>)}</div>

    <div className="grid lg:grid-cols-3 gap-4">{data.accounts.map((account) => <Card key={account.id} size="small"><Statistic title={`${account.nome} · ${account.tipo}`} value={account.saldo_atual} precision={2} prefix="R$" decimalSeparator="," groupSeparator="." /></Card>)}</div>

    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3"><Input.Search allowClear placeholder="Buscar descrição, documento ou categoria" className="w-full md:w-96" onChange={(event) => setSearch(event.target.value)} /><Select allowClear placeholder="Status" className="w-44" value={statusFilter} onChange={setStatusFilter} options={[{ value: "pendente", label: "Pendente" }, { value: "pago", label: "Pago" }, { value: "cancelado", label: "Cancelado" }]} /></div>
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden"><Table<Entry> rowKey="id" loading={loading} columns={columns} dataSource={filteredEntries} pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (total) => `${total} lançamentos` }} scroll={{ x: 1200, y: "calc(100vh - 470px)" }} locale={{ emptyText: "Nenhum lançamento neste período" }} /></div>

    <Modal title="Novo lançamento" open={entryModal} onCancel={() => setEntryModal(false)} footer={null} destroyOnHidden>
      <Form form={entryForm} layout="vertical" onFinish={createEntry} initialValues={{ tipo: "despesa", status: "pago", dataCompetencia: dayjs(), dataPagamento: dayjs() }} onValuesChange={(changed: { tipo?: "receita" | "despesa" }) => changed.tipo && setEntryType(changed.tipo)}>
        <div className="grid grid-cols-2 gap-3"><Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}><Select options={[{ value: "receita", label: "Receita" }, { value: "despesa", label: "Despesa" }]} /></Form.Item><Form.Item name="valor" label="Valor" rules={[{ required: true }]}><InputNumber className="w-full" min={0.01} precision={2} prefix="R$" /></Form.Item></div>
        <Form.Item name="descricao" label="Descrição" rules={[{ required: true, min: 2 }]}><Input /></Form.Item>
        <div className="grid grid-cols-2 gap-3"><Form.Item name="categoriaId" label="Categoria" rules={[{ required: true }]}><Select options={data.categories.filter((category) => category.tipo === entryType).map((category) => ({ value: category.id, label: category.nome }))} /></Form.Item><Form.Item name="contaId" label="Conta" rules={[{ required: true }]}><Select options={data.accounts.map((account) => ({ value: account.id, label: account.nome }))} /></Form.Item></div>
        <div className="grid grid-cols-2 gap-3"><Form.Item name="status" label="Situação" rules={[{ required: true }]}><Select options={[{ value: "pago", label: "Pago/recebido" }, { value: "pendente", label: "Pendente" }]} /></Form.Item><Form.Item name="formaPagamento" label="Forma de pagamento"><Select allowClear options={paymentMethods} /></Form.Item></div>
        <div className="grid grid-cols-3 gap-3"><Form.Item name="dataCompetencia" label="Competência" rules={[{ required: true }]}><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item><Form.Item name="dataVencimento" label="Vencimento"><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item><Form.Item name="dataPagamento" label="Pagamento"><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item></div>
        <Form.Item name="documento" label="Documento/nota"><Input /></Form.Item><Form.Item name="observacao" label="Observação"><Input.TextArea rows={3} /></Form.Item>
        <div className="flex justify-end gap-2"><Button onClick={() => setEntryModal(false)}>Cancelar</Button><Button type="primary" htmlType="submit" loading={saving}>Salvar lançamento</Button></div>
      </Form>
    </Modal>

    <Modal title="Nova conta financeira" open={accountModal} onCancel={() => setAccountModal(false)} footer={null} destroyOnHidden><Form form={accountForm} layout="vertical" initialValues={{ tipo: "banco", saldoInicial: 0 }} onFinish={async (values) => { if (await createResource(values, "conta")) { setAccountModal(false); accountForm.resetFields() } }}><Form.Item name="nome" label="Nome" rules={[{ required: true }]}><Input placeholder="Ex.: Banco Inter" /></Form.Item><Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}><Select options={[{ value: "caixa", label: "Caixa" }, { value: "banco", label: "Banco" }, { value: "pix", label: "Pix" }, { value: "cartao", label: "Cartão" }, { value: "outro", label: "Outro" }]} /></Form.Item><Form.Item name="saldoInicial" label="Saldo inicial" rules={[{ required: true }]}><InputNumber className="w-full" precision={2} prefix="R$" /></Form.Item><div className="flex justify-end gap-2"><Button onClick={() => setAccountModal(false)}>Cancelar</Button><Button type="primary" htmlType="submit" loading={saving}>Criar conta</Button></div></Form></Modal>

    <Modal title="Nova categoria" open={categoryModal} onCancel={() => setCategoryModal(false)} footer={null} destroyOnHidden><Form form={categoryForm} layout="vertical" initialValues={{ tipo: "despesa" }} onFinish={async (values) => { if (await createResource(values, "categoria")) { setCategoryModal(false); categoryForm.resetFields() } }}><Form.Item name="nome" label="Nome" rules={[{ required: true }]}><Input placeholder="Ex.: Material para personalização" /></Form.Item><Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}><Select options={[{ value: "receita", label: "Receita" }, { value: "despesa", label: "Despesa" }]} /></Form.Item><div className="flex justify-end gap-2"><Button onClick={() => setCategoryModal(false)}>Cancelar</Button><Button type="primary" htmlType="submit" loading={saving}>Criar categoria</Button></div></Form></Modal>
  </div>
}
