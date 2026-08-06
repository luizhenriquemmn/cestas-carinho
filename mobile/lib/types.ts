export type OrderItem = {
  id: string; produto_id: string; quantidade: number; preco_unitario: number
  produto_snapshot?: { nome?: string; descricao?: string; foto_url?: string; categoria?: string; itens?: string[] }
  produtos?: { nome: string; descricao?: string; foto_url?: string; categoria?: string; itens?: string[] } | null
}
export type Order = {
  id: string; created_at: string; total: number; subtotal?: number; taxa_entrega: number; desconto_valor?: number
  status: string; tipo_entrega: 'entrega' | 'retirada'; endereco_entrega?: string | null; observacao?: string | null
  clientes?: { nome: string; telefone: string; email: string } | null; pedido_itens: OrderItem[]
}
export type Product = { id: string; nome: string; descricao: string; preco: number; categoria: string; foto_url: string; ativo: boolean; itens: string[] }
export type Account = { id: string; nome: string; tipo: string; saldo_atual: number }
export type Category = { id: string; nome: string; tipo: 'receita' | 'despesa' }
export type FinanceEntry = {
  id: string; tipo: 'receita' | 'despesa'; descricao: string; valor: number; status: 'pago' | 'pendente' | 'cancelado'
  data_competencia: string; financeiro_categorias?: { nome: string } | null; financeiro_contas?: { nome: string } | null
}
export type FinanceData = {
  accounts: Account[]; categories: Category[]; entries: FinanceEntry[]
  summary: { receitas: number; despesas: number; aReceber: number; aPagar: number; saldoContas: number }
}
