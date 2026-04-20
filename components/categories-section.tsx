'use client';

import { Coffee, Cake, Heart, Briefcase, Star, Calendar, Gift, ShoppingBag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type CategoryConfig = {
  icon: LucideIcon;
  color: string;
  description: string;
};

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  'Café da Manhã':       { icon: Coffee,    color: 'bg-primary/15 text-primary',             description: 'Cestas completas para começar o dia' },
  'Aniversário':         { icon: Cake,      color: 'bg-accent/20 text-accent-foreground',     description: 'Celebre com cestas especiais' },
  'Romântico':           { icon: Heart,     color: 'bg-rose-100 text-rose-600',               description: 'Para momentos a dois' },
  'Corporativo':         { icon: Briefcase, color: 'bg-violet-100 text-violet-600',           description: 'Presentes empresariais' },
  'Datas Especiais':     { icon: Star,      color: 'bg-rose-100 text-rose-600',               description: 'Para momentos inesquecíveis' },
  'Datas Comemorativas': { icon: Calendar,  color: 'bg-orange-100 text-orange-600',           description: 'Comemore datas importantes' },
  'Especial':            { icon: Gift,      color: 'bg-emerald-100 text-emerald-600',         description: 'Cestas únicas e especiais' },
};

const DEFAULT_CONFIG: CategoryConfig = {
  icon: ShoppingBag,
  color: 'bg-muted text-muted-foreground',
  description: 'Cestas especiais para você',
};

function getConfig(name: string): CategoryConfig {
  return CATEGORY_CONFIG[name] ?? DEFAULT_CONFIG;
}

interface CategoriesSectionProps {
  onCategorySelect?: (category: string | null) => void;
  selectedCategory?: string | null;
  availableCategories?: string[];
}

export function CategoriesSection({ onCategorySelect, selectedCategory, availableCategories }: CategoriesSectionProps) {
  if (!availableCategories?.length) return null;

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
          {availableCategories.map((name) => {
            const { icon: Icon, color, description } = getConfig(name);
            const isSelected = selectedCategory === name;

            return (
              <button
                key={name}
                onClick={() => onCategorySelect?.(isSelected ? null : name)}
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
                <h3 className="font-semibold text-foreground text-lg">{name}</h3>
                <p className="text-muted-foreground text-sm mt-1">{description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
