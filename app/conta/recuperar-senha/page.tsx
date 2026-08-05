'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function RecuperarSenhaClientePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const redirectTo = `${window.location.origin}/conta/redefinir-senha`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    if (resetError) {
      setError('Não foi possível enviar o e-mail agora. Tente novamente.');
      return;
    }
    setSent(true);
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'recovery',
    });
    setLoading(false);
    if (verifyError) {
      setError('Código inválido ou expirado. Confira o último e-mail recebido.');
      return;
    }
    router.push('/conta/redefinir-senha');
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-8">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Recuperar senha</h1>
      <p className="text-muted-foreground text-sm mb-6">Enviaremos um link para você criar uma nova senha.</p>
      {sent ? (
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-sm text-muted-foreground">Digite o código recebido em <strong>{email}</strong>.</p>
          <div className="space-y-2"><Label htmlFor="code">Código de recuperação</Label><Input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} required minLength={6} maxLength={8} placeholder="000000" /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Verificando...' : 'Validar código'}</Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => { setSent(false); setCode(''); setError(''); }}>Enviar outro código</Button>
          <p className="text-center"><Link href="/conta/login" className="text-sm text-primary hover:underline">Voltar ao login</Link></p>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Enviando...' : 'Enviar código de recuperação'}</Button>
          <p className="text-center"><Link href="/conta/login" className="text-sm text-primary hover:underline">Voltar ao login</Link></p>
        </form>
      )}
    </div>
  );
}
