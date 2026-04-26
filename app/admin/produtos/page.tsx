"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { supabase, type Produto } from "@/lib/supabase"
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
import { Plus, Pencil, Trash2, Upload, ImageIcon, X } from "lucide-react"

type Categoria = { id: string; nome: string }

type FormState = {
  nome: string
  descricao: string
  preco: string
  categoria: string
  foto_url: string
  ativo: boolean
  itens: string[]
}

const EMPTY_FORM: FormState = {
  nome: "",
  descricao: "",
  preco: "",
  categoria: "",
  foto_url: "",
  ativo: true,
  itens: [],
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Produto | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [newItem, setNewItem] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  async function fetchProdutos() {
    const { data } = await supabase.from("produtos").select("*").order("nome")
    setProdutos(data ?? [])
    setLoading(false)
  }

  async function fetchCategorias() {
    const { data } = await supabase
      .from("categorias")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome")
    setCategorias(data ?? [])
  }

  useEffect(() => {
    fetchProdutos()
    fetchCategorias()
  }, [])

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, categoria: categorias[0]?.nome ?? "" })
    setNewItem("")
    setError("")
    setDialogOpen(true)
  }

  function openEdit(produto: Produto) {
    setEditing(produto)
    setForm({
      nome: produto.nome,
      descricao: produto.descricao,
      preco: String(produto.preco),
      categoria: produto.categoria,
      foto_url: produto.foto_url,
      ativo: produto.ativo,
      itens: produto.itens ?? [],
    })
    setNewItem("")
    setError("")
    setDialogOpen(true)
  }

  function addItem() {
    const trimmed = newItem.trim()
    if (!trimmed) return
    setForm((f) => ({ ...f, itens: [...f.itens, trimmed] }))
    setNewItem("")
  }

  function removeItem(index: number) {
    setForm((f) => ({ ...f, itens: f.itens.filter((_, i) => i !== index) }))
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")

    const ext = file.name.split(".").pop() ?? file.type.split("/").pop() ?? "jpg"
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("produtos")
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      setError(`Erro no upload: ${uploadError.message}`)
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from("produtos")
      .getPublicUrl(path)

    setForm((f) => ({ ...f, foto_url: publicUrl }))
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.preco) {
      setError("Nome e preço são obrigatórios.")
      return
    }
    setSaving(true)
    setError("")

    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      preco: parseFloat(form.preco),
      categoria: form.categoria,
      foto_url: form.foto_url,
      ativo: form.ativo,
      itens: form.itens,
    }

    let saveError
    if (editing) {
      const { error: err } = await supabase.from("produtos").update(payload).eq("id", editing.id)
      saveError = err
    } else {
      const { error: err } = await supabase.from("produtos").insert(payload)
      saveError = err
    }

    setSaving(false)
    if (saveError) {
      setError("Erro ao salvar produto.")
    } else {
      setDialogOpen(false)
      fetchProdutos()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este produto?")) return
    await supabase.from("produtos").delete().eq("id", id)
    fetchProdutos()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Produtos</h2>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
            </div>
          ) : produtos.length === 0 ? (
            <p className="text-center text-gray-500 py-12 text-sm">Nenhum produto cadastrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Foto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Categoria</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Preço</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Ativo</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {p.foto_url ? (
                          <Image
                            src={p.foto_url}
                            alt={p.nome}
                            width={48}
                            height={48}
                            className="rounded-lg object-cover h-12 w-12"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{p.nome}</td>
                      <td className="py-3 px-4 text-gray-600">{p.categoria}</td>
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        {p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            p.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {p.ativo ? "Sim" : "Não"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(p)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(p.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Foto</Label>
              <div className="flex items-center gap-3">
                {form.foto_url ? (
                  <Image
                    src={form.foto_url}
                    alt="Preview"
                    width={64}
                    height={64}
                    className="rounded-lg object-cover h-16 w-16 border border-gray-200"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Enviando..." : "Upload"}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Nome do produto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Descreva o conteúdo da cesta"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preco">Preço *</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.preco}
                  onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <select
                  id="categoria"
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {categorias.length === 0 && (
                    <option value="">Sem categorias</option>
                  )}
                  {categorias.map((c) => (
                    <option key={c.id} value={c.nome}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Itens inclusos</Label>
              <div className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem() } }}
                  placeholder="Ex: 1 bolo de chocolate"
                />
                <Button type="button" variant="outline" size="icon" onClick={addItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.itens.length > 0 && (
                <ul className="space-y-1.5 mt-1">
                  {form.itens.map((item, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 bg-gray-50 rounded-md px-3 py-1.5 text-sm">
                      <span className="text-gray-700">{item}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, ativo: checked }))}
              />
              <Label htmlFor="ativo">Produto ativo</Label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
