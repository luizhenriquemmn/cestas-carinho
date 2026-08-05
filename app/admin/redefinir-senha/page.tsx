"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { establishRecoverySession } from "@/lib/password-recovery"
import { getPasswordUpdateErrorMessage } from "@/lib/auth-error-message"

export default function RedefinirSenhaAdminPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    establishRecoverySession()
      .then((valid) => { if (active) setStatus(valid ? "ready" : "invalid") })
      .catch(() => { if (active) setStatus("invalid") })
    return () => { active = false }
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    if (password.length < 8) return setError("A nova senha deve ter pelo menos 8 caracteres.")
    if (password !== confirmation) return setError("As senhas não coincidem.")
    setLoading(true)
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      setLoading(false)
      setStatus("invalid")
      return
    }
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) return setError(getPasswordUpdateErrorMessage(updateError.message))
    await supabase.auth.signOut()
    router.replace("/admin/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Criar nova senha</CardTitle>
          <CardDescription>Use pelo menos 8 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "checking" ? (
            <p className="text-sm text-center text-gray-600">Validando o link de recuperação...</p>
          ) : status === "invalid" ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-red-600">Este link é inválido, já foi utilizado ou expirou.</p>
              <p className="text-sm text-gray-600">Solicite um novo link e utilize somente o e-mail mais recente.</p>
              <Link href="/admin/recuperar-senha"><Button className="w-full">Solicitar novo link</Button></Link>
              <p><Link href="/admin/login" className="text-sm text-purple-700 hover:underline">Voltar ao login</Link></p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="password">Nova senha</Label><Input id="password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" /></div>
              <div className="space-y-2"><Label htmlFor="confirmation">Confirmar senha</Label><Input id="confirmation" type="password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required autoComplete="new-password" /></div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Salvando..." : "Salvar nova senha"}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
