'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag, User, LogOut, ClipboardList, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart-context';
import { cn } from '@/lib/utils';
import type { ClienteSession } from '@/lib/session';

const navLinks = [
  { href: '/', label: 'Início' },
  { href: '/#produtos', label: 'Produtos' },
  { href: '/#categorias', label: 'Categorias' },
  { href: '/#sobre', label: 'Sobre' },
  { href: '/#contato', label: 'Contato' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cliente, setCliente] = useState<ClienteSession | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setCliente(data));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCliente(null);
    setIsAccountOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl md:text-2xl font-bold text-primary">
              Cestas & Carinho
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground/80 hover:text-primary transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right buttons */}
          <div className="flex items-center gap-2">
            {/* Customer account */}
            {cliente ? (
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAccountOpen((v) => !v)}
                  aria-label="Minha conta"
                >
                  <User className="h-5 w-5" />
                </Button>
                {isAccountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-card rounded-xl border border-border shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-xs text-muted-foreground truncate">{cliente.nome}</p>
                    </div>
                    <Link
                      href="/conta/pedidos"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      <ClipboardList className="w-4 h-4 text-muted-foreground" />
                      Meus Pedidos
                    </Link>
                    <Link
                      href="/conta/perfil"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                      onClick={() => setIsAccountOpen(false)}
                    >
                      <UserCircle className="w-4 h-4 text-muted-foreground" />
                      Meu Perfil
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-secondary transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/conta/login">
                <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  Entrar
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={() => setIsCartOpen(true)}
              aria-label="Abrir carrinho"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300',
            isMobileMenuOpen ? 'max-h-80 pb-4' : 'max-h-0'
          )}
        >
          <div className="flex flex-col gap-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground/80 hover:text-primary hover:bg-secondary transition-colors py-2 px-4 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {cliente ? (
              <>
                <Link
                  href="/conta/pedidos"
                  className="flex items-center gap-2 text-foreground/80 hover:text-primary hover:bg-secondary transition-colors py-2 px-4 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ClipboardList className="w-4 h-4" />
                  Meus Pedidos
                </Link>
                <Link
                  href="/conta/perfil"
                  className="flex items-center gap-2 text-foreground/80 hover:text-primary hover:bg-secondary transition-colors py-2 px-4 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <UserCircle className="w-4 h-4" />
                  Meu Perfil
                </Link>
                <button
                  className="flex items-center gap-2 text-destructive hover:bg-secondary transition-colors py-2 px-4 rounded-lg text-left"
                  onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </>
            ) : (
              <Link
                href="/conta/login"
                className="flex items-center gap-2 text-foreground/80 hover:text-primary hover:bg-secondary transition-colors py-2 px-4 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="w-4 h-4" />
                Entrar / Criar conta
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
