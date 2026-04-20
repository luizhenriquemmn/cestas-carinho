import { Product } from './types';

export const products: Product[] = [
  {
    id: '1',
    name: 'Cesta Café da Manhã Clássica',
    description: 'Uma seleção encantadora de itens para um café da manhã especial. Perfeita para surpreender quem você ama.',
    price: 149.90,
    image: '/images/cesta-cafe-classica.jpg',
    category: 'cafe-manha',
    items: ['Pão artesanal', 'Croissant', 'Geleia caseira', 'Manteiga', 'Queijo', 'Presunto', 'Frutas frescas', 'Suco natural', 'Café especial'],
    featured: true,
  },
  {
    id: '2',
    name: 'Cesta Café Premium',
    description: 'Nossa cesta mais completa, com itens selecionados para uma experiência gastronômica inesquecível.',
    price: 249.90,
    image: '/images/cesta-cafe-premium.jpg',
    category: 'cafe-manha',
    items: ['Pães artesanais variados', 'Croissant', 'Bolo caseiro', 'Geleias importadas', 'Queijos especiais', 'Frutas selecionadas', 'Espumante', 'Café gourmet', 'Chocolates finos'],
    featured: true,
  },
  {
    id: '3',
    name: 'Cesta Aniversário Feliz',
    description: 'Celebre a data especial com uma cesta repleta de guloseimas e carinho.',
    price: 189.90,
    image: '/images/cesta-aniversario.jpg',
    category: 'aniversario',
    items: ['Bolo decorado', 'Doces finos', 'Chocolates', 'Vinho tinto', 'Balões', 'Vela de aniversário', 'Cartão personalizado'],
    featured: true,
  },
  {
    id: '4',
    name: 'Cesta Romântica',
    description: 'Perfeita para ocasiões românticas. Surpreenda seu amor com essa seleção especial.',
    price: 219.90,
    image: '/images/cesta-romantica.jpg',
    category: 'romantico',
    items: ['Champagne', 'Morangos', 'Chocolates belgas', 'Velas aromáticas', 'Pétalas de rosas', 'Queijos finos', 'Biscoitos importados'],
    featured: true,
  },
  {
    id: '5',
    name: 'Cesta Café Simples',
    description: 'Uma opção charmosa e acessível para surpreender com carinho.',
    price: 89.90,
    image: '/images/cesta-cafe-simples.jpg',
    category: 'cafe-manha',
    items: ['Pão francês', 'Bolo simples', 'Geleia', 'Manteiga', 'Queijo', 'Presunto', 'Suco', 'Café'],
  },
  {
    id: '6',
    name: 'Cesta Corporativa',
    description: 'Ideal para presentear colaboradores e parceiros de negócios.',
    price: 179.90,
    image: '/images/cesta-corporativa.jpg',
    category: 'corporativo',
    items: ['Vinhos selecionados', 'Queijos especiais', 'Biscoitos finos', 'Chocolates', 'Castanhas', 'Panetone', 'Cartão corporativo'],
  },
  {
    id: '7',
    name: 'Cesta Dia das Mães',
    description: 'Demonstre todo seu amor com uma cesta preparada especialmente para ela.',
    price: 199.90,
    image: '/images/cesta-dia-maes.jpg',
    category: 'aniversario',
    items: ['Flores naturais', 'Chocolates', 'Espumante', 'Produtos de beleza', 'Biscoitos', 'Cartão especial'],
  },
  {
    id: '8',
    name: 'Cesta Churrasco',
    description: 'Tudo que você precisa para um churrasco perfeito com os amigos.',
    price: 289.90,
    image: '/images/cesta-churrasco.jpg',
    category: 'corporativo',
    items: ['Carnes nobres', 'Linguiças', 'Queijo coalho', 'Cerveja artesanal', 'Carvão', 'Temperos', 'Pão de alho'],
  },
];

export const categories = [
  { id: 'cafe-manha', name: 'Café da Manhã', icon: 'Coffee' },
  { id: 'aniversario', name: 'Aniversário', icon: 'Cake' },
  { id: 'romantico', name: 'Romântico', icon: 'Heart' },
  { id: 'corporativo', name: 'Corporativo', icon: 'Briefcase' },
];

export function getProductsByCategory(category: string): Product[] {
  return products.filter(p => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.filter(p => p.featured);
}

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}
