import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";

sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "data.sqlite");

export const db = new sqlite3.Database(dbPath);

export function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        barcode TEXT UNIQUE,
        quantity INTEGER NOT NULL DEFAULT 0,
        price REAL,
        category TEXT,
        low_stock_threshold INTEGER NOT NULL DEFAULT 3,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_products_name
      ON products(name)
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_products_quantity
      ON products(quantity)
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price_at_sale REAL,
        total REAL NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        customer_email TEXT,
        customer_address TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id)
      )
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_sales_created_at
      ON sales(created_at)
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_sales_product_id
      ON sales(product_id)
    `);

    // Add missing columns to existing sales table
    db.all("PRAGMA table_info(sales)", (err, columns) => {
      if (err) {
        console.error("Error checking sales table:", err);
        return;
      }

      const columnNames = columns.map((col) => col.name);
      const missingColumns = [
        { name: "customer_name", type: "TEXT" },
        { name: "customer_phone", type: "TEXT" },
        { name: "customer_email", type: "TEXT" },
        { name: "customer_address", type: "TEXT" }
      ];

      missingColumns.forEach((col) => {
        if (!columnNames.includes(col.name)) {
          db.run(`ALTER TABLE sales ADD COLUMN ${col.name} ${col.type}`, (alterErr) => {
            if (alterErr) {
              console.error(`Error adding column ${col.name}:`, alterErr);
            } else {
              console.log(`Added column ${col.name} to sales table`);
            }
          });
        }
      });
    });
  });
}

export function run(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        id: this.lastID,
        changes: this.changes
      });
    });
  });
}

export function get(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

export function all(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}
