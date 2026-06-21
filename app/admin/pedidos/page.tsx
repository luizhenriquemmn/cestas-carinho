"use client"

import { Fragment, useEffect, useState } from "react"
import { supabase, type PedidoComCliente } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Save } from "lucide-react"

const STATUS_LIST = [
  "aguardando_confirmacao",
  "confirmado",
  "em_preparo",
  "saiu_para_entrega",
  "entregue",
  "cancelado",
]

const STATUS_COLORS: Record<string, string> = {
  aguardando_confirmacao: "bg-yellow-100 text-yellow-800",
  confirmado:             "bg-blue-100 text-blue-800",
  em_preparo:             "bg-indigo-100 text-indigo-800",
  saiu_para_entrega:      "bg-orange-100 text-orange-800",
  entregue:               "bg-green-100 text-green-800",
  cancelado:              "bg-red-100 text-red-800",
}

const STATUS_LABELS: Record<string, string> = {
  aguardando_confirmacao: "Aguardando",
  confirmado:             "Confirmado",
  em_preparo:             "Em preparo",
  saiu_para_entrega:      "Saiu p/ entrega",
  entregue:               "Entregue",
  cancelado:              "Cancelado",
}

function formatPrice(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

type EditState = {
  status: string
  taxa_entrega: string
  saving: boolean
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoComCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, EditState>>({})

  useEffect(() => {
    supabase
      .from("pedidos")
      .select("*, clientes(nome, telefone, email), pedido_itens(*, produtos(nome, preco))")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = (data as PedidoComCliente[]) ?? []
        setPedidos(rows)
        const initialEdits: Record<string, EditState> = {}
        rows.forEach((p) => {
          initialEdits[p.id] = {
            status: p.status,
            taxa_entrega: String(p.taxa_entrega ?? 0),
            saving: false,
          }
        })
        setEdits(initialEdits)
        setLoading(false)
      })
  }, [])

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function setEdit(id: string, patch: Partial<EditState>) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  async function handleConfirm(pedido: PedidoComCliente) {
    const { error } = await supabase
      .from("pedidos")
      .update({ status: "confirmado" })
      .eq("id", pedido.id)

    if (!error) {
      setPedidos((prev) =>
        prev.map((p) => p.id === pedido.id ? { ...p, status: "confirmado" } : p)
      )
      setEdits((prev) => ({
        ...prev,
        [pedido.id]: { ...prev[pedido.id], status: "confirmado" },
      }))
    }
  }

  async function handleSave(pedido: PedidoComCliente) {
    const edit = edits[pedido.id]
    if (!edit) return
    setEdit(pedido.id, { saving: true })

    const taxa = parseFloat(edit.taxa_entrega) || 0
    const novoTotal = pedido.pedido_itens.reduce(
      (sum, item) => sum + item.quantidade * item.preco_unitario,
      0
    ) + taxa

    const { error } = await supabase
      .from("pedidos")
      .update({ status: edit.status, taxa_entrega: taxa, total: novoTotal })
      .eq("id", pedido.id)

    setEdit(pedido.id, { saving: false })
    if (!error) {
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedido.id
            ? { ...p, status: edit.status, taxa_entrega: taxa, total: novoTotal }
            : p
        )
      )
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Pedidos</h2>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
            </div>
          ) : pedidos.length === 0 ? (
            <p className="text-center text-gray-500 py-12 text-sm">Nenhum pedido encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Cliente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="py-3 px-4 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => {
                    const edit = edits[pedido.id]
                    const isExpanded = expandedId === pedido.id

                    return (
                      <Fragment key={pedido.id}>
                        <tr
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleExpand(pedido.id)}
                        >
                          <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                            {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {pedido.clientes?.nome ?? "—"}
                          </td>
                          <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                            {pedido.tipo_entrega === "retirada" ? "Retirada" : "Entrega"}
                          </td>
                          <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                            {formatPrice(pedido.total)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[pedido.status] ?? "bg-gray-100 text-gray-800"}`}
                              >
                                {STATUS_LABELS[pedido.status] ?? pedido.status}
                              </span>
                              {pedido.status === "aguardando_confirmacao" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleConfirm(pedido) }}
                                  className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                                >
                                  ✓ Confirmar
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4" />
                              : <ChevronDown className="w-4 h-4" />
                            }
                          </td>
                        </tr>

                        {isExpanded && edit && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="px-4 py-5">
                              <div className="grid md:grid-cols-2 gap-6">

                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-800 text-sm">Informações</h4>
                                  <div className="text-sm text-gray-600 space-y-1">
                                    <p><span className="font-medium">Cliente:</span> {pedido.clientes?.nome ?? "—"}</p>
                                    <p><span className="font-medium">Telefone:</span> {pedido.clientes?.telefone ?? "—"}</p>
                                    <p><span className="font-medium">Email:</span> {pedido.clientes?.email ?? "—"}</p>
                                    <p><span className="font-medium">Tipo:</span> {pedido.tipo_entrega === "retirada" ? "Retirada no local" : "Entrega a domicílio"}</p>
                                    {pedido.endereco_entrega && (
                                      <p><span className="font-medium">Endereço:</span> {pedido.endereco_entrega}</p>
                                    )}
                                    {pedido.data_entrega && (
                                      <p><span className="font-medium">Data:</span> {new Date(pedido.data_entrega + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                                    )}
                                    {pedido.horario_entrega && (
                                      <p><span className="font-medium">Horário:</span> {pedido.horario_entrega}</p>
                                    )}
                                    {pedido.observacao && (
                                      <p><span className="font-medium">Obs:</span> {pedido.observacao}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-800 text-sm">Itens</h4>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {pedido.pedido_itens.map((item) => (
                                      <li key={item.id} className="flex justify-between">
                                        <span>{item.produtos?.nome ?? item.produto_id} × {item.quantidade}</span>
                                        <span>{formatPrice(item.preco_unitario * item.quantidade)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              <div className="mt-5 flex flex-wrap items-end gap-4 border-t border-gray-200 pt-4">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-gray-600">Status</label>
                                  <select
                                    value={edit.status}
                                    onChange={(e) => setEdit(pedido.id, { status: e.target.value })}
                                    className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  >
                                    {STATUS_LIST.map((s) => (
                                      <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-gray-600">Taxa de entrega (R$)</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={edit.taxa_entrega}
                                    onChange={(e) => setEdit(pedido.id, { taxa_entrega: e.target.value })}
                                    className="w-32"
                                  />
                                </div>

                                <Button
                                  size="sm"
                                  disabled={edit.saving}
                                  onClick={(e) => { e.stopPropagation(); handleSave(pedido) }}
                                >
                                  <Save className="w-4 h-4 mr-1.5" />
                                  {edit.saving ? "Salvando..." : "Salvar"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
