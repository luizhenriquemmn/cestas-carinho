'use client';

import { Coffee, Cake, Heart, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  {
    id: 'cafe-manha',
    name: 'Café da Manhã',
    description: 'Cestas completas para começar o dia',
    icon: Coffee,
    color: 'bg-primary/15 text-primary',
  },
  {
    id: 'aniversario',
    name: 'Aniversário',
    description: 'Celebre com cestas especiais',
    icon: Cake,
    color: 'bg-accent/20 text-accent-foreground',
  },
  {
    id: 'romantico',
    name: 'Romântico',
    description: 'Para momentos a dois',
    icon: Heart,
    color: 'bg-rose-100 text-rose-600',
  },
  {
    id: 'corporativo',
    name: 'Corporativo',
    description: 'Presentes empresariais',
    icon: Briefcase,
    color: 'bg-violet-100 text-violet-600',
  },
];

interface CategoriesSectionProps {
  onCategorySelect?: (categoryId: string | null) => void;
  selectedCategory?: string | null;
}

export function CategoriesSection({ onCategorySelect, selectedCategory }: CategoriesSectionProps) {
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
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => onCategorySelect?.(isSelected ? null : category.id)}
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
                    category.color
                  )}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">
                  {category.name}
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {category.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
