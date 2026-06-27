const fs = require("fs/promises");
const path = require("path");

const STORE_PATH = path.join(process.cwd(), "data", "store.json");
const COLLECTIONS = {
  phone: "products",
  phones: "products",
  products: "products",
  accessory: "accessories",
  accessories: "accessories",
  part: "parts",
  parts: "parts",
  repairs: "parts"
};

const DHAKA_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Dhaka",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

async function readStore() {
  const raw = await fs.readFile(STORE_PATH, "utf8");
  return normalizeStore(JSON.parse(raw));
}

async function writeStore(store) {
  const normalized = normalizeStore(store);
  await fs.writeFile(STORE_PATH, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

function normalizeStore(rawStore = {}) {
  return {
    products: Array.isArray(rawStore.products) ? rawStore.products : [],
    accessories: Array.isArray(rawStore.accessories) ? rawStore.accessories : [],
    parts: Array.isArray(rawStore.parts) ? rawStore.parts : [],
    suppliers: Array.isArray(rawStore.suppliers) ? rawStore.suppliers : [],
    sales: Array.isArray(rawStore.sales) ? rawStore.sales : [],
    customers: Array.isArray(rawStore.customers)
      ? rawStore.customers
      : Object.values(rawStore.customers || {}),
    notifications: Array.isArray(rawStore.notifications) ? rawStore.notifications : []
  };
}

function normalizeCollection(collection) {
  return COLLECTIONS[String(collection || "").toLowerCase()];
}

function asMoney(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.round(numeric)) : 0;
}

function asQty(value) {
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

function makeSku(...segments) {
  const cleaned = segments.map(slugify).filter(Boolean);
  return cleaned.join("-").slice(0, 36) || `SKU-${Date.now().toString().slice(-6)}`;
}

function itemName(item) {
  return item.name || item.model || "Unknown";
}

function withCollection(item, collection) {
  return { ...item, collection };
}

function getAllItems(store) {
  return [
    ...store.products.map((item) => withCollection(item, "products")),
    ...store.accessories.map((item) => withCollection(item, "accessories")),
    ...store.parts.map((item) => withCollection(item, "parts"))
  ];
}

function getLowStockItems(store) {
  return getAllItems(store).filter((item) => item.qty <= item.alert);
}

function getTodaySales(store) {
  const today = DHAKA_DATE.format(new Date());
  return store.sales.filter((sale) => DHAKA_DATE.format(new Date(sale.date)) === today);
}

function computeDashboard(store) {
  const allItems = getAllItems(store);
  const todaySales = getTodaySales(store);
  const categoryGroups = [
    { key: "products", label: "Phones" },
    { key: "accessories", label: "Accessories" },
    { key: "parts", label: "Parts" }
  ];
  const maxQty = Math.max(
    1,
    ...categoryGroups.map(({ key }) => store[key].reduce((sum, item) => sum + item.qty, 0))
  );

  return {
    totalProducts: allItems.length,
    todaySales: todaySales.reduce((sum, sale) => sum + sale.total, 0),
    todaySalesCount: todaySales.length,
    stockValue: allItems.reduce((sum, item) => sum + item.buyPrice * item.qty, 0),
    lowStockCount: getLowStockItems(store).length,
    recentSales: [...store.sales].slice(-5).reverse(),
    categoryBreakdown: categoryGroups.map(({ key, label }) => {
      const totalUnits = store[key].reduce((sum, item) => sum + item.qty, 0);
      const stockValue = store[key].reduce((sum, item) => sum + item.qty * item.sellPrice, 0);

      return {
        key,
        label,
        totalUnits,
        stockValue,
        percent: Math.round((totalUnits / maxQty) * 100)
      };
    })
  };
}

function getCustomerList(store) {
  return [...store.customers].sort((a, b) => {
    const left = new Date(b.lastVisit || 0).getTime();
    const right = new Date(a.lastVisit || 0).getTime();
    return left - right;
  });
}

function createPhone(payload) {
  const brand = String(payload.brand || "").trim();
  const model = String(payload.model || "").trim();
  if (!brand || !model) {
    throw new Error("Phone brand and model are required.");
  }

  const storage = String(payload.storage || "128GB").trim();
  return {
    id: makeId("P"),
    type: "Phone",
    brand,
    model,
    color: String(payload.color || "—").trim(),
    storage,
    imei: String(payload.imei || "").trim(),
    buyPrice: asMoney(payload.buyPrice),
    sellPrice: asMoney(payload.sellPrice),
    qty: asQty(payload.qty),
    alert: asQty(payload.alert || 2),
    sku: makeSku(brand.slice(0, 3), model, storage)
  };
}

function createAccessory(payload) {
  const name = String(payload.name || "").trim();
  if (!name) {
    throw new Error("Accessory name is required.");
  }

  return {
    id: makeId("A"),
    type: "Accessory",
    name,
    category: String(payload.category || "Other").trim(),
    brand: String(payload.brand || "Generic").trim(),
    compat: String(payload.compat || "Universal").trim(),
    buyPrice: asMoney(payload.buyPrice),
    sellPrice: asMoney(payload.sellPrice),
    qty: asQty(payload.qty),
    alert: asQty(payload.alert || 5),
    sku: makeSku(payload.brand || "ACC", name)
  };
}

function createPart(payload) {
  const name = String(payload.name || "").trim();
  if (!name) {
    throw new Error("Repair part name is required.");
  }

  return {
    id: makeId("R"),
    type: "Part",
    name,
    model: String(payload.model || "Universal").trim(),
    quality: String(payload.quality || "OEM").trim(),
    buyPrice: asMoney(payload.buyPrice),
    sellPrice: asMoney(payload.sellPrice),
    qty: asQty(payload.qty),
    alert: asQty(payload.alert || 2),
    sku: String(payload.sku || "").trim() || makeSku(name, payload.model || "Universal")
  };
}

function createSupplier(payload) {
  const name = String(payload.name || "").trim();
  if (!name) {
    throw new Error("Supplier name is required.");
  }

  return {
    id: makeId("S"),
    name,
    phone: String(payload.phone || "").trim(),
    category: String(payload.category || "All").trim(),
    address: String(payload.address || "").trim(),
    lastOrder: new Date().toISOString().slice(0, 10),
    status: "Active"
  };
}

function updatePhone(existingItem, payload) {
  const brand = String(payload.brand || "").trim();
  const model = String(payload.model || "").trim();
  if (!brand || !model) {
    throw new Error("Phone brand and model are required.");
  }

  const storage = String(payload.storage || "128GB").trim();
  return {
    ...existingItem,
    brand,
    model,
    color: String(payload.color || "—").trim(),
    storage,
    imei: String(payload.imei || "").trim(),
    buyPrice: asMoney(payload.buyPrice),
    sellPrice: asMoney(payload.sellPrice),
    qty: asQty(payload.qty),
    alert: asQty(payload.alert || 2),
    sku: String(payload.sku || "").trim() || makeSku(brand.slice(0, 3), model, storage)
  };
}

function updateAccessory(existingItem, payload) {
  const name = String(payload.name || "").trim();
  if (!name) {
    throw new Error("Accessory name is required.");
  }

  return {
    ...existingItem,
    name,
    category: String(payload.category || "Other").trim(),
    brand: String(payload.brand || "Generic").trim(),
    compat: String(payload.compat || "Universal").trim(),
    buyPrice: asMoney(payload.buyPrice),
    sellPrice: asMoney(payload.sellPrice),
    qty: asQty(payload.qty),
    alert: asQty(payload.alert || 5),
    sku: String(payload.sku || "").trim() || makeSku(payload.brand || "ACC", name)
  };
}

function updatePart(existingItem, payload) {
  const name = String(payload.name || "").trim();
  if (!name) {
    throw new Error("Repair part name is required.");
  }

  return {
    ...existingItem,
    name,
    model: String(payload.model || "Universal").trim(),
    quality: String(payload.quality || "OEM").trim(),
    buyPrice: asMoney(payload.buyPrice),
    sellPrice: asMoney(payload.sellPrice),
    qty: asQty(payload.qty),
    alert: asQty(payload.alert || 2),
    sku: String(payload.sku || "").trim() || makeSku(name, payload.model || "Universal")
  };
}

function updateCustomer(store, sale) {
  const customerName = String(sale.customer || "").trim();
  if (!customerName) {
    return;
  }

  const existing = store.customers.find(
    (customer) => customer.name.toLowerCase() === customerName.toLowerCase()
  );

  if (existing) {
    existing.total += sale.total;
    existing.lastVisit = sale.date;
    if (!existing.phone) {
      existing.phone = "";
    }
    return;
  }

  store.customers.push({
    id: makeId("C"),
    name: customerName,
    phone: "",
    total: sale.total,
    lastVisit: sale.date
  });
}

function createSaleNotification(sale) {
  return {
    id: makeId("N"),
    type: "sale",
    saleId: sale.id,
    date: sale.date,
    cashier: sale.cashier,
    customer: sale.customer,
    payment: sale.payment,
    total: sale.total,
    lineCount: sale.items.length,
    quantityCount: sale.items.reduce((sum, item) => sum + item.qty, 0),
    primaryItemName: sale.items[0]?.name || "Item"
  };
}

async function getBootstrap() {
  const store = await readStore();
  return {
    inventory: {
      products: store.products,
      accessories: store.accessories,
      parts: store.parts
    },
    suppliers: store.suppliers,
    sales: [...store.sales].reverse(),
    customers: getCustomerList(store),
    notifications: store.notifications,
    lowStock: getLowStockItems(store),
    dashboard: computeDashboard(store)
  };
}

async function addItem(collection, payload) {
  const key = normalizeCollection(collection);
  if (!key) {
    throw new Error("Unknown inventory collection.");
  }

  const store = await readStore();
  const builders = {
    products: createPhone,
    accessories: createAccessory,
    parts: createPart
  };
  const item = builders[key](payload);
  store[key].push(item);
  await writeStore(store);
  return item;
}

async function updateItem(collection, id, payload) {
  const key = normalizeCollection(collection);
  if (!key) {
    throw new Error("Unknown inventory collection.");
  }

  const store = await readStore();
  const index = store[key].findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error("Item not found.");
  }

  const updaters = {
    products: updatePhone,
    accessories: updateAccessory,
    parts: updatePart
  };

  const updatedItem = updaters[key](store[key][index], payload);
  store[key][index] = updatedItem;
  await writeStore(store);
  return updatedItem;
}

async function deleteItem(collection, id) {
  const key = normalizeCollection(collection);
  if (!key) {
    throw new Error("Unknown inventory collection.");
  }

  const store = await readStore();
  const initialLength = store[key].length;
  store[key] = store[key].filter((item) => item.id !== id);

  if (store[key].length === initialLength) {
    return false;
  }

  await writeStore(store);
  return true;
}

async function addSupplier(payload) {
  const store = await readStore();
  const supplier = createSupplier(payload);
  store.suppliers.push(supplier);
  await writeStore(store);
  return supplier;
}

async function checkout(payload) {
  const lines = Array.isArray(payload.items) ? payload.items : [];
  const cashier = String(payload.cashier || "").trim();
  if (!lines.length) {
    throw new Error("A sale requires at least one cart item.");
  }
  if (!cashier) {
    throw new Error("Cashier name is required.");
  }

  const store = await readStore();
  const allItems = getAllItems(store);
  const saleItems = [];
  let subtotal = 0;

  for (const line of lines) {
    const qty = asQty(line.qty);
    if (!qty) {
      continue;
    }

    const stockItem = allItems.find((item) => item.id === line.id);
    if (!stockItem) {
      throw new Error(`Item ${line.id} was not found.`);
    }
    if (stockItem.qty < qty) {
      throw new Error(`Not enough stock for ${itemName(stockItem)}.`);
    }

    subtotal += stockItem.sellPrice * qty;
    saleItems.push({
      id: stockItem.id,
      name: itemName(stockItem),
      price: stockItem.sellPrice,
      qty,
      sku: stockItem.sku,
      type: stockItem.type
    });
  }

  if (!saleItems.length) {
    throw new Error("A sale requires at least one valid cart item.");
  }

  saleItems.forEach((line) => {
    const collection = normalizeCollection(line.type);
    const item = store[collection].find((entry) => entry.id === line.id);
    item.qty -= line.qty;
  });

  const tax = Math.round(subtotal * 0.05);
  const discount = asMoney(payload.discount);
  const total = Math.max(0, subtotal + tax - discount);
  const sale = {
    id: `TXN-${Date.now()}`,
    date: new Date().toISOString(),
    items: saleItems,
    cashier,
    customer: String(payload.customer || "").trim(),
    payment: String(payload.payment || "Cash").trim(),
    subtotal,
    tax,
    discount,
    total
  };

  store.sales.push(sale);
  const notification = createSaleNotification(sale);
  store.notifications = [notification, ...store.notifications].slice(0, 20);
  updateCustomer(store, sale);
  await writeStore(store);
  return { sale, notification };
}

async function searchInventory(query) {
  const search = String(query || "").trim().toLowerCase();
  if (!search) {
    return [];
  }

  const store = await readStore();
  return getAllItems(store).filter((item) => {
    return [itemName(item), item.brand, item.sku, item.compat, item.model]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });
}

module.exports = {
  addItem,
  addSupplier,
  checkout,
  deleteItem,
  getBootstrap,
  updateItem,
  searchInventory
};
