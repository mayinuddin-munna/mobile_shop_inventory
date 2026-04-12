"use client";

import { useEffect, useRef } from "react";
import { Product } from "@/types/inventory";

interface SaleConfirmationModalProps {
  isOpen: boolean;
  product: Product | null;
  initialQuantity: number;
  onQuantityChange: (qty: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
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

  return (
    <>
      <div className="modal-overlay" onClick={onCancel} />
      <div className="modal-content">
        <div className="modal-header">
          <h3>Confirm Sale</h3>
          <button className="modal-close" onClick={onCancel} type="button">
            ✕
          </button>
        </div>

        <div className="modal-body">
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
                Quantity to sell
              </label>
              <input
                ref={inputRef}
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
              <span className="label">Total</span>
              <span className="value total-amount">Tk {total.toFixed(2)}</span>
            </div>

            {!hasEnoughStock && initialQuantity > 0 && (
              <p className="error-text">Insufficient stock available</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="ghost-btn" onClick={onCancel} disabled={isProcessing} type="button">
            Cancel
          </button>
          <button
            className="primary-btn"
            onClick={onConfirm}
            disabled={isProcessing || !hasEnoughStock}
            type="button"
          >
            {isProcessing ? "Processing..." : "Confirm Sale"}
          </button>
        </div>
      </div>
    </>
  );
}
