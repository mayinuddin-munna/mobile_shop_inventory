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
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
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
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  created_at: string;
};

export type SalesHistory = {
  sales: SalesHistoryItem[];
  total: number;
  limit: number;
  offset: number;
};
