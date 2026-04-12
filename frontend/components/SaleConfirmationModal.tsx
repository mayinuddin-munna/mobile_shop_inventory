"use client";

import { useEffect, useRef, useState } from "react";
import { Product } from "@/types/inventory";

interface SaleConfirmationModalProps {
  isOpen: boolean;
  product: Product | null;
  initialQuantity: number;
  onQuantityChange: (qty: number) => void;
  onConfirm: (customerInfo: CustomerInfo) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  quantity: number;
}

export default function SaleConfirmationModal({
  isOpen,
  product,
  initialQuantity,
  onQuantityChange,
  onConfirm,
  onCancel,
  isProcessing
}: SaleConfirmationModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !product) {
    return null;
  }

  const total = (product.price ?? 0) * initialQuantity;
  const hasEnoughStock = initialQuantity > 0 && initialQuantity <= product.quantity;
  const isFormValid = customerName.trim().length > 0 && initialQuantity > 0;

  function handleSubmit() {
    if (!isFormValid || !hasEnoughStock) return;

    onConfirm({
      name: customerName.trim(),
      phone: customerPhone.trim(),
      email: customerEmail.trim(),
      address: customerAddress.trim(),
      quantity: initialQuantity
    });
  }

  return (
    <>
      <div className="modal-overlay" onClick={onCancel} />
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <h3>Complete Sale</h3>
          <button className="modal-close" onClick={onCancel} type="button">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-section">
            <h4 className="section-subtitle">Customer Information</h4>
            <div className="form-grid-2">
              <label className="field">
                <span>Full Name *</span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={isProcessing}
                  required
                />
              </label>

              <label className="field">
                <span>Phone Number</span>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  disabled={isProcessing}
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  disabled={isProcessing}
                />
              </label>

              <label className="field">
                <span>Address</span>
                <input
                  type="text"
                  placeholder="Street address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  disabled={isProcessing}
                />
              </label>
            </div>
          </div>

          <div className="divider" />

          <div className="form-section">
            <h4 className="section-subtitle">Sale Details</h4>
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
                <span className="label">Unit Price</span>
                <span className="value">Tk {(product.price ?? 0).toFixed(2)}</span>
              </div>
              <div className="invoice-row">
                <span className="label">Available Stock</span>
                <span className="value">{product.quantity}</span>
              </div>
              <div className="invoice-divider" />
              <div className="invoice-row quantity-input-row">
                <label htmlFor="sale-qty" className="label">
                  Quantity to sell *
                </label>
                <input
                  id="sale-qty"
                  type="number"
                  min="1"
                  max={product.quantity}
                  value={initialQuantity}
                  onChange={(e) => onQuantityChange(Math.max(0, Number(e.target.value) || 0))}
                  disabled={isProcessing}
                />
              </div>
              <div className="invoice-divider" />
              <div className="invoice-row total-row">
                <span className="label">Total Amount</span>
                <span className="value total-amount">Tk {total.toFixed(2)}</span>
              </div>

              {!hasEnoughStock && initialQuantity > 0 && (
                <p className="error-text">❌ Insufficient stock available</p>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="ghost-btn" onClick={onCancel} disabled={isProcessing} type="button">
            Cancel
          </button>
          <button
            className="primary-btn"
            onClick={handleSubmit}
            disabled={isProcessing || !isFormValid || !hasEnoughStock}
            type="button"
          >
            {isProcessing ? "Processing..." : "✓ Confirm Sale"}
          </button>
        </div>
      </div>
    </>
  );
}
