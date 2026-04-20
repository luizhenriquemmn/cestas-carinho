export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'cafe-manha' | 'aniversario' | 'romantico' | 'corporativo';
  items: string[];
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  observation?: string;
}

export interface Customer {
  name: string;
  phone: string;
  email: string;
}

export interface Order {
  customer: Customer;
  items: CartItem[];
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  total: number;
}
