'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Coffee, Cake, Heart, Briefcase, Gift, Star, Package, ShoppingBag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Categoria = {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  ativo: boolean;
};

const ICON_MAP: Record<string, LucideIcon> = {
  Coffee, Cake, Heart, Briefcase, Gift, Star, Package,
};

const COLOR_MAP: Record<string, string> = {
  Coffee:    'bg-primary/15 text-primary',
  Cake:      'bg-accent/20 text-accent-foreground',
  Heart:     'bg-rose-100 text-rose-600',
  Briefcase: 'bg-violet-100 text-violet-600',
  Gift:      'bg-emerald-100 text-emerald-600',
  Star:      'bg-amber-100 text-amber-600',
  Package:   'bg-muted text-muted-foreground',
};

interface CategoriesSectionProps {
  onCategorySelect?: (category: string | null) => void;
  selectedCategory?: string | null;
  availableCategories?: string[];
}

export function CategoriesSection({ onCategorySelect, selectedCategory }: CategoriesSectionProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    supabase
      .from('categorias')
      .select('*')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => {
        setCategorias(data ?? []);
      });
  }, []);

  if (!categorias.length) return null;

  return (
    <section id="categorias" className="py-16 md:py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            Nossas Categorias
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Encontre a cesta perfeita para cada ocasião especial
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categorias.map((cat) => {
            const Icon = ICON_MAP[cat.icone] ?? ShoppingBag;
            const color = COLOR_MAP[cat.icone] ?? 'bg-muted text-muted-foreground';
            const isSelected = selectedCategory === cat.nome;

            return (
              <button
                key={cat.id}
                onClick={() => onCategorySelect?.(isSelected ? null : cat.nome)}
                className={cn(
                  'group p-6 rounded-2xl transition-all duration-300 text-left',
                  'bg-card hover:shadow-lg hover:-translate-y-1',
                  'border border-border/50',
                  isSelected && 'ring-2 ring-primary shadow-lg'
                )}
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110',
                    color
                  )}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">{cat.nome}</h3>
                <p className="text-muted-foreground text-sm mt-1">{cat.descricao}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
