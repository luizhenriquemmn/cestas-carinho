'use client';

import { useState } from 'react';
import { ProductCard } from './product-card';
import { CategoriesSection } from './categories-section';
import { products } from '@/lib/products';

export function ProductsSection() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  return (
    <>
      <CategoriesSection
        onCategorySelect={setSelectedCategory}
        selectedCategory={selectedCategory}
      />

      <section id="produtos" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              {selectedCategory ? 'Produtos da Categoria' : 'Nossos Produtos'}
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Cestas preparadas com ingredientes selecionados e muito carinho
            </p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="mt-4 text-primary hover:text-primary/80 underline text-sm"
              >
                Ver todos os produtos
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum produto encontrado nesta categoria.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
