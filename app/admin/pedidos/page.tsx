"use client"

import { useEffect, useMemo, useState } from "react"
import type { TableColumnsType } from "antd"
import { Button, Card, DatePicker, Image, Input, Modal, Select, Space, Statistic, Table, Tag } from "antd"
import { Ban, CircleDollarSign, CircleX, Eye, FileSpreadsheet, PackageCheck, Save, ShoppingCart, Trash2 } from "lucide-react"
import dayjs, { type Dayjs } from "dayjs"
import { supabase, type PedidoComCliente } from "@/lib/supabase"

const { RangePicker } = DatePicker
const { TextArea, Search } = Input

const STATUS_LIST = [
  "aguardando_confirmacao", "confirmado", "em_preparo", "saiu_para_entrega", "entregue", "cancelado", "rejeitado",
]

const STATUS_LABELS: Record<string, string> = {
  aguardando_confirmacao: "Aguardando",
  confirmado: "Confirmado",
  em_preparo: "Em preparo",
  saiu_para_entrega: "Saiu p/ entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
  rejeitado: "Rejeitado",
}

const STATUS_COLORS: Record<string, string> = {
  aguardando_confirmacao: "gold",
  confirmado: "blue",
  em_preparo: "purple",
  saiu_para_entrega: "orange",
  entregue: "green",
  cancelado: "red",
  rejeitado: "volcano",
}

type EditState = {
  status: string
  taxa_entrega: string
  desconto_tipo: "valor" | "percentual"
  desconto_informado: string
  desconto_motivo: string
  saving: boolean
}

type DecisionAction = "cancelar" | "rejeitar" | "excluir"

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoComCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState<Record<string, EditState>>({})
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>()
  const [deliveryFilter, setDeliveryFilter] = useState<string>()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [decision, setDecision] = useState<{ pedido: PedidoComCliente; action: DecisionAction } | null>(null)
  const [decisionComment, setDecisionComment] = useState("")
  const [decisionLoading, setDecisionLoading] = useState(false)
  const [productDetail, setProductDetail] = useState<PedidoComCliente["pedido_itens"][number] | null>(null)

  useEffect(() => {
    supabase
      .from("pedidos")
      .select("*, clientes(nome, telefone, email), pedido_itens(*, produtos(nome, preco, descricao, foto_url, categoria, itens))")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = (data as PedidoComCliente[]) ?? []
        setPedidos(rows)
        setEdits(Object.fromEntries(rows.map((pedido) => [pedido.id, {
          status: pedido.status,
          taxa_entrega: String(pedido.taxa_entrega ?? 0),
          desconto_tipo: pedido.desconto_tipo ?? "valor",
          desconto_informado: String(pedido.desconto_informado ?? 0),
          desconto_motivo: pedido.desconto_motivo ?? "",
          saving: false,
        }])))
        setLoading(false)
      })
  }, [])

  function setEdit(id: string, patch: Partial<EditState>) {
    setEdits((current) => ({ ...current, [id]: { ...current[id], ...patch } }))
  }

  async function getAccessToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? ""
  }

  async function savePedido(
    pedido: PedidoComCliente,
    options?: { status?: string; decisionAction?: "cancelar" | "rejeitar"; decisionComment?: string },
  ) {
    const edit = edits[pedido.id]
    if (!edit) return false
    setEdit(pedido.id, { saving: true })
    const taxa = Number.parseFloat(edit.taxa_entrega) || 0
    const desconto = Number.parseFloat(edit.desconto_informado) || 0
    const response = await fetch(`/api/admin/pedidos/${pedido.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getAccessToken()}` },
      body: JSON.stringify({
        status: options?.status ?? edit.status,
        deliveryFee: taxa,
        discountType: desconto > 0 ? edit.desconto_tipo : null,
        discountInput: desconto,
        discountReason: edit.desconto_motivo,
        decisionAction: options?.decisionAction,
        decisionComment: options?.decisionComment,
      }),
    })
    setEdit(pedido.id, { saving: false })
    const result = await response.json().catch(() => null)
    if (!response.ok) {
      alert(result?.error ?? "Não foi possível salvar o pedido.")
      return false
    }
    const nextStatus = options?.status ?? edit.status
    setPedidos((current) => current.map((row) => row.id === pedido.id ? {
      ...row,
      status: nextStatus,
      taxa_entrega: taxa,
      subtotal: result.subtotal,
      desconto_tipo: desconto > 0 ? edit.desconto_tipo : null,
      desconto_informado: desconto,
      desconto_valor: result.discountValue,
      desconto_motivo: desconto > 0 ? edit.desconto_motivo : null,
      decisao_comentario: options?.decisionComment ?? row.decisao_comentario,
      total: result.total,
    } : row))
    setEdit(pedido.id, { status: nextStatus })
    return true
  }

  async function confirmDecision() {
    if (!decision) return
    setDecisionLoading(true)
    let success = false
    if (decision.action === "excluir") {
      const response = await fetch(`/api/admin/pedidos/${decision.pedido.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getAccessToken()}` },
        body: JSON.stringify({ comment: decisionComment }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) alert(result?.error ?? "Não foi possível excluir o pedido.")
      else {
        setPedidos((current) => current.filter((row) => row.id !== decision.pedido.id))
        success = true
      }
    } else {
      success = await savePedido(decision.pedido, {
        status: decision.action === "cancelar" ? "cancelado" : "rejeitado",
        decisionAction: decision.action,
        decisionComment,
      })
    }
    setDecisionLoading(false)
    if (success) {
      setDecision(null)
      setDecisionComment("")
    }
  }

  const filteredPedidos = useMemo(() => pedidos.filter((pedido) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || [pedido.id, pedido.clientes?.nome, pedido.clientes?.telefone, pedido.clientes?.email]
      .some((value) => value?.toLowerCase().includes(term))
    const matchesStatus = !statusFilter || pedido.status === statusFilter
    const matchesDelivery = !deliveryFilter || pedido.tipo_entrega === deliveryFilter
    const createdAt = dayjs(pedido.created_at)
    const matchesDate = !dateRange?.[0] || !dateRange?.[1] ||
      (createdAt.isAfter(dateRange[0].startOf("day")) && createdAt.isBefore(dateRange[1].endOf("day")))
    return matchesSearch && matchesStatus && matchesDelivery && matchesDate
  }), [pedidos, search, statusFilter, deliveryFilter, dateRange])

  const dashboard = useMemo(() => {
    const valid = filteredPedidos.filter((pedido) => !["cancelado", "rejeitado"].includes(pedido.status))
    const revenue = valid.reduce((sum, pedido) => sum + Number(pedido.total), 0)
    const itemCount = valid.reduce((sum, pedido) => sum + pedido.pedido_itens.reduce((itemSum, item) => itemSum + item.quantidade, 0), 0)
    return {
      total: filteredPedidos.length,
      revenue,
      average: valid.length ? revenue / valid.length : 0,
      delivered: filteredPedidos.filter((pedido) => pedido.status === "entregue").length,
      pending: filteredPedidos.filter((pedido) => pedido.status === "aguardando_confirmacao").length,
      itemCount,
    }
  }, [filteredPedidos])

  async function exportOrders() {
    const XLSX = await import("xlsx")
    const rows = filteredPedidos.flatMap((pedido) => {
      if (!pedido.pedido_itens.length) return [{
        Pedido: pedido.id, Data: dayjs(pedido.created_at).format("DD/MM/YYYY"), Cliente: pedido.clientes?.nome ?? "",
        Telefone: pedido.clientes?.telefone ?? "", Produto: "Pedido sem itens", Quantidade: 0,
        "Preço unitário": 0, Subtotal: Number(pedido.subtotal ?? pedido.total), Desconto: Number(pedido.desconto_valor ?? 0),
        Entrega: Number(pedido.taxa_entrega ?? 0), Total: Number(pedido.total), Status: STATUS_LABELS[pedido.status] ?? pedido.status,
      }]
      return pedido.pedido_itens.map((item) => ({
        Pedido: pedido.id,
        Data: dayjs(pedido.created_at).format("DD/MM/YYYY"),
        Cliente: pedido.clientes?.nome ?? "",
        Telefone: pedido.clientes?.telefone ?? "",
        Produto: item.produto_snapshot?.nome ?? item.produtos?.nome ?? item.produto_id,
        Quantidade: item.quantidade,
        "Preço unitário": Number(item.preco_unitario),
        "Total do item": Number(item.preco_unitario) * item.quantidade,
        Subtotal: Number(pedido.subtotal ?? pedido.total),
        Desconto: Number(pedido.desconto_valor ?? 0),
        Entrega: Number(pedido.taxa_entrega ?? 0),
        Total: Number(pedido.total),
        Status: STATUS_LABELS[pedido.status] ?? pedido.status,
        "Tipo de entrega": pedido.tipo_entrega === "retirada" ? "Retirada" : "Entrega",
        "Comentário da decisão": pedido.decisao_comentario ?? "",
      }))
    })
    const sheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, "Pedidos")
    XLSX.writeFile(workbook, `pedidos-${dayjs().format("YYYY-MM-DD")}.xlsx`)
  }

  const columns: TableColumnsType<PedidoComCliente> = [
    { title: "Data", dataIndex: "created_at", width: 120, sorter: (a, b) => dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf(), render: (value) => dayjs(value).format("DD/MM/YYYY") },
    { title: "Cliente", key: "cliente", width: 220, sorter: (a, b) => (a.clientes?.nome ?? "").localeCompare(b.clientes?.nome ?? ""), render: (_, pedido) => pedido.clientes?.nome ?? "—" },
    { title: "Entrega", dataIndex: "tipo_entrega", width: 110, render: (value) => value === "retirada" ? "Retirada" : "Entrega" },
    { title: "Total", dataIndex: "total", width: 130, align: "right", sorter: (a, b) => a.total - b.total, render: formatPrice },
    { title: "Status", dataIndex: "status", width: 150, render: (value) => <Tag color={STATUS_COLORS[value]}>{STATUS_LABELS[value] ?? value}</Tag> },
    {
      title: "Ações", key: "acoes", width: 250, fixed: "right",
      render: (_, pedido) => <Space size="small">
        <Button size="small" icon={<Ban className="w-4 h-4" />} onClick={() => { setDecision({ pedido, action: "cancelar" }); setDecisionComment("") }}>Cancelar</Button>
        <Button size="small" danger ghost icon={<CircleX className="w-4 h-4" />} onClick={() => { setDecision({ pedido, action: "rejeitar" }); setDecisionComment("") }}>Rejeitar</Button>
        <Button size="small" danger icon={<Trash2 className="w-4 h-4" />} onClick={() => { setDecision({ pedido, action: "excluir" }); setDecisionComment("") }}>Excluir</Button>
      </Space>,
    },
  ]

  function expandedRow(pedido: PedidoComCliente) {
    const edit = edits[pedido.id]
    if (!edit) return null
    return <div className="grid gap-6 lg:grid-cols-2 py-2">
      <div className="space-y-3 text-sm text-gray-600">
        <h4 className="font-semibold text-gray-900">Informações</h4>
        <p><strong>Cliente:</strong> {pedido.clientes?.nome ?? "—"}</p>
        <p><strong>Telefone:</strong> {pedido.clientes?.telefone ?? "—"}</p>
        <p><strong>E-mail:</strong> {pedido.clientes?.email ?? "—"}</p>
        {pedido.endereco_entrega && <p><strong>Endereço:</strong> {pedido.endereco_entrega}</p>}
        {pedido.observacao && <p><strong>Observação:</strong> {pedido.observacao}</p>}
        {pedido.decisao_comentario && <p className="text-red-700"><strong>Decisão:</strong> {pedido.decisao_comentario}</p>}
        <h4 className="font-semibold text-gray-900 pt-2">Itens</h4>
        {pedido.pedido_itens.length ? pedido.pedido_itens.map((item) => <div key={item.id} className="flex items-center justify-between gap-4">
          <span>{item.produto_snapshot?.nome ?? item.produtos?.nome ?? item.produto_id} × {item.quantidade}</span>
          <span className="flex items-center gap-2"><span>{formatPrice(item.preco_unitario * item.quantidade)}</span><Button type="text" size="small" title="Ver detalhes do produto" icon={<Eye className="w-4 h-4" />} onClick={() => setProductDetail(item)} /></span>
        </div>) : <p className="text-red-600">Pedido sem itens cadastrados</p>}
      </div>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs font-medium text-gray-600">Status<Select className="w-full mt-1" value={edit.status} options={STATUS_LIST.map((value) => ({ value, label: STATUS_LABELS[value] }))} onChange={(value) => setEdit(pedido.id, { status: value })} /></label>
          <label className="text-xs font-medium text-gray-600">Taxa de entrega<Input className="mt-1" type="number" min={0} value={edit.taxa_entrega} onChange={(event) => setEdit(pedido.id, { taxa_entrega: event.target.value })} prefix="R$" /></label>
          <label className="text-xs font-medium text-gray-600">Tipo de desconto<Select className="w-full mt-1" value={edit.desconto_tipo} options={[{ value: "valor", label: "Valor (R$)" }, { value: "percentual", label: "Percentual (%)" }]} onChange={(value) => setEdit(pedido.id, { desconto_tipo: value })} /></label>
          <label className="text-xs font-medium text-gray-600">Desconto<Input className="mt-1" type="number" min={0} max={edit.desconto_tipo === "percentual" ? 100 : undefined} value={edit.desconto_informado} onChange={(event) => setEdit(pedido.id, { desconto_informado: event.target.value })} /></label>
        </div>
        <label className="text-xs font-medium text-gray-600">Motivo do desconto<Input className="mt-1" value={edit.desconto_motivo} onChange={(event) => setEdit(pedido.id, { desconto_motivo: event.target.value })} placeholder="Ex.: negociação via WhatsApp" /></label>
        <Button type="primary" icon={<Save className="w-4 h-4" />} loading={edit.saving} disabled={!pedido.pedido_itens.length} onClick={() => savePedido(pedido)}>Salvar alterações</Button>
      </div>
    </div>
  }

  const actionLabel = decision?.action === "cancelar" ? "Cancelar pedido" : decision?.action === "rejeitar" ? "Rejeitar pedido" : "Excluir pedido definitivamente"
  const productInfo = productDetail ? { ...(productDetail.produtos ?? {}), ...(productDetail.produto_snapshot ?? {}) } : null

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold text-gray-900">Pedidos</h1><p className="text-sm text-gray-500 mt-1">{filteredPedidos.length} pedido(s) encontrado(s)</p></div><Button type="primary" icon={<FileSpreadsheet className="w-4 h-4" />} onClick={exportOrders}>Exportar Excel</Button></div>
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
      <Card size="small"><Statistic title="Pedidos" value={dashboard.total} prefix={<ShoppingCart className="w-4 h-4" />} /></Card>
      <Card size="small"><Statistic title="Faturamento" value={dashboard.revenue} precision={2} prefix="R$" decimalSeparator="," groupSeparator="." /></Card>
      <Card size="small"><Statistic title="Ticket médio" value={dashboard.average} precision={2} prefix="R$" decimalSeparator="," groupSeparator="." /></Card>
      <Card size="small"><Statistic title="Aguardando" value={dashboard.pending} prefix={<CircleDollarSign className="w-4 h-4 text-amber-600" />} /></Card>
      <Card size="small"><Statistic title="Entregues" value={dashboard.delivered} prefix={<PackageCheck className="w-4 h-4 text-green-600" />} /></Card>
      <Card size="small"><Statistic title="Itens vendidos" value={dashboard.itemCount} /></Card>
    </div>
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3">
      <Search placeholder="Buscar cliente, telefone, e-mail ou ID" allowClear className="w-full md:w-80" onSearch={setSearch} onChange={(event) => setSearch(event.target.value)} />
      <Select allowClear placeholder="Status" className="w-48" value={statusFilter} onChange={setStatusFilter} options={STATUS_LIST.map((value) => ({ value, label: STATUS_LABELS[value] }))} />
      <Select allowClear placeholder="Entrega/retirada" className="w-44" value={deliveryFilter} onChange={setDeliveryFilter} options={[{ value: "entrega", label: "Entrega" }, { value: "retirada", label: "Retirada" }]} />
      <RangePicker format="DD/MM/YYYY" value={dateRange} onChange={(value) => setDateRange(value as [Dayjs | null, Dayjs | null] | null)} />
      <Button onClick={() => { setSearch(""); setStatusFilter(undefined); setDeliveryFilter(undefined); setDateRange(null) }}>Limpar filtros</Button>
    </div>
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <Table<PedidoComCliente>
        rowKey="id" columns={columns} dataSource={filteredPedidos} loading={loading}
        expandable={{ expandedRowRender: expandedRow }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (total) => `${total} pedidos` }}
        scroll={{ x: 1100, y: "calc(100vh - 560px)" }}
        locale={{ emptyText: "Nenhum pedido encontrado" }}
      />
    </div>
    <Modal title="Detalhes do produto no pedido" open={Boolean(productDetail)} footer={<Button onClick={() => setProductDetail(null)}>Fechar</Button>} onCancel={() => setProductDetail(null)} width={650}>
      {productDetail && productInfo && <div className="grid sm:grid-cols-[180px_1fr] gap-5">
        <div>{productInfo.foto_url ? <Image src={productInfo.foto_url} alt={productInfo.nome ?? "Produto"} className="rounded-lg" width={180} height={180} style={{ objectFit: "cover" }} /> : <div className="w-[180px] h-[180px] rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">Sem foto</div>}</div>
        <div className="space-y-3 text-sm">
          <h3 className="text-lg font-semibold text-gray-900">{productInfo.nome ?? productDetail.produto_id}</h3>
          {productInfo.categoria && <p><strong>Categoria:</strong> {productInfo.categoria}</p>}
          {productInfo.descricao && <p className="text-gray-600">{productInfo.descricao}</p>}
          <div className="grid grid-cols-2 gap-2"><p><strong>Quantidade:</strong> {productDetail.quantidade}</p><p><strong>Preço unitário:</strong> {formatPrice(productDetail.preco_unitario)}</p></div>
          <p className="text-base"><strong>Total do item:</strong> {formatPrice(productDetail.preco_unitario * productDetail.quantidade)}</p>
          {productInfo.itens && productInfo.itens.length > 0 && <div><strong>Composição vendida:</strong><ul className="list-disc pl-5 mt-1 text-gray-600">{productInfo.itens.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></div>}
          {productDetail.produto_snapshot && <Tag color="blue">Dados preservados no momento da compra</Tag>}
        </div>
      </div>}
    </Modal>
    <Modal title={actionLabel} open={Boolean(decision)} okText={decision?.action === "excluir" ? "Excluir definitivamente" : "Confirmar decisão"} okButtonProps={{ danger: true }} confirmLoading={decisionLoading} onOk={confirmDecision} onCancel={() => { setDecision(null); setDecisionComment("") }}>
      <p className="mb-3 text-gray-600">Você pode adicionar um comentário. A decisão e o administrador responsável ficarão registrados no histórico.</p>
      {decision?.action === "excluir" && <p className="mb-3 font-medium text-red-600">A exclusão remove o pedido e seus itens da listagem e não pode ser desfeita.</p>}
      <TextArea rows={4} maxLength={1000} showCount value={decisionComment} onChange={(event) => setDecisionComment(event.target.value)} placeholder="Comentário opcional" />
    </Modal>
  </div>
}
