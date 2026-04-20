'use client';

import Link from 'next/link';
import { ArrowRight, Truck, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative py-8 md:py-12 bg-gradient-to-r from-secondary/50 to-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Content */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight text-balance">
              Surpreenda com <span className="text-primary">cestas especiais</span>
            </h1>
            
            <p className="mt-3 text-muted-foreground max-w-lg text-pretty">
              Café da manhã, aniversário e datas comemorativas preparadas com carinho.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 justify-center md:justify-start">
              <Link href="#produtos">
                <Button size="sm" className="text-sm">
                  Ver Produtos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Trust badges - compact */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground text-xs">
            <div className="flex items-center gap-1.5 bg-card px-3 py-2 rounded-full border border-border/50">
              <Truck className="w-4 h-4 text-primary" />
              <span>Entrega rápida</span>
            </div>
            <div className="flex items-center gap-1.5 bg-card px-3 py-2 rounded-full border border-border/50">
              <Star className="w-4 h-4 text-primary" />
              <span>5 estrelas</span>
            </div>
            <div className="flex items-center gap-1.5 bg-card px-3 py-2 rounded-full border border-border/50">
              <Clock className="w-4 h-4 text-primary" />
              <span>Agende sua entrega</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
