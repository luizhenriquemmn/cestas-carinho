import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à loja
          </Link>
          <Link href="/" className="font-serif text-xl font-bold text-primary">
            Cestas & Carinho
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-10 max-w-md">
        {children}
      </main>
    </div>
  );
}
