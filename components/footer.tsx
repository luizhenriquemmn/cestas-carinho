import Link from 'next/link';
import { Instagram, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer id="contato" className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl font-bold text-primary">
                Cestas & Carinho
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
              <a
                href="https://wa.me/5511981214460"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="WhatsApp"
              >
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Links Rápidos</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/#produtos" className="text-muted-foreground hover:text-primary transition-colors">
                  Produtos
                </Link>
              </li>
              <li>
                <Link href="/#categorias" className="text-muted-foreground hover:text-primary transition-colors">
                  Categorias
                </Link>
              </li>
              <li>
                <Link href="/#sobre" className="text-muted-foreground hover:text-primary transition-colors">
                  Sobre Nós
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Categorias</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/#produtos" className="text-muted-foreground hover:text-primary transition-colors">
                  Café da Manhã
                </Link>
              </li>
              <li>
                <Link href="/#produtos" className="text-muted-foreground hover:text-primary transition-colors">
                  Aniversário
                </Link>
              </li>
              <li>
                <Link href="/#produtos" className="text-muted-foreground hover:text-primary transition-colors">
                  Romântico
                </Link>
              </li>
              <li>
                <Link href="/#produtos" className="text-muted-foreground hover:text-primary transition-colors">
                  Corporativo
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contato</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-muted-foreground">(11) 98121-4460</p>
                  <p className="text-xs text-muted-foreground/70">WhatsApp disponível</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">contato@cestasecarinho.com.br</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">São Paulo, SP - Entrega em toda região</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Cestas & Carinho. Todos os direitos reservados.
          </p>
          <p className="text-muted-foreground/70 text-xs">
            Feito com carinho para surpreender quem você ama
          </p>
        </div>
      </div>
    </footer>
  );
}
