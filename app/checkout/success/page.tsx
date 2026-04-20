import Link from 'next/link';
import { CheckCircle, Home, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>
        
        <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
          Pedido Enviado!
        </h1>
        
        <p className="text-muted-foreground leading-relaxed mb-8">
          Seu pedido foi enviado com sucesso para nosso WhatsApp. 
          Em breve entraremos em contato para confirmar os detalhes e combinar a entrega.
        </p>

        <div className="bg-card rounded-2xl p-6 border border-border mb-8">
          <h3 className="font-semibold text-foreground mb-3">Próximos passos:</h3>
          <ul className="text-left text-muted-foreground text-sm space-y-2">
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
          </ul>
        </div>

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
