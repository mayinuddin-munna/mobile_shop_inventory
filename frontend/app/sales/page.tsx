"use client";

import Link from "next/link";
import { useState } from "react";
import SalesHistory from "@/components/SalesHistory";

export default function SalesPage() {
  return (
    <main className="page-shell sales-page">
      <section className="page-header">
        <div className="header-content">
          <Link href="/" className="back-link">
            ← Back to Inventory
          </Link>
          <h1>📊 Sales History</h1>
          <p className="page-description">Complete record of all sales transactions</p>
        </div>
      </section>

      <SalesHistory />
    </main>
  );
}
