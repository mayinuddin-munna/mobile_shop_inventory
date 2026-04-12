import { Product, ProductPayload, SalePayload, SalesReport, SalesHistory } from "@/types/inventory";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

type ProductQueryOptions = {
  query?: string;
  sort?: string;
  lowStockOnly?: boolean;
  threshold?: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getProducts(options: ProductQueryOptions) {
  const params = new URLSearchParams();

  if (options.query) {
    params.set("query", options.query);
  }

  if (options.sort) {
    params.set("sort", options.sort);
  }

  if (options.lowStockOnly) {
    params.set("lowStockOnly", "true");
  }

  if (options.threshold !== undefined) {
    params.set("threshold", String(options.threshold));
  }

  return request<Product[]>(`/products?${params.toString()}`);
}

export function createProduct(payload: ProductPayload) {
  return request<Product>("/products", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateProduct(id: number, payload: ProductPayload) {
  return request<Product>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function adjustStock(id: number, delta: number) {
  return request<Product>(`/products/${id}/adjust`, {
    method: "POST",
    body: JSON.stringify({ delta })
  });
}

export function recordSale(payload: SalePayload) {
  return request<void>("/sales", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getSalesReport() {
  return request<SalesReport>("/sales/report");
}

export function getSalesHistory(limit: number = 50, offset: number = 0) {
  return request<SalesHistory>(`/sales/history?limit=${limit}&offset=${offset}`);
}

export function deleteProduct(id: number) {
  return request<void>(`/products/${id}`, {
    method: "DELETE"
  });
}
