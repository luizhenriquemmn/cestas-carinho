"use client"

import { useEffect, useState } from "react"
import { supabase, type Pedido, type Cliente } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  entregue: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
}

type PedidoComCliente = Pedido & { clientes: Pick<Cliente, "nome" | "telefone"> | null }

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoComCliente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("pedidos")
      .select("*, clientes(nome, telefone)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPedidos((data as PedidoComCliente[]) ?? [])
        setLoading(false)
      })
  }, [])

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
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Telefone</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{pedido.clientes?.nome ?? "—"}</td>
                      <td className="py-3 px-4 text-gray-600">{pedido.clientes?.telefone ?? "—"}</td>
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        {pedido.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[pedido.status] ?? "bg-gray-100 text-gray-800"}`}
                        >
                          {pedido.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
