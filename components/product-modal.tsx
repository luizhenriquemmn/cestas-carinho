'use client';

import Image from 'next/image';
import { X, ShoppingBag, Plus, Minus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { useCart } from '@/components/cart-context';
import { useState, useEffect } from 'react';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setQuantity(1);
      setObservation('');
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const formatPrice = (price: number) =>
    price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleAddToCart = () => {
    addItem(product, quantity, observation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-176 max-h-[90vh] overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-card/80 backdrop-blur-sm hover:bg-card"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="flex flex-col md:flex-row h-full">
          {/* Image — vídeo no mobile para economizar altura, quadrado no desktop */}
          <div className="relative w-full aspect-video md:aspect-auto md:w-64 lg:w-80 md:shrink-0">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
              priority
            />
          </div>

          {/* Content — min-w-0 evita overflow horizontal no flex, overflow-x-hidden elimina scrollbar horizontal */}
          <div className="flex flex-col flex-1 min-w-0 overflow-y-auto overflow-x-hidden max-h-[60vh] md:max-h-[90vh] p-6">
            <h2 className="font-serif text-2xl font-bold text-foreground pr-8">
              {product.name}
            </h2>
            <p className="text-primary font-bold text-2xl mt-2">
              {formatPrice(product.price)}
            </p>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              {product.description}
            </p>

            {/* Items */}
            {product.items.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-foreground mb-3">
                  Itens inclusos:
                </h4>
                <ul className="space-y-2">
                  {product.items.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Observation */}
            <div className="mt-6">
              <label className="font-semibold text-foreground block mb-2">
                Observações (opcional):
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
                placeholder="Ex: Sem glúten, mensagem no cartão..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
            </div>

            {/* Quantity & Add to Cart */}
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center border border-input rounded-lg shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-4 font-semibold text-foreground min-w-8 text-center">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                className="flex-1 min-w-40"
                size="lg"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-5 w-5 mr-2 shrink-0" />
                <span className="truncate">Adicionar {formatPrice(product.price * quantity)}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
