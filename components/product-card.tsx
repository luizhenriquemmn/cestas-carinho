'use client';

import { ShoppingBag, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/lib/types';
import { useCart } from '@/components/cart-context';
import { useState } from 'react';
import { ProductModal } from './product-modal';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <>
      <Card className="group overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg bg-card">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quick Actions */}
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 bg-card/90 backdrop-blur-sm hover:bg-card text-foreground"
              onClick={() => setIsModalOpen(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver mais
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => addItem(product)}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-serif font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
            {product.description}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-bold text-xl text-primary">
              {formatPrice(product.price)}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="md:hidden text-primary hover:text-primary/80"
              onClick={() => addItem(product)}
            >
              <ShoppingBag className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProductModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
