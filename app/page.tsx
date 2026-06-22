'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { PromotionalBanner } from '@/components/promotional-banner';
import { ProductsSection } from '@/components/products-section';
import { AboutSection } from '@/components/about-section';
import { Footer } from '@/components/footer';
import { CartDrawer } from '@/components/cart-drawer';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <PromotionalBanner onCategorySelect={setSelectedCategory} />
      <main className="flex-1">
        <Hero />
        <ProductsSection
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
        <AboutSection />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
