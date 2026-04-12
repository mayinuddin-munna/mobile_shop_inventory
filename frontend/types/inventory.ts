export type Product = {
  id: number;
  name: string;
  barcode: string;
  quantity: number;
  price: number | null;
  category: string;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductPayload = {
  name: string;
  barcode: string;
  quantity: number;
  price: number | "";
  category: string;
  lowStockThreshold: number;
};

export type SalePayload = {
  productId: number;
  quantity: number;
};

export type SalesReport = {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  yearTotal: number;
  todayUnits: number;
  weekUnits: number;
  monthUnits: number;
  yearUnits: number;
};

export type SalesHistoryItem = {
  id: number;
  product_id: number;
  product_name: string;
  barcode: string;
  quantity: number;
  price_at_sale: number;
  total: number;
  created_at: string;
};

export type SalesHistory = {
  sales: SalesHistoryItem[];
  total: number;
  limit: number;
  offset: number;
};
