'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Check, ArrowLeft } from 'lucide-react';
import type { ClienteSession } from '@/lib/session';

export default function PerfilPage() {
  const router = useRouter();
  const [session, setSession] = useState<ClienteSession | null>(null);
  const [form, setForm] = useState({ nome: '', telefone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) { router.replace('/conta/login'); return; }
      const cliente: ClienteSession = await meRes.json();
      setSession(cliente);

      const perfilRes = await fetch('/api/conta/perfil');
      if (perfilRes.ok) {
        const data = await perfilRes.json();
        if (data) setForm({ nome: data.nome ?? '', telefone: data.telefone ?? '', email: data.email ?? '' });
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setError('');
    setSaved(false);

    const res = await fetch('/api/conta/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError('Erro ao salvar: ' + (data.error ?? 'tente novamente'));
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  if (loading) return <div className="h-48 bg-muted rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.push('/conta/pedidos')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Meus Pedidos
      </button>

      <div className="bg-card rounded-2xl border border-border p-8">
        <h1 className="font-serif text-2xl font-bold text-foreground mb-2">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mb-6">Atualize suas informações de contato</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input id="nome" required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone/WhatsApp</Label>
            <Input id="telefone" type="tel" required value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <Check className="w-4 h-4" /> Salvo!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
