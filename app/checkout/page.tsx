'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingBag, Send, Trash2, Plus, Minus, Truck, MapPin, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCart } from '@/components/cart-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type TipoEntrega = 'entrega' | 'retirada';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, removeItem, updateQuantity, clearCart } = useCart();

  const [isSaving, setIsSaving] = useState(false);
  const [isSendingWpp, setIsSendingWpp] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [nomeLoja, setNomeLoja] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('entrega');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    deliveryDate: '',
    deliveryTime: '',
    observations: '',
  });

  useEffect(() => {
    // Fetch store config
    supabase
      .from('configuracoes')
      .select('chave, valor')
      .in('chave', ['whatsapp', 'nome_loja'])
      .then(({ data }) => {
        const get = (chave: string) => data?.find((r) => r.chave === chave)?.valor ?? '';
        setWhatsappNumber(get('whatsapp'));
        setNomeLoja(get('nome_loja'));
      });

    // Pre-fill if customer is logged in
    fetch('/api/conta/perfil').then(async (res) => {
      if (!res.ok) return;
      const cliente = await res.json();
      if (cliente) {
        setFormData((f) => ({
          ...f,
          name: cliente.nome ?? f.name,
          phone: cliente.telefone ?? f.phone,
          email: cliente.email ?? f.email,
        }));
      }
    });
  }, []);

  const formatPrice = (price: number) =>
    price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function saveOrderToDb(): Promise<{ id: string; total: number } | null> {
    const response = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: formData.name, phone: formData.phone, email: formData.email },
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        deliveryType: tipoEntrega,
        deliveryAddress: tipoEntrega === 'entrega' ? formData.address : undefined,
        deliveryDate: formData.deliveryDate || undefined,
        deliveryTime: formData.deliveryTime || undefined,
        observations: formData.observations || undefined,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setSaveError(body?.error ?? 'Não foi possível salvar o pedido. Tente novamente.');
      return null;
    }

    return response.json();
  }

  const generateWhatsAppMessage = (confirmedTotal = totalPrice) => {
    const tipoLabel = tipoEntrega === 'retirada' ? 'Retirada no local' : 'Entrega a domicílio';
    let message = `*Novo Pedido - ${nomeLoja}*\n\n`;
    message += `*Cliente:* ${formData.name}\n`;
    message += `*Telefone:* ${formData.phone}\n`;
    message += `*E-mail:* ${formData.email}\n`;
    message += `*Tipo:* ${tipoLabel}\n`;
    if (tipoEntrega === 'entrega') {
      message += `*Endereço:* ${formData.address}\n`;
    }
    if (formData.deliveryDate) message += `*Data:* ${formData.deliveryDate}\n`;
    if (formData.deliveryTime) message += `*Horário:* ${formData.deliveryTime}\n`;
    message += `\n*Itens do Pedido:*\n───────────────\n`;

    items.forEach((item) => {
      message += `\n• ${item.product.name}\n`;
      message += `  Qtd: ${item.quantity} x ${formatPrice(item.product.price)}\n`;
      message += `  Subtotal: ${formatPrice(item.product.price * item.quantity)}\n`;
      if (item.observation) message += `  Obs: ${item.observation}\n`;
    });

    message += `\n───────────────\n*TOTAL: ${formatPrice(confirmedTotal)}*\n`;
    if (formData.observations) message += `\n*Observações:* ${formData.observations}`;
    return encodeURIComponent(message);
  };

  const handleSaveOrder = async () => {
    if (!formData.name || !formData.phone || !formData.email) return;
    setSaveError('');
    setIsSaving(true);
    const savedOrder = await saveOrderToDb();
    setIsSaving(false);
    if (savedOrder) {
      clearCart();
      router.push('/checkout/success?saved=true');
    } else {
      setSaveError('Não foi possível salvar o pedido. Tente novamente.');
    }
  };

  const handleWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setIsSendingWpp(true);
    const savedOrder = await saveOrderToDb();
    setIsSendingWpp(false);
    if (!savedOrder) return;
    const message = generateWhatsAppMessage(savedOrder.total);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    setTimeout(() => {
      clearCart();
      router.push('/checkout/success');
    }, 500);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
            Seu carrinho está vazio
          </h1>
          <p className="text-muted-foreground mb-6">
            Adicione produtos ao carrinho para continuar
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar às compras
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formValid = !!formData.name && !!formData.phone && !!formData.email &&
    (tipoEntrega === 'retirada' || !!formData.address);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Voltar às compras</span>
            </Link>
            <h1 className="flex-1 text-center font-serif text-xl font-bold text-foreground">
              Finalizar Pedido
            </h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Form */}
          <div className="order-2 lg:order-1">
            <div className="bg-card rounded-2xl p-6 md:p-8 border border-border">
              <h2 className="font-serif text-xl font-bold text-foreground mb-6">
                Seus Dados
              </h2>

              <form onSubmit={handleWhatsApp} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Nome completo *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                      Telefone/WhatsApp *
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      E-mail *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {/* Tipo de entrega */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Tipo de entrega *</Label>
                  <RadioGroup
                    value={tipoEntrega}
                    onValueChange={(v) => setTipoEntrega(v as TipoEntrega)}
                    className="grid grid-cols-2 gap-3"
                  >
                    <Label
                      htmlFor="entrega"
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                        tipoEntrega === 'entrega'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <RadioGroupItem value="entrega" id="entrega" className="sr-only" />
                      <Truck className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Entrega</p>
                        <p className="text-xs text-muted-foreground">No seu endereço</p>
                      </div>
                    </Label>
                    <Label
                      htmlFor="retirada"
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                        tipoEntrega === 'retirada'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <RadioGroupItem value="retirada" id="retirada" className="sr-only" />
                      <MapPin className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Retirada</p>
                        <p className="text-xs text-muted-foreground">No local</p>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>

                {tipoEntrega === 'entrega' && (
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">
                      Endereço de entrega *
                    </label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="deliveryDate" className="block text-sm font-medium text-foreground mb-2">
                      Data desejada
                    </label>
                    <Input
                      id="deliveryDate"
                      name="deliveryDate"
                      type="date"
                      value={formData.deliveryDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label htmlFor="deliveryTime" className="block text-sm font-medium text-foreground mb-2">
                      Horário preferido
                    </label>
                    <Input
                      id="deliveryTime"
                      name="deliveryTime"
                      type="time"
                      value={formData.deliveryTime}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="observations" className="block text-sm font-medium text-foreground mb-2">
                    Observações gerais (opcional)
                  </label>
                  <textarea
                    id="observations"
                    name="observations"
                    value={formData.observations}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    rows={3}
                    placeholder="Instruções especiais, mensagem para o cartão..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    disabled={isSaving || !formValid}
                    onClick={handleSaveOrder}
                  >
                    {isSaving ? (
                      'Salvando...'
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Realizar Pedido
                      </>
                    )}
                  </Button>

                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1"
                    disabled={isSendingWpp || !whatsappNumber || !formValid}
                  >
                    {isSendingWpp ? (
                      'Enviando...'
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Enviar via WhatsApp
                      </>
                    )}
                  </Button>
                </div>

                {saveError && (
                  <p className="text-center text-sm text-destructive">{saveError}</p>
                )}

                <p className="text-center text-muted-foreground text-xs">
                  "Realizar Pedido" registra seu pedido sem abrir o WhatsApp.
                  "Enviar via WhatsApp" salva e abre o WhatsApp para confirmar.
                </p>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-1 lg:order-2">
            <div className="bg-card rounded-2xl p-6 md:p-8 border border-border lg:sticky lg:top-24">
              <h2 className="font-serif text-xl font-bold text-foreground mb-6">
                Resumo do Pedido
              </h2>

              <div className="space-y-4 max-h-[40vh] overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-4 bg-secondary/50 rounded-xl"
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {item.product.name}
                      </h3>
                      <p className="text-primary font-bold">
                        {formatPrice(item.product.price)}
                      </p>
                      {item.observation && (
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-1">
                          Obs: {item.observation}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-input rounded-lg bg-background">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-2 text-sm font-semibold text-foreground">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive/80"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border space-y-3">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Entrega</span>
                  <span className="text-primary">
                    {tipoEntrega === 'retirada' ? 'Gratuita (retirada)' : 'A combinar'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xl font-bold text-foreground pt-3 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
