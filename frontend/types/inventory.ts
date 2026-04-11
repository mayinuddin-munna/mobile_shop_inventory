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
