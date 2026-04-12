import cors from "cors";
import express from "express";
import { all, get, initializeDatabase, run } from "./db.js";

const app = express();
const PORT = process.env.PORT || 4000;

initializeDatabase();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*"
  })
);
app.use(express.json());

function normalizeProduct(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    barcode: row.barcode || "",
    quantity: row.quantity,
    price: row.price,
    category: row.category || "",
    lowStockThreshold: row.low_stock_threshold,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildTimestamp(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getSortClause(sort) {
  switch (sort) {
    case "name_desc":
      return "ORDER BY name DESC";
    case "quantity_asc":
      return "ORDER BY quantity ASC, name ASC";
    case "quantity_desc":
      return "ORDER BY quantity DESC, name ASC";
    case "updated_desc":
      return "ORDER BY updated_at DESC";
    case "updated_asc":
      return "ORDER BY updated_at ASC";
    case "name_asc":
    default:
      return "ORDER BY name COLLATE NOCASE ASC";
  }
}

async function fetchProductById(id) {
  const row = await get("SELECT * FROM products WHERE id = ?", [id]);
  return normalizeProduct(row);
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/products", async (request, response) => {
  try {
    const query = (request.query.query || "").trim();
    const sort = (request.query.sort || "name_asc").trim();
    const lowStockOnly = request.query.lowStockOnly === "true";
    const threshold = Number(request.query.threshold || 3);

    const clauses = [];
    const params = [];

    if (query) {
      clauses.push("(LOWER(name) LIKE LOWER(?) OR barcode = ?)");
      params.push(`%${query}%`, query);
    }

    if (lowStockOnly) {
      clauses.push("quantity <= ?");
      params.push(Number.isNaN(threshold) ? 3 : threshold);
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await all(
      `SELECT * FROM products ${whereClause} ${getSortClause(sort)}`,
      params
    );

    response.json(rows.map(normalizeProduct));
  } catch (error) {
    response.status(500).json({ message: "Failed to load products." });
  }
});

app.post("/api/products", async (request, response) => {
  try {
    const { name, barcode, quantity, price, category, lowStockThreshold } = request.body;

    if (!name || !String(name).trim()) {
      response.status(400).json({ message: "Product name is required." });
      return;
    }

    const parsedQuantity = Number(quantity);
    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      response.status(400).json({ message: "Quantity must be a valid number." });
      return;
    }

    const cleanBarcode = barcode ? String(barcode).trim() : null;
    const cleanCategory = category ? String(category).trim() : null;
    const parsedPrice = parseOptionalNumber(price);
    const parsedThreshold = Number(lowStockThreshold);

    const result = await run(
      `
        INSERT INTO products (
          name,
          barcode,
          quantity,
          price,
          category,
          low_stock_threshold,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [
        String(name).trim(),
        cleanBarcode || null,
        parsedQuantity,
        parsedPrice,
        cleanCategory,
        Number.isNaN(parsedThreshold) ? 3 : parsedThreshold
      ]
    );

    const product = await fetchProductById(result.id);
    response.status(201).json(product);
  } catch (error) {
    if (error.message.includes("UNIQUE")) {
      response.status(409).json({ message: "Barcode must be unique." });
      return;
    }

    response.status(500).json({ message: "Failed to create product." });
  }
});

app.patch("/api/products/:id", async (request, response) => {
  try {
    const id = Number(request.params.id);
    const existing = await fetchProductById(id);

    if (!existing) {
      response.status(404).json({ message: "Product not found." });
      return;
    }

    const nextName = request.body.name !== undefined ? String(request.body.name).trim() : existing.name;
    const nextBarcode =
      request.body.barcode !== undefined ? String(request.body.barcode).trim() : existing.barcode;
    const nextCategory =
      request.body.category !== undefined ? String(request.body.category).trim() : existing.category;

    if (!nextName) {
      response.status(400).json({ message: "Product name is required." });
      return;
    }

    const nextQuantity =
      request.body.quantity !== undefined ? Number(request.body.quantity) : existing.quantity;

    if (Number.isNaN(nextQuantity) || nextQuantity < 0) {
      response.status(400).json({ message: "Quantity must be zero or greater." });
      return;
    }

    const nextPrice =
      request.body.price !== undefined ? parseOptionalNumber(request.body.price) : existing.price;
    const nextThreshold =
      request.body.lowStockThreshold !== undefined
        ? Number(request.body.lowStockThreshold)
        : existing.lowStockThreshold;

    await run(
      `
        UPDATE products
        SET name = ?, barcode = ?, quantity = ?, price = ?, category = ?,
            low_stock_threshold = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        nextName,
        nextBarcode || null,
        nextQuantity,
        nextPrice,
        nextCategory || null,
        Number.isNaN(nextThreshold) ? 3 : nextThreshold,
        id
      ]
    );

    response.json(await fetchProductById(id));
  } catch (error) {
    if (error.message.includes("UNIQUE")) {
      response.status(409).json({ message: "Barcode must be unique." });
      return;
    }

    response.status(500).json({ message: "Failed to update product." });
  }
});

app.post("/api/products/:id/adjust", async (request, response) => {
  try {
    const id = Number(request.params.id);
    const delta = Number(request.body.delta);
    const existing = await fetchProductById(id);

    if (!existing) {
      response.status(404).json({ message: "Product not found." });
      return;
    }

    if (Number.isNaN(delta) || delta === 0) {
      response.status(400).json({ message: "Delta must be a non-zero number." });
      return;
    }

    const nextQuantity = existing.quantity + delta;
    if (nextQuantity < 0) {
      response.status(400).json({ message: "Quantity cannot go below zero." });
      return;
    }

    await run(
      `
        UPDATE products
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [nextQuantity, id]
    );

    response.json(await fetchProductById(id));
  } catch (error) {
    response.status(500).json({ message: "Failed to adjust stock." });
  }
});

app.post("/api/sales", async (request, response) => {
  try {
    const productId = Number(request.body.productId);
    const quantity = Number(request.body.quantity);

    if (Number.isNaN(productId) || productId <= 0) {
      response.status(400).json({ message: "Product ID is required." });
      return;
    }

    if (Number.isNaN(quantity) || quantity <= 0) {
      response.status(400).json({ message: "Quantity must be a positive number." });
      return;
    }

    const existing = await fetchProductById(productId);
    if (!existing) {
      response.status(404).json({ message: "Product not found." });
      return;
    }

    if (quantity > existing.quantity) {
      response.status(400).json({ message: "Not enough stock available." });
      return;
    }

    const priceAtSale = existing.price ?? 0;
    const total = priceAtSale * quantity;

    const result = await run(
      `
        INSERT INTO sales (product_id, quantity, price_at_sale, total)
        VALUES (?, ?, ?, ?)
      `,
      [productId, quantity, priceAtSale, total]
    );

    await run(
      `
        UPDATE products
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [existing.quantity - quantity, productId]
    );

    response.status(201).json({
      id: result.id,
      productId,
      quantity,
      priceAtSale,
      total,
      createdAt: buildTimestamp(new Date())
    });
  } catch (error) {
    response.status(500).json({ message: "Failed to record sale." });
  }
});

app.get("/api/sales/report", async (request, response) => {
  try {
    const now = new Date();
    const todayStart = buildTimestamp(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)));
    const weekStart = buildTimestamp(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6, 0, 0, 0)));
    const monthStart = buildTimestamp(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)));
    const yearStart = buildTimestamp(new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0)));

    const report = await get(
      `
        SELECT
          IFNULL(SUM(CASE WHEN created_at >= ? THEN total END), 0) AS todayTotal,
          IFNULL(SUM(CASE WHEN created_at >= ? THEN total END), 0) AS weekTotal,
          IFNULL(SUM(CASE WHEN created_at >= ? THEN total END), 0) AS monthTotal,
          IFNULL(SUM(CASE WHEN created_at >= ? THEN total END), 0) AS yearTotal,
          IFNULL(SUM(CASE WHEN created_at >= ? THEN quantity END), 0) AS todayUnits,
          IFNULL(SUM(CASE WHEN created_at >= ? THEN quantity END), 0) AS weekUnits,
          IFNULL(SUM(CASE WHEN created_at >= ? THEN quantity END), 0) AS monthUnits,
          IFNULL(SUM(CASE WHEN created_at >= ? THEN quantity END), 0) AS yearUnits
        FROM sales
      `,
      [todayStart, weekStart, monthStart, yearStart, todayStart, weekStart, monthStart, yearStart]
    );

    response.json(report);
  } catch (error) {
    response.status(500).json({ message: "Failed to load sales report." });
  }
});

app.get("/api/sales/history", async (request, response) => {
  try {
    const limit = Number(request.query.limit || 50);
    const offset = Number(request.query.offset || 0);

    const rows = await all(
      `
        SELECT
          s.id,
          s.product_id,
          s.quantity,
          s.price_at_sale,
          s.total,
          s.created_at,
          p.name as product_name,
          p.barcode
        FROM sales s
        LEFT JOIN products p ON s.product_id = p.id
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    const countResult = await get("SELECT COUNT(*) as total FROM sales");

    response.json({
      sales: rows,
      total: countResult.total,
      limit,
      offset
    });
  } catch (error) {
    response.status(500).json({ message: "Failed to load sales history." });
  }
});

app.delete("/api/products/:id", async (request, response) => {
  try {
    const id = Number(request.params.id);
    const existing = await fetchProductById(id);

    if (!existing) {
      response.status(404).json({ message: "Product not found." });
      return;
    }

    await run("DELETE FROM products WHERE id = ?", [id]);
    response.status(204).send();
  } catch (error) {
    response.status(500).json({ message: "Failed to delete product." });
  }
});

app.listen(PORT, () => {
  console.log(`Telecom inventory backend running on port ${PORT}`);
});
