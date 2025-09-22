export interface Product {
  codigo_interno: string;
  descricao: string;
  codigo_barras: string;
}

export interface Lista {
  id: string;
  nome_lista: string;
  produtos: Product[];
  respostas: Record<string, Record<string, string>>;
  status: 'aberta' | 'finalizada';
  created_at: string;
  updated_at: string;
}

export interface LinkCotacao {
  id: string;
  lista_id: string;
  empresa: string;
  link: string;
  status: 'pendente' | 'respondido';
  created_at: string;
  updated_at: string;
}

export interface CellData {
  value: string;
  readOnly?: boolean;
  isLowestPrice?: boolean;
}