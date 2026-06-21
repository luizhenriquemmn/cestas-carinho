'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface PromotionalBannerProps {
  onCategorySelect: (category: string) => void;
}

type BannerConfig = {
  ativo: boolean;
  texto: string;
  categoria: string;
  cor: string;
};

const COLOR_CLASSES: Record<string, { bg: string; text: string; button: string }> = {
  roxo:      { bg: 'bg-primary',        text: 'text-primary-foreground',   button: 'bg-primary-foreground/20 hover:bg-primary-foreground/30' },
  rosa:      { bg: 'bg-rose-500',        text: 'text-white',                button: 'bg-white/20 hover:bg-white/30' },
  ambar:     { bg: 'bg-amber-500',       text: 'text-white',                button: 'bg-white/20 hover:bg-white/30' },
  esmeralda: { bg: 'bg-emerald-600',     text: 'text-white',                button: 'bg-white/20 hover:bg-white/30' },
};

export function PromotionalBanner({ onCategorySelect }: PromotionalBannerProps) {
  const [config, setConfig] = useState<BannerConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    supabase
      .from('configuracoes')
      .select('chave, valor')
      .in('chave', ['banner_ativo', 'banner_texto', 'banner_categoria', 'banner_cor'])
      .then(({ data }) => {
        if (!data) return;
        const get = (k: string) => data.find((r) => r.chave === k)?.valor ?? '';
        const ativo = get('banner_ativo') === 'true';
        const texto = get('banner_texto');
        if (!ativo || !texto) return;
        setConfig({
          ativo,
          texto,
          categoria: get('banner_categoria'),
          cor: get('banner_cor') || 'roxo',
        });
      });
  }, []);

  if (!config || dismissed) return null;

  const colors = COLOR_CLASSES[config.cor] ?? COLOR_CLASSES.roxo;

  const handleClick = () => {
    if (config.categoria) {
      onCategorySelect(config.categoria);
      document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={cn('w-full py-3 px-4 flex items-center justify-center gap-3 relative', colors.bg, colors.text)}>
      <button
        onClick={handleClick}
        className={cn(
          'flex-1 text-center text-sm font-medium',
          config.categoria ? 'cursor-pointer hover:underline' : 'cursor-default'
        )}
      >
        {config.texto}
      </button>
      <button
        onClick={() => setDismissed(true)}
        className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors',
          colors.button
        )}
        aria-label="Fechar banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
