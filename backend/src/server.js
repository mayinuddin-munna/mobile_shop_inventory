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
