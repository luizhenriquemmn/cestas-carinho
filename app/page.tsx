import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { ProductsSection } from '@/components/products-section';
import { AboutSection } from '@/components/about-section';
import { Footer } from '@/components/footer';
import { CartDrawer } from '@/components/cart-drawer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <ProductsSection />
        <AboutSection />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
