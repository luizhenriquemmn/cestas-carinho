'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    if (form.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        telefone: form.telefone,
        email: form.email,
        senha: form.password,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Erro ao criar conta.');
      return;
    }

    router.push('/conta/pedidos');
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-8">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Criar conta</h1>
      <p className="text-muted-foreground text-sm mb-6">Acompanhe seus pedidos e histórico de compras</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome completo</Label>
          <Input id="nome" required value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Seu nome completo" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone/WhatsApp</Label>
          <Input id="telefone" type="tel" required value={form.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(11) 99999-9999" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="seu@email.com" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" required minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Mínimo 8 caracteres" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input id="confirmPassword" type="password" required value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} placeholder="Repita a senha" />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Já tem conta?{' '}
        <Link href="/conta/login" className="text-primary hover:underline font-medium">Entrar</Link>
      </p>
    </div>
  );
}
