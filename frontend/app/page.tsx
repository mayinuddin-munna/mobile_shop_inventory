"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { adjustStock, createProduct, deleteProduct, getProducts, recordSale, updateProduct } from "@/lib/api";
import { Product, ProductPayload } from "@/types/inventory";
import SaleConfirmationModal from "@/components/SaleConfirmationModal";
import InvoiceDisplay from "@/components/InvoiceDisplay";
import SalesHistory from "@/components/SalesHistory";

const defaultForm: ProductPayload = {
  name: "",
  barcode: "",
  quantity: 0,
  price: "",
  category: "",
  lowStockThreshold: 3
};

const categories = ["Mobile", "SIM", "Accessory", "Charger", "Cable", "Other"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name_asc");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [threshold, setThreshold] = useState(3);
  const [form, setForm] = useState<ProductPayload>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [saleProduct, setSaleProduct] = useState<Product | null>(null);
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [lastSale, setLastSale] = useState<{ product: Product; quantity: number } | null>(null);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");
      const data = await getProducts({
        query: search.trim(),
        sort,
        lowStockOnly,
        threshold
      });
      setProducts(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, [sort, lowStockOnly, threshold]);

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadProducts();
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await updateProduct(editingId, form);
      } else {
        await createProduct(form);
      }

      setForm(defaultForm);
      setEditingId(null);
      await loadProducts();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdjust(id: number, delta: number) {
    try {
      setError("");
      await adjustStock(id, delta);
      await loadProducts();
    } catch (adjustError) {
      setError(adjustError instanceof Error ? adjustError.message : "Stock update failed.");
    }
  }

  async function handleSale(id: number, quantity: number) {
    try {
      setError("");
      await recordSale({ productId: id, quantity });
      await loadProducts();
    } catch (saleError) {
      setError(saleError instanceof Error ? saleError.message : "Sale recording failed.");
    }
  }

  function openSaleModal(product: Product) {
    setSaleProduct(product);
    setSaleQuantity(1);
    setSaleModalOpen(true);
  }

  function closeSaleModal() {
    setSaleModalOpen(false);
    setSaleProduct(null);
    setSaleQuantity(1);
  }

  async function confirmSale() {
    if (!saleProduct || saleQuantity <= 0 || saleQuantity > saleProduct.quantity) {
      return;
    }

    try {
      setIsProcessingSale(true);
      setError("");
      await recordSale({ productId: saleProduct.id, quantity: saleQuantity });
      setLastSale({ product: saleProduct, quantity: saleQuantity });
      closeSaleModal();
      await loadProducts();
    } catch (saleError) {
      setError(saleError instanceof Error ? saleError.message : "Failed to process sale.");
    } finally {
      setIsProcessingSale(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await deleteProduct(id);
      await loadProducts();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    }
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      barcode: product.barcode,
      quantity: product.quantity,
      price: product.price ?? "",
      category: product.category,
      lowStockThreshold: product.lowStockThreshold
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(defaultForm);
  }

  let featuredProduct: Product | null = null;
  if (products.length > 0) {
    if (!search.trim()) {
      featuredProduct = products[0];
    } else {
      featuredProduct =
        products.find((product) => product.barcode === search.trim()) ||
        products.find((product) =>
          product.name.toLowerCase().includes(search.trim().toLowerCase())
        ) ||
        products[0];
    }
  }

  const lowStockCount = products.filter(
    (product) => product.quantity <= product.lowStockThreshold
  ).length;

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Telecom Store Inventory</p>
          <h2>Track stock fast from desktop, tablet, or mobile.</h2>
          <p className="hero-copy">
            Search by product name or barcode, update quantity with one tap, and keep
            low-stock items visible before they run out.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" href="/dashboard">
              View dashboard
            </Link>
          </div>
        </div>
        <div className="hero-stats">
          <article>
            <span>Total Products</span>
            <strong>{products.length}</strong>
          </article>
          <article>
            <span>Low Stock</span>
            <strong>{lowStockCount}</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <form className="search-row" onSubmit={handleSearchSubmit}>
          <label className="field grow">
            <span>Search by name or barcode</span>
            <input
              placeholder="Type or scan barcode here"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="field compact">
            <span>Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="quantity_asc">Low stock first</option>
              <option value="quantity_desc">High stock first</option>
              <option value="updated_desc">Recently updated</option>
            </select>
          </label>

          <button className="primary-btn" type="submit">
            Search
          </button>
        </form>

        <div className="toolbar">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(event) => setLowStockOnly(event.target.checked)}
            />
            <span>Show low stock only</span>
          </label>

          <label className="field compact">
            <span>Low stock threshold</span>
            <input
              type="number"
              min="0"
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value) || 0)}
            />
          </label>
        </div>

        {featuredProduct ? (
          <article
            className={`featured-card ${
              featuredProduct.quantity <= featuredProduct.lowStockThreshold ? "alert" : ""
            }`}
          >
            <div>
              <p className="eyebrow">Stock Check</p>
              <h2>{featuredProduct.name}</h2>
              <p>Barcode: {featuredProduct.barcode || "Not set"}</p>
              <p>Category: {featuredProduct.category || "Uncategorized"}</p>
              <p>Last updated: {formatDate(featuredProduct.updatedAt)}</p>
            </div>
            <div className="stock-box">
              <span>Available Quantity</span>
              <strong>{featuredProduct.quantity}</strong>
              <div className="quick-actions">
                <button type="button" onClick={() => openSaleModal(featuredProduct)}>
                  Sell
                </button>
                <button type="button" onClick={() => handleAdjust(featuredProduct.id, 1)}>
                  +1
                </button>
                <button type="button" onClick={() => handleAdjust(featuredProduct.id, 5)}>
                  +5
                </button>
              </div>
            </div>
          </article>
        ) : (
          <article className="empty-state">
            <h2>No product found</h2>
            <p>Try another name or barcode, or add your first product below.</p>
          </article>
        )}

        {error ? <p className="error-text">{error}</p> : null}
      </section>

      <section className="content-grid">
        <form className="panel product-form" onSubmit={handleSaveProduct}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{editingId ? "Edit Product" : "New Product"}</p>
              <h2>{editingId ? "Update inventory item" : "Add item to inventory"}</h2>
            </div>
            {editingId ? (
              <button className="ghost-btn" type="button" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Product Name</span>
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Barcode</span>
              <input
                value={form.barcode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, barcode: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Quantity</span>
              <input
                required
                type="number"
                min="0"
                value={form.quantity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    quantity: Number(event.target.value)
                  }))
                }
              />
            </label>

            <label className="field">
              <span>Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    price: event.target.value === "" ? "" : Number(event.target.value)
                  }))
                }
              />
            </label>

            <label className="field">
              <span>Category</span>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Low stock threshold</span>
              <input
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lowStockThreshold: Number(event.target.value)
                  }))
                }
              />
            </label>
          </div>

          <button className="primary-btn full-width" type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update Product" : "Add Product"}
          </button>
        </form>

        <section className="panel inventory-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Inventory List</p>
              <h2>All products</h2>
            </div>
            <button className="ghost-btn" type="button" onClick={() => void loadProducts()}>
              Refresh
            </button>
          </div>

          {loading ? <p className="muted-text">Loading inventory...</p> : null}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Barcode</th>
                  <th>Qty</th>
                  <th>Category</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isLow = product.quantity <= product.lowStockThreshold;

                  return (
                    <tr key={product.id} className={isLow ? "low-stock-row" : ""}>
                      <td>
                        <strong>{product.name}</strong>
                        {product.price !== null ? <span>Tk {product.price}</span> : null}
                      </td>
                      <td>{product.barcode || "N/A"}</td>
                      <td>{product.quantity}</td>
                      <td>{product.category || "N/A"}</td>
                      <td>{formatDate(product.updatedAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button" onClick={() => openSaleModal(product)}>
                            Sell
                          </button>
                          <button type="button" onClick={() => handleAdjust(product.id, 1)}>
                            +1
                          </button>
                          <button type="button" onClick={() => startEdit(product)}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(product.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      {lastSale ? <InvoiceDisplay product={lastSale.product} quantity={lastSale.quantity} /> : null}

      <SalesHistory />

      <SaleConfirmationModal
        isOpen={saleModalOpen}
        product={saleProduct}
        initialQuantity={saleQuantity}
        onQuantityChange={setSaleQuantity}
        onConfirm={confirmSale}
        onCancel={closeSaleModal}
        isProcessing={isProcessingSale}
      />
    </main>
  );
}
