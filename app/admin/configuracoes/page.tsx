"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

type ConfigRow = { id: string; chave: string; valor: string }

type FormState = {
  nome_loja: string
  whatsapp: string
  email: string
  endereco: string
  banner_texto: string
}

function rowsToForm(rows: ConfigRow[]): FormState {
  const get = (chave: string) => rows.find((r) => r.chave === chave)?.valor ?? ""
  return {
    nome_loja:    get("nome_loja"),
    whatsapp:     get("whatsapp"),
    email:        get("email"),
    endereco:     get("endereco"),
    banner_texto: get("banner_texto"),
  }
}

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<FormState>({
    nome_loja: "", whatsapp: "", email: "", endereco: "", banner_texto: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    supabase
      .from("configuracoes")
      .select("id, chave, valor")
      .then(({ data }) => {
        if (data) setForm(rowsToForm(data as ConfigRow[]))
        setLoading(false)
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSaved(false)

    const updates: [string, string][] = [
      ["nome_loja",    form.nome_loja],
      ["whatsapp",     form.whatsapp],
      ["email",        form.email],
      ["endereco",     form.endereco],
      ["banner_texto", form.banner_texto],
    ]

    const results = await Promise.all(
      updates.map(([chave, valor]) =>
        supabase.from("configuracoes").update({ valor }).eq("chave", chave)
      )
    )

    setSaving(false)

    const failed = results.find((r) => r.error)
    if (failed?.error) {
      setError(`Erro ao salvar: ${failed.error.message}`)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-96 bg-white rounded-xl border animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-900">Configurações</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Informações da Loja</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">

            <div className="space-y-2">
              <Label htmlFor="nome_loja">Nome da Loja</Label>
              <Input
                id="nome_loja"
                value={form.nome_loja}
                onChange={(e) => setForm((f) => ({ ...f, nome_loja: e.target.value }))}
                placeholder="Cestas & Carinho"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                placeholder="5511999999999"
              />
              <p className="text-xs text-gray-500">Número com código do país, sem espaços (ex: 5511999999999)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="contato@sualojanome.com.br"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={form.endereco}
                onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
                placeholder="São Paulo, SP - Entrega em toda região"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner_texto">Texto do Banner</Label>
              <Textarea
                id="banner_texto"
                value={form.banner_texto}
                onChange={(e) => setForm((f) => ({ ...f, banner_texto: e.target.value }))}
                placeholder="Frete grátis para pedidos acima de R$100"
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <Check className="h-4 w-4" />
                  Salvo com sucesso!
                </span>
              )}
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
