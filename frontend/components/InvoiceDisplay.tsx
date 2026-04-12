"use client";

import { useRef } from "react";
import { Product } from "@/types/inventory";

interface InvoiceDisplayProps {
  product: Product | null;
  quantity: number;
}

export default function InvoiceDisplay({ product, quantity }: InvoiceDisplayProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!product) return null;

  const unitPrice = product.price ?? 0;
  const total = unitPrice * quantity;
  const invoiceDate = new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date());

  function handlePrint() {
    if (invoiceRef.current) {
      const printWindow = window.open("", "", "width=800,height=600");
      if (printWindow) {
        printWindow.document.write(invoiceRef.current.innerHTML);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }

  function handleExportCSV() {
    if (!product) return;

    const csv = `Product Invoice Report\n\nDate: ${invoiceDate}\nInvoice ID: #${product.id}-${Date.now().toString().slice(-6)}\n\nProduct,${product.name}\nBarcode,${product.barcode || "N/A"}\nCategory,${product.category || "N/A"}\nQuantity,${quantity}\nUnit Price,Tk ${unitPrice.toFixed(2)}\nTotal Amount,Tk ${total.toFixed(2)}\n`;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    element.setAttribute("download", `invoice-${product.id}-${Date.now()}.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  return (
    <div className="invoice-card">
      <div className="invoice-header">
        <h3 className="invoice-title">Sales Invoice</h3>
        <div className="invoice-actions">
          <button className="ghost-btn" onClick={handlePrint} type="button">
            🖨️ Print
          </button>
          <button className="ghost-btn" onClick={handleExportCSV} type="button">
            ⬇️ Export
          </button>
        </div>
      </div>

      <div ref={invoiceRef} className="invoice-content">
        <div className="invoice-meta">
          <p>
            <strong>Date:</strong> {invoiceDate}
          </p>
          <p>
            <strong>Invoice ID:</strong> #{product.id}-{Date.now().toString().slice(-6)}
          </p>
        </div>

        <div className="invoice-section">
          <div className="invoice-row">
            <span className="label">Product</span>
            <span className="value">{product.name}</span>
          </div>
          <div className="invoice-row">
            <span className="label">Barcode</span>
            <span className="value">{product.barcode || "N/A"}</span>
          </div>
          <div className="invoice-row">
            <span className="label">Category</span>
            <span className="value">{product.category || "N/A"}</span>
          </div>
          <div className="invoice-row">
            <span className="label">Quantity</span>
            <span className="value">{quantity}</span>
          </div>
          <div className="invoice-row">
            <span className="label">Unit Price</span>
            <span className="value">Tk {unitPrice.toFixed(2)}</span>
          </div>
          <div className="invoice-divider" />
          <div className="invoice-row total-row">
            <span className="label">Total Amount</span>
            <span className="value total-amount">Tk {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
