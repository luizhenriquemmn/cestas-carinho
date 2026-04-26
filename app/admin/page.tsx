"use client"

import { useEffect, useState } from "react"
import { supabase, type Pedido } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Package } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  entregue: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
}

export default function AdminDashboardPage() {
  const [totalPedidos, setTotalPedidos] = useState(0)
  const [totalProdutos, setTotalProdutos] = useState(0)
  const [ultimosPedidos, setUltimosPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [
        { count: pedidosCount },
        { count: produtosCount },
        { data: pedidos },
      ] = await Promise.all([
        supabase.from("pedidos").select("*", { count: "exact", head: true }),
        supabase.from("produtos").select("*", { count: "exact", head: true }),
        supabase.from("pedidos").select("*").order("created_at", { ascending: false }).limit(5),
      ])

      setTotalPedidos(pedidosCount ?? 0)
      setTotalProdutos(produtosCount ?? 0)
      setUltimosPedidos(pedidos ?? [])
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-xl border animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalPedidos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Produtos Cadastrados</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalProdutos}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimos 5 Pedidos</h3>
        <Card>
          <CardContent className="p-0">
            {ultimosPedidos.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-sm">Nenhum pedido encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimosPedidos.map((pedido) => (
                      <tr key={pedido.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">
                          {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
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
    </div>
  )
}
