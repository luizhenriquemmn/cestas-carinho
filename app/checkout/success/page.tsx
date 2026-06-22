'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, Home, ArrowRight, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

function SuccessContent() {
  const searchParams = useSearchParams();
  const saved = searchParams.get('saved') === 'true';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${saved ? 'bg-emerald-100' : 'bg-primary/10'}`}>
          {saved
            ? <Clock className="w-12 h-12 text-emerald-600" />
            : <CheckCircle className="w-12 h-12 text-primary" />
          }
        </div>

        <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
          {saved ? 'Pedido Salvo!' : 'Pedido Enviado!'}
        </h1>

        <p className="text-muted-foreground leading-relaxed mb-8">
          {saved
            ? 'Seu pedido foi registrado. Nossa equipe entrará em contato em breve para confirmar os detalhes.'
            : 'Seu pedido foi enviado via WhatsApp. Em breve entraremos em contato para confirmar os detalhes e combinar a entrega.'
          }
        </p>

        <div className="bg-card rounded-2xl p-6 border border-border mb-6">
          <h3 className="font-semibold text-foreground mb-3">Próximos passos:</h3>
          <ul className="text-left text-muted-foreground text-sm space-y-2">
            {saved ? (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  Aguarde nosso contato para confirmar o pedido
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  Combine a forma de pagamento
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  Receba sua cesta no horário combinado
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  Aguarde a confirmação do pedido via WhatsApp
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  Combine a forma de pagamento
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  Receba sua cesta no horário combinado
                </li>
              </>
            )}
          </ul>
        </div>

        {saved && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-5 h-5 text-primary shrink-0" />
              <h4 className="font-semibold text-foreground text-sm">Acompanhe seus pedidos</h4>
            </div>
            <p className="text-muted-foreground text-sm mb-3">
              Crie uma conta para ver o histórico e o status dos seus pedidos a qualquer momento.
            </p>
            <Link href="/conta/cadastro">
              <Button size="sm" className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                Criar conta grátis
              </Button>
            </Link>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Button>
          </Link>
          <Link href="/#produtos">
            <Button>
              Continuar Comprando
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
