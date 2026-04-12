"use client";

import { useEffect, useState } from "react";
import { getSalesHistory } from "@/lib/api";
import { SalesHistoryItem } from "@/types/inventory";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function SalesHistory() {
  const [sales, setSales] = useState<SalesHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function loadSalesHistory() {
      try {
        setLoading(true);
        setError("");
        const data = await getSalesHistory(limit, offset);
        setSales(data.sales);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sales history.");
      } finally {
        setLoading(false);
      }
    }

    void loadSalesHistory();
  }, [limit, offset]);

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <section className="panel sales-history-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Sales Records</p>
          <h2>Seller - All sales history</h2>
        </div>
        <div className="history-stats">
          <article>
            <span>Total Transactions</span>
            <strong>{total}</strong>
          </article>
          <article>
            <span>Page Total</span>
            <strong>Tk {totalSales.toFixed(2)}</strong>
          </article>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {loading ? (
        <p className="muted-text">Loading sales history...</p>
      ) : sales.length > 0 ? (
        <>
          <div className="table-wrap">
            <table className="sales-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Barcode</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{formatDate(sale.created_at)}</td>
                    <td>{sale.product_name || "Deleted Product"}</td>
                    <td>{sale.barcode || "N/A"}</td>
                    <td className="qty-cell">{sale.quantity}</td>
                    <td>Tk {sale.price_at_sale.toFixed(2)}</td>
                    <td className="total-cell">Tk {sale.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-controls">
            <button
              className="ghost-btn"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              type="button"
            >
              ← Previous
            </button>
            <span className="pagination-info">
              Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
            </span>
            <button
              className="ghost-btn"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              type="button"
            >
              Next →
            </button>
          </div>
        </>
      ) : (
        <p className="muted-text">No sales records yet.</p>
      )}
    </section>
  );
}
