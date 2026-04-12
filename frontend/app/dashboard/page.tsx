"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProducts, getSalesReport } from "@/lib/api";
import { Product, SalesReport } from "@/types/inventory";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [productData, reportData] = await Promise.all([getProducts({}), getSalesReport()]);
        setProducts(productData);
        setSalesReport(reportData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const totalProducts = products.length;
  const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);
  const lowStockProducts = products.filter(
    (product) => product.quantity <= product.lowStockThreshold
  );
  const lowStockCount = lowStockProducts.length;
  const inventoryValue = products.reduce(
    (sum, product) => sum + (product.price ?? 0) * product.quantity,
    0
  );

  const categoryCounts = products.reduce<Record<string, number>>((acc, product) => {
    const category = product.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const recentUpdates = [...products]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const featuredLowStock = lowStockProducts
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Inventory Health at a glance</h2>
          <p className="hero-copy">
            Monitor stock levels, category trends, and recent product activity from one place.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" href="/">
              Open Inventory
            </Link>
          </div>
        </div>
        <div className="hero-stats">
          <article>
            <span>Total Products</span>
            <strong>{totalProducts}</strong>
          </article>
          <article>
            <span>Low Stock</span>
            <strong>{lowStockCount}</strong>
          </article>
          <article>
            <span>Total Quantity</span>
            <strong>{totalQuantity}</strong>
          </article>
          <article>
            <span>Inventory Value</span>
            <strong>Tk {inventoryValue.toFixed(2)}</strong>
          </article>
        </div>
      </section>

      <section className="panel dashboard-grid">
        <div className="dashboard-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Sales Summary</p>
              <h2>Today / Weekly / Monthly / Yearly</h2>
            </div>
          </div>
          {loading ? (
            <p className="muted-text">Loading sales summary…</p>
          ) : salesReport ? (
            <div className="sales-summary-grid">
              <article>
                <span>Today</span>
                <strong>Tk {salesReport.todayTotal.toFixed(2)}</strong>
                <small>{salesReport.todayUnits} sold</small>
              </article>
              <article>
                <span>Last 7 days</span>
                <strong>Tk {salesReport.weekTotal.toFixed(2)}</strong>
                <small>{salesReport.weekUnits} sold</small>
              </article>
              <article>
                <span>This month</span>
                <strong>Tk {salesReport.monthTotal.toFixed(2)}</strong>
                <small>{salesReport.monthUnits} sold</small>
              </article>
              <article>
                <span>This year</span>
                <strong>Tk {salesReport.yearTotal.toFixed(2)}</strong>
                <small>{salesReport.yearUnits} sold</small>
              </article>
            </div>
          ) : (
            <p className="muted-text">Sales report is not available yet.</p>
          )}
        </div>

        <div className="dashboard-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Category Breakdown</p>
              <h2>Products by category</h2>
            </div>
          </div>
          {products.length ? (
            <ul className="metric-list">
              {Object.entries(categoryCounts).map(([category, count]) => (
                <li key={category}>
                  <strong>{count}</strong>
                  <span>{category}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted-text">No category data available yet.</p>
          )}
        </div>

        <div className="dashboard-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Low Stock Alerts</p>
              <h2>Critical product list</h2>
            </div>
          </div>
          {loading ? (
            <p className="muted-text">Loading products…</p>
          ) : featuredLowStock.length ? (
            <ul className="metric-list">
              {featuredLowStock.map((product) => (
                <li key={product.id}>
                  <strong>{product.name}</strong>
                  <span>
                    {product.quantity} left · threshold {product.lowStockThreshold}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted-text">All stock levels are normal.</p>
          )}
        </div>
      </section>

      <section className="panel dashboard-grid">
        <div className="dashboard-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h2>Recently updated products</h2>
            </div>
          </div>
          {recentUpdates.length ? (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentUpdates.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.quantity}</td>
                    <td>{formatDate(product.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted-text">No recent updates yet.</p>
          )}
        </div>

        <div className="dashboard-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Summary</p>
              <h2>Inventory details</h2>
            </div>
          </div>
          <div className="metric-list">
            <li>
              <strong>{lowStockProducts.length}</strong>
              <span>Products below threshold</span>
            </li>
            <li>
              <strong>{products.filter((product) => product.price !== null).length}</strong>
              <span>Priced products</span>
            </li>
            <li>
              <strong>{products.filter((product) => !product.category).length}</strong>
              <span>Uncategorized items</span>
            </li>
          </div>
        </div>
      </section>

      {error ? <p className="error-text">{error}</p> : null}
    </main>
  );
}
