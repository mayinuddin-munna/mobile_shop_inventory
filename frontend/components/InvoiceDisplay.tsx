"use client";

import { useRef } from "react";
import { Product } from "@/types/inventory";

interface InvoiceDisplayProps {
  product: Product | null;
  quantity: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
}

export default function InvoiceDisplay({
  product,
  quantity,
  customerName = "Walk-in Customer",
  customerPhone = "",
  customerEmail = "",
  customerAddress = ""
}: InvoiceDisplayProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!product) return null;

  const unitPrice = product.price ?? 0;
  const total = unitPrice * quantity;
  const invoiceDate = new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date());
  const invoiceId = `#${product.id}-${Date.now().toString().slice(-6)}`;

  function handlePrint() {
    if (invoiceRef.current) {
      const printWindow = window.open("", "", "width=800,height=600");
      if (printWindow) {
        printWindow.document.write(
          `<html><head><style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
            .invoice-print { max-width: 210mm; height: 297mm; margin: 0 auto; padding: 20mm; background: white; }
            @media print {
              .invoice-print { page-break-after: always; }
              body { margin: 0; padding: 0; }
            }
          </style></head><body>` +
            invoiceRef.current.innerHTML +
            `</body></html>`
        );
        printWindow.document.close();
        printWindow.print();
      }
    }
  }

  function handleExportCSV() {
    if (!product) return;

    const csv = `TELECOM INVENTORY SALES INVOICE
========================================
Invoice ID: ${invoiceId}
Date: ${invoiceDate}

CUSTOMER INFORMATION
${customerName ? `Name: ${customerName}\n` : ""}${customerPhone ? `Phone: ${customerPhone}\n` : ""}${customerEmail ? `Email: ${customerEmail}\n` : ""}${customerAddress ? `Address: ${customerAddress}\n` : ""}
PRODUCT DETAILS
Product: ${product.name}
Barcode: ${product.barcode || "N/A"}
Category: ${product.category || "N/A"}
Quantity: ${quantity}
Unit Price: Tk ${unitPrice.toFixed(2)}

========================================
TOTAL AMOUNT: Tk ${total.toFixed(2)}
========================================
Thank you for your purchase!`;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    element.setAttribute("download", `invoice-${invoiceId.slice(1)}.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  return (
    <div className="sales-invoice-wrapper">
      <div className="invoice-card">
        <div className="invoice-header">
          <h3 className="invoice-title">📄 Sales Invoice</h3>
          <div className="invoice-actions">
            <button className="ghost-btn" onClick={handlePrint} type="button" title="Print A4 Invoice">
              🖨️ Print
            </button>
            <button className="ghost-btn" onClick={handleExportCSV} type="button" title="Download as CSV">
              ⬇️ CSV
            </button>
          </div>
        </div>

        <div ref={invoiceRef} className="invoice-print-area">
          <div className="invoice-print">
            <div className="store-header">
              <h2>TELECOM STORE</h2>
              <p>Sales Invoice</p>
            </div>

            <div className="invoice-meta-grid">
              <div className="meta-item">
                <label>Invoice ID</label>
                <strong>{invoiceId}</strong>
              </div>
              <div className="meta-item">
                <label>Date & Time</label>
                <strong>{invoiceDate}</strong>
              </div>
            </div>

            {customerName && (
              <div className="customer-section">
                <h4>Customer Information</h4>
                <div className="customer-details">
                  <p>
                    <strong>Name:</strong> {customerName}
                  </p>
                  {customerPhone && (
                    <p>
                      <strong>Phone:</strong> {customerPhone}
                    </p>
                  )}
                  {customerEmail && (
                    <p>
                      <strong>Email:</strong> {customerEmail}
                    </p>
                  )}
                  {customerAddress && (
                    <p>
                      <strong>Address:</strong> {customerAddress}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="invoice-items">
              <h4>Item Details</h4>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="product-cell">
                      <strong>{product.name}</strong>
                      <small>{product.barcode || "N/A"}</small>
                    </td>
                    <td className="qty-cell">{quantity}</td>
                    <td className="price-cell">Tk {unitPrice.toFixed(2)}</td>
                    <td className="total-cell">Tk {total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="invoice-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>Tk {total.toFixed(2)}</span>
              </div>
              <div className="summary-row total-row">
                <span>Total Amount</span>
                <span>Tk {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="invoice-footer">
              <p>Thank you for your purchase!</p>
              <p className="footer-note">This is an auto-generated invoice from Telecom Inventory System</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
