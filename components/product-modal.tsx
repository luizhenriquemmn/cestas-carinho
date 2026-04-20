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

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

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
      <div className="relative bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-card/80 backdrop-blur-sm hover:bg-card"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative aspect-square md:aspect-auto md:h-full">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col max-h-[60vh] md:max-h-[80vh] overflow-y-auto">
            <h2 className="font-serif text-2xl font-bold text-foreground">
              {product.name}
            </h2>
            <p className="text-primary font-bold text-2xl mt-2">
              {formatPrice(product.price)}
            </p>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              {product.description}
            </p>

            {/* Items */}
            <div className="mt-6">
              <h4 className="font-semibold text-foreground mb-3">
                Itens inclusos:
              </h4>
              <ul className="grid grid-cols-1 gap-2">
                {product.items.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

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
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="flex items-center border border-input rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-4 font-semibold text-foreground">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                className="flex-1"
                size="lg"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Adicionar {formatPrice(product.price * quantity)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
