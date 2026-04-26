'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Instagram, Phone, Mail, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ConfigRow = { chave: string; valor: string };
type Categoria = { id: string; nome: string };

type Config = {
  nome_loja: string;
  whatsapp: string;
  email: string;
  endereco: string;
};

const DEFAULT_CONFIG: Config = {
  nome_loja: 'Cestas & Carinho',
  whatsapp: '',
  email: '',
  endereco: '',
};

function rowsToConfig(rows: ConfigRow[]): Config {
  const get = (chave: string) => rows.find((r) => r.chave === chave)?.valor ?? '';
  return {
    nome_loja: get('nome_loja') || DEFAULT_CONFIG.nome_loja,
    whatsapp:  get('whatsapp'),
    email:     get('email'),
    endereco:  get('endereco'),
  };
}

export function Footer() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from('configuracoes').select('chave, valor'),
      supabase.from('categorias').select('id, nome').eq('ativo', true).order('nome'),
    ]).then(([{ data: configData }, { data: catData }]) => {
      if (configData) setConfig(rowsToConfig(configData as ConfigRow[]));
      if (catData) setCategorias(catData as Categoria[]);
    });
  }, []);

  return (
    <footer id="contato" className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl font-bold text-primary">
                {config.nome_loja}
              </span>
            </Link>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Surpreenda quem você ama com nossas cestas especiais,
              preparadas com carinho e ingredientes de qualidade.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://instagram.com/cestasecarinho"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              {config.whatsapp && (
                <a
                  href={`https://wa.me/${config.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="WhatsApp"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Links rápidos */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Links Rápidos</h4>
            <ul className="space-y-3">
              {[
                { label: 'Início',      href: '/' },
                { label: 'Produtos',    href: '/#produtos' },
                { label: 'Categorias',  href: '/#categorias' },
                { label: 'Sobre Nós',   href: '/#sobre' },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-muted-foreground hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categorias dinâmicas */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Categorias</h4>
            {categorias.length > 0 ? (
              <ul className="space-y-3">
                {categorias.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href="/#produtos"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {cat.nome}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <li key={i} className="h-4 w-24 bg-muted rounded animate-pulse" />
                ))}
              </ul>
            )}
          </div>

          {/* Contato dinâmico */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contato</h4>
            <ul className="space-y-4">
              {config.whatsapp && (
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <a
                      href={`https://wa.me/${config.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {config.whatsapp}
                    </a>
                    <p className="text-xs text-muted-foreground/70">WhatsApp disponível</p>
                  </div>
                </li>
              )}
              {config.email && (
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <a
                    href={`mailto:${config.email}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {config.email}
                  </a>
                </li>
              )}
              {config.endereco && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{config.endereco}</span>
                </li>
              )}
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} {config.nome_loja}. Todos os direitos reservados.
          </p>
          <p className="text-muted-foreground/70 text-xs">
            Feito com carinho para surpreender quem você ama
          </p>
        </div>
      </div>
    </footer>
  );
}
