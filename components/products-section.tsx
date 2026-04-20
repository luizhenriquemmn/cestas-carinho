'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from './product-card';
import { CategoriesSection } from './categories-section';
import { supabase, Produto } from '@/lib/supabase';
import { Product } from '@/lib/types';

function mapProduto(p: Produto): Product {
  return {
    id: p.id,
    name: p.nome,
    description: p.descricao,
    price: p.preco,
    image: p.foto_url,
    category: p.categoria as Product['category'],
    items: [],
  };
}

export function ProductsSection() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true);

      if (error) {
        console.error('Erro ao buscar produtos:', error);
      } else {
        setProducts((data ?? []).map(mapProduto));
      }
      setLoading(false);
    }

    fetchProducts();
  }, []);

  const availableCategories = [...new Set(products.map((p) => p.category))];

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  return (
    <>
      <CategoriesSection
        onCategorySelect={setSelectedCategory}
        selectedCategory={selectedCategory}
        availableCategories={availableCategories}
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

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-muted animate-pulse aspect-3/4" />
              ))}
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </section>
    </>
  );
}
