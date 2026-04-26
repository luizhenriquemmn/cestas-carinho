import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Tipos do banco de dados
export type Produto = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  foto_url: string;
  ativo: boolean;
  itens: string[];
};

export type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  email: string;
};

export type Pedido = {
  id: string;
  cliente_id: string;
  total: number;
  status: string;
  observacao: string;
  created_at: string;
};

export type PedidoItem = {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
};
