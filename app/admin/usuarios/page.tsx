"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { UserCheck, UserX, Plus, Loader2 } from "lucide-react"

interface AdminUser {
  email: string
  ativo: boolean
  created_at: string
}

export default function UsuariosPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState("")
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState("")
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from("admin_users")
      .select("email, ativo, created_at")
      .order("created_at", { ascending: true })
    setAdmins((data as AdminUser[]) ?? [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setAdding(true)
    setAddError("")

    const { error } = await supabase
      .from("admin_users")
      .insert({ email: newEmail.trim().toLowerCase(), ativo: true })

    setAdding(false)
    if (error) {
      setAddError(error.code === "23505" ? "Este e-mail já está cadastrado." : error.message)
    } else {
      setNewEmail("")
      await load()
    }
  }

  async function handleToggle(email: string, ativo: boolean) {
    setToggling(email)
    await supabase
      .from("admin_users")
      .update({ ativo: !ativo })
      .eq("email", email)
    setAdmins((prev) =>
      prev.map((a) => (a.email === email ? { ...a, ativo: !ativo } : a))
    )
    setToggling(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuários Admin</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie quem tem acesso ao painel administrativo
        </p>
      </div>

      {/* Add new admin */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar administrador
        </h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="newEmail" className="sr-only">E-mail</Label>
            <Input
              id="newEmail"
              type="email"
              placeholder="admin@exemplo.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
            {addError && <p className="text-xs text-red-600">{addError}</p>}
          </div>
          <Button type="submit" disabled={adding}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
          </Button>
        </form>
        <p className="text-xs text-gray-400 mt-3">
          O e-mail adicionado precisa ter uma conta criada no Supabase Auth para conseguir fazer login.
        </p>
      </div>

      {/* Admin list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : admins.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">Nenhum administrador cadastrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">E-mail</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Adicionado em</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {admins.map((admin) => (
                <tr key={admin.email} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{admin.email}</td>
                  <td className="px-5 py-3.5">
                    {admin.ativo ? (
                      <Badge className="bg-green-100 text-green-800 border-0">Ativo</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-0">Inativo</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {new Date(admin.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(admin.email, admin.ativo)}
                      disabled={toggling === admin.email}
                      className={admin.ativo ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                    >
                      {toggling === admin.email ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : admin.ativo ? (
                        <><UserX className="h-4 w-4 mr-1.5" />Desativar</>
                      ) : (
                        <><UserCheck className="h-4 w-4 mr-1.5" />Ativar</>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
