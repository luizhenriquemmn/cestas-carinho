'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PedidoComCliente } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, LogOut, UserCircle } from 'lucide-react';
import type { ClienteSession } from '@/lib/session';

const STATUS_COLORS: Record<string, string> = {
  aguardando_confirmacao: 'bg-yellow-100 text-yellow-800',
  confirmado:             'bg-blue-100 text-blue-800',
  em_preparo:             'bg-indigo-100 text-indigo-800',
  saiu_para_entrega:      'bg-orange-100 text-orange-800',
  entregue:               'bg-green-100 text-green-800',
  cancelado:              'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  aguardando_confirmacao: 'Aguardando confirmação',
  confirmado:             'Confirmado',
  em_preparo:             'Em preparo',
  saiu_para_entrega:      'Saiu p/ entrega',
  entregue:               'Entregue',
  cancelado:              'Cancelado',
};

function formatPrice(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MeusPedidosPage() {
  const router = useRouter();
  const [session, setSession] = useState<ClienteSession | null>(null);
  const [pedidos, setPedidos] = useState<PedidoComCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) { router.replace('/conta/login'); return; }
      const cliente: ClienteSession = await meRes.json();
      setSession(cliente);

      const pedidosRes = await fetch('/api/conta/pedidos');
      if (pedidosRes.ok) {
        const data = await pedidosRes.json();
        setPedidos(data as PedidoComCliente[]);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Meus Pedidos</h1>
          {session && <p className="text-sm text-muted-foreground mt-0.5">Olá, {session.nome}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/conta/perfil')}>
            <UserCircle className="w-4 h-4 mr-2" />
            Meu Perfil
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <p className="text-muted-foreground mb-4">Você ainda não tem pedidos.</p>
          <Button onClick={() => router.push('/')}>Ver produtos</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map((pedido) => {
            const isExpanded = expandedId === pedido.id;
            return (
              <div key={pedido.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {new Date(pedido.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(pedido.total)} · {pedido.tipo_entrega === 'retirada' ? 'Retirada' : 'Entrega'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[pedido.status] ?? 'bg-gray-100 text-gray-800'}`}>
                      {STATUS_LABELS[pedido.status] ?? pedido.status}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-border bg-secondary/20">
                    <ul className="mt-4 space-y-2">
                      {pedido.pedido_itens.map((item) => (
                        <li key={item.id} className="flex justify-between text-sm text-foreground">
                          <span>{item.produtos?.nome ?? item.produto_id} × {item.quantidade}</span>
                          <span>{formatPrice(item.preco_unitario * item.quantidade)}</span>
                        </li>
                      ))}
                    </ul>
                    {pedido.observacao && (
                      <p className="mt-3 text-sm text-muted-foreground"><span className="font-medium">Obs:</span> {pedido.observacao}</p>
                    )}
                    {pedido.endereco_entrega && (
                      <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium">Endereço:</span> {pedido.endereco_entrega}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
