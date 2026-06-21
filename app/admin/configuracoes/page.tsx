"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type ConfigRow = { chave: string; valor: string }
type Categoria = { id: string; nome: string }

type FormState = {
  nome_loja: string
  whatsapp: string
  email: string
  endereco: string
  banner_ativo: boolean
  banner_texto: string
  banner_categoria: string
  banner_cor: string
}

const BANNER_CORES = [
  { value: "roxo",      label: "Roxo",      bg: "bg-primary" },
  { value: "rosa",      label: "Rosa",      bg: "bg-rose-500" },
  { value: "ambar",     label: "Âmbar",     bg: "bg-amber-500" },
  { value: "esmeralda", label: "Esmeralda", bg: "bg-emerald-600" },
]

function rowsToForm(rows: ConfigRow[]): FormState {
  const get = (chave: string) => rows.find((r) => r.chave === chave)?.valor ?? ""
  return {
    nome_loja:        get("nome_loja"),
    whatsapp:         get("whatsapp"),
    email:            get("email"),
    endereco:         get("endereco"),
    banner_ativo:     get("banner_ativo") === "true",
    banner_texto:     get("banner_texto"),
    banner_categoria: get("banner_categoria"),
    banner_cor:       get("banner_cor") || "roxo",
  }
}

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<FormState>({
    nome_loja: "", whatsapp: "", email: "", endereco: "",
    banner_ativo: false, banner_texto: "", banner_categoria: "", banner_cor: "roxo",
  })
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      supabase.from("configuracoes").select("chave, valor"),
      supabase.from("categorias").select("id, nome").eq("ativo", true).order("nome"),
    ]).then(([{ data: configData }, { data: catData }]) => {
      if (configData) setForm(rowsToForm(configData as ConfigRow[]))
      if (catData) setCategorias(catData as Categoria[])
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSaved(false)

    const updates: [string, string][] = [
      ["nome_loja",        form.nome_loja],
      ["whatsapp",         form.whatsapp],
      ["email",            form.email],
      ["endereco",         form.endereco],
      ["banner_ativo",     form.banner_ativo ? "true" : "false"],
      ["banner_texto",     form.banner_texto],
      ["banner_categoria", form.banner_categoria],
      ["banner_cor",       form.banner_cor],
    ]

    const results = await Promise.all(
      updates.map(([chave, valor]) =>
        supabase.from("configuracoes").upsert({ chave, valor }, { onConflict: "chave" })
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

      <form onSubmit={handleSave} className="space-y-6">

        {/* Informações da Loja */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Informações da Loja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

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

          </CardContent>
        </Card>

        {/* Banner Promocional */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Banner Promocional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            <div className="flex items-center justify-between">
              <Label htmlFor="banner_ativo">Banner ativo</Label>
              <Switch
                id="banner_ativo"
                checked={form.banner_ativo}
                onCheckedChange={(v) => setForm((f) => ({ ...f, banner_ativo: v }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner_texto">Texto do Banner</Label>
              <Textarea
                id="banner_texto"
                value={form.banner_texto}
                onChange={(e) => setForm((f) => ({ ...f, banner_texto: e.target.value }))}
                placeholder="Frete grátis para pedidos acima de R$100"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner_categoria">Categoria vinculada (opcional)</Label>
              <select
                id="banner_categoria"
                value={form.banner_categoria}
                onChange={(e) => setForm((f) => ({ ...f, banner_categoria: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Nenhuma (só exibe o texto)</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.nome}>{cat.nome}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500">Ao clicar no banner, o cliente será levado a esta categoria</p>
            </div>

            <div className="space-y-2">
              <Label>Cor do Banner</Label>
              <div className="grid grid-cols-4 gap-2">
                {BANNER_CORES.map((cor) => (
                  <button
                    key={cor.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, banner_cor: cor.value }))}
                    className={cn(
                      "h-10 rounded-lg flex items-center justify-center text-white text-xs font-medium transition-all",
                      cor.bg,
                      form.banner_cor === cor.value ? "ring-2 ring-offset-2 ring-gray-700" : "opacity-70 hover:opacity-100"
                    )}
                  >
                    {form.banner_cor === cor.value && <Check className="w-4 h-4 mr-1" />}
                    {cor.label}
                  </button>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <Check className="h-4 w-4" />
              Salvo com sucesso!
            </span>
          )}
        </div>

      </form>
    </div>
  )
}
