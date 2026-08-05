'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha: password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'E-mail ou senha incorretos.');
      return;
    }

    router.push('/conta/pedidos');
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-8">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Entrar na sua conta</h1>
      <p className="text-muted-foreground text-sm mb-6">Acesse seus pedidos e histórico de compras</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="/conta/recuperar-senha" className="text-xs text-primary hover:underline">Esqueci minha senha</Link>
          </div>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Não tem conta?{' '}
        <Link href="/conta/cadastro" className="text-primary hover:underline font-medium">Criar conta</Link>
      </p>
    </div>
  );
}
