"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Coffee, Cake, Heart, Briefcase, Gift, Star, Package,
  Plus, Pencil, Trash2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

type Categoria = {
  id: string
  nome: string
  descricao: string
  icone: string
  ativo: boolean
}

type FormState = {
  nome: string
  descricao: string
  icone: string
  ativo: boolean
}

const EMPTY_FORM: FormState = {
  nome: "",
  descricao: "",
  icone: "Coffee",
  ativo: true,
}

const ICONE_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "Coffee",    label: "Café",        icon: Coffee },
  { value: "Cake",      label: "Bolo",        icon: Cake },
  { value: "Heart",     label: "Coração",     icon: Heart },
  { value: "Briefcase", label: "Maleta",      icon: Briefcase },
  { value: "Gift",      label: "Presente",    icon: Gift },
  { value: "Star",      label: "Estrela",     icon: Star },
  { value: "Package",   label: "Caixa",       icon: Package },
]

const ICON_MAP: Record<string, LucideIcon> = {
  Coffee, Cake, Heart, Briefcase, Gift, Star, Package,
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Categoria | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function fetchCategorias() {
    const { data } = await supabase.from("categorias").select("*").order("nome")
    setCategorias(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError("")
    setDialogOpen(true)
  }

  function openEdit(cat: Categoria) {
    setEditing(cat)
    setForm({
      nome: cat.nome,
      descricao: cat.descricao,
      icone: cat.icone,
      ativo: cat.ativo,
    })
    setError("")
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      setError("Nome é obrigatório.")
      return
    }
    setSaving(true)
    setError("")

    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      icone: form.icone,
      ativo: form.ativo,
    }

    let saveError
    if (editing) {
      const { error: err } = await supabase.from("categorias").update(payload).eq("id", editing.id)
      saveError = err
    } else {
      const { error: err } = await supabase.from("categorias").insert(payload)
      saveError = err
    }

    setSaving(false)
    if (saveError) {
      setError("Erro ao salvar categoria.")
    } else {
      setDialogOpen(false)
      fetchCategorias()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta categoria?")) return
    await supabase.from("categorias").delete().eq("id", id)
    fetchCategorias()
  }

  const selectedOption = ICONE_OPTIONS.find((o) => o.value === form.icone)
  const PreviewIcon = selectedOption?.icon ?? Coffee

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Categorias</h2>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
            </div>
          ) : categorias.length === 0 ? (
            <p className="text-center text-gray-500 py-12 text-sm">Nenhuma categoria cadastrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Ícone</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Descrição</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Ativo</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((cat) => {
                    const Icon = ICON_MAP[cat.icone] ?? Package
                    return (
                      <tr key={cat.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-purple-600" />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">{cat.nome}</td>
                        <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{cat.descricao || "—"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              cat.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {cat.ativo ? "Sim" : "Não"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(cat)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(cat.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Café da Manhã"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Breve descrição da categoria"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-4 gap-2">
                {ICONE_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icone: value }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-colors ${
                      form.icone === value
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <span>Selecionado:</span>
                <div className="flex items-center gap-1.5 font-medium text-gray-700">
                  <PreviewIcon className="h-4 w-4" />
                  {selectedOption?.label}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, ativo: checked }))}
              />
              <Label htmlFor="ativo">Categoria ativa</Label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
