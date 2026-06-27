"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { DEFAULT_PAGE_ID, getPathForPage, getTitleForPage } from "../lib/routes";

const NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "dashboard" },
      { id: "pos", label: "Point of Sale", icon: "receipt" }
    ]
  },
  {
    title: "Inventory",
    items: [
      { id: "products", label: "Products", icon: "mobile" },
      { id: "accessories", label: "Accessories", icon: "headphones" },
      { id: "repairs", label: "Repair Parts", icon: "tool" },
      { id: "alerts", label: "Low Stock", icon: "alert", showBadge: true }
    ]
  },
  {
    title: "Business",
    items: [
      { id: "sales", label: "Sales History", icon: "chart" },
      { id: "suppliers", label: "Suppliers", icon: "truck" },
      { id: "customers", label: "Customers", icon: "users" }
    ]
  }
];

const PHONE_BRANDS = ["Samsung", "Apple", "Xiaomi", "Realme", "OPPO", "Vivo", "Tecno", "Infinix", "Nokia"];
const PHONE_STORAGES = ["32GB", "64GB", "128GB", "256GB", "512GB"];
const ACCESSORY_CATEGORIES = [
  "Charger",
  "Cable",
  "Case",
  "Screen Protector",
  "Earphone",
  "Power Bank",
  "Memory Card",
  "Other"
];
const PART_QUALITIES = ["Original", "OEM", "Copy"];
const SUPPLIER_CATEGORIES = ["Phones", "Accessories", "Parts", "All"];
const PAYMENT_METHODS = ["Cash", "bKash", "Nagad", "Card", "Bank Transfer"];

const EMPTY_DATA = {
  inventory: { products: [], accessories: [], parts: [] },
  suppliers: [],
  sales: [],
  customers: [],
  notifications: [],
  lowStock: [],
  dashboard: {
    totalProducts: 0,
    todaySales: 0,
    todaySalesCount: 0,
    stockValue: 0,
    lowStockCount: 0,
    recentSales: [],
    categoryBreakdown: []
  }
};

const PRODUCT_FORM = {
  brand: "Samsung",
  model: "",
  color: "",
  storage: "128GB",
  imei: "",
  buyPrice: "",
  sellPrice: "",
  qty: 1,
  alert: 2
};

const ACCESSORY_FORM = {
  name: "",
  category: "Charger",
  brand: "",
  compat: "",
  buyPrice: "",
  sellPrice: "",
  qty: 1,
  alert: 5
};

const PART_FORM = {
  name: "",
  model: "",
  quality: "Original",
  sku: "",
  buyPrice: "",
  sellPrice: "",
  qty: 1,
  alert: 2
};

const SUPPLIER_FORM = {
  name: "",
  phone: "",
  category: "Phones",
  address: ""
};

const INVENTORY_MODAL_BY_COLLECTION = {
  products: "product",
  accessories: "accessory",
  parts: "part"
};

const INVENTORY_LABEL_BY_COLLECTION = {
  products: "Phone",
  accessories: "Accessory",
  parts: "Repair Part"
};

function createProductFormState() {
  return { ...PRODUCT_FORM };
}

function createAccessoryFormState() {
  return { ...ACCESSORY_FORM };
}

function createPartFormState() {
  return { ...PART_FORM };
}

function createSupplierFormState() {
  return { ...SUPPLIER_FORM };
}

function phoneToFormState(item) {
  return {
    brand: item.brand || "Samsung",
    model: item.model || "",
    color: item.color || "",
    storage: item.storage || "128GB",
    imei: item.imei || "",
    buyPrice: item.buyPrice ?? "",
    sellPrice: item.sellPrice ?? "",
    qty: item.qty ?? 0,
    alert: item.alert ?? 2
  };
}

function accessoryToFormState(item) {
  return {
    name: item.name || "",
    category: item.category || "Charger",
    brand: item.brand || "",
    compat: item.compat || "",
    buyPrice: item.buyPrice ?? "",
    sellPrice: item.sellPrice ?? "",
    qty: item.qty ?? 0,
    alert: item.alert ?? 5
  };
}

function partToFormState(item) {
  return {
    name: item.name || "",
    model: item.model || "",
    quality: item.quality || "Original",
    sku: item.sku || "",
    buyPrice: item.buyPrice ?? "",
    sellPrice: item.sellPrice ?? "",
    qty: item.qty ?? 0,
    alert: item.alert ?? 2
  };
}

function formatCurrency(value) {
  return `৳${new Intl.NumberFormat("en-BD").format(Math.round(value || 0))}`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-BD", { dateStyle: "medium" });
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("en-BD", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function normalizeText(...parts) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function itemLabel(item) {
  return item.name || item.model || "Unnamed item";
}

function collectionToPage(collection) {
  if (collection === "products") {
    return "products";
  }
  if (collection === "accessories") {
    return "accessories";
  }
  return "repairs";
}

function getStatus(item) {
  if (item.qty === 0) {
    return { tone: "danger", label: "Out of stock" };
  }
  if (item.qty <= item.alert) {
    return { tone: "warning", label: "Low stock" };
  }
  return { tone: "success", label: "In stock" };
}

function matchesItem(item, query) {
  if (!query.trim()) {
    return true;
  }

  return normalizeText(
    itemLabel(item),
    item.brand,
    item.sku,
    item.compat,
    item.model,
    item.category,
    item.storage,
    item.color
  ).includes(query.trim().toLowerCase());
}

function matchesSupplier(supplier, query) {
  if (!query.trim()) {
    return true;
  }

  return normalizeText(supplier.name, supplier.phone, supplier.category, supplier.address).includes(
    query.trim().toLowerCase()
  );
}

function matchesCustomer(customer, query) {
  if (!query.trim()) {
    return true;
  }

  return normalizeText(customer.name, customer.phone).includes(query.trim().toLowerCase());
}

function matchesSale(sale, query) {
  if (!query.trim()) {
    return true;
  }

  return normalizeText(
    sale.customer,
    sale.cashier,
    sale.payment,
    sale.id,
    ...sale.items.map((item) => `${item.name} ${item.sku}`)
  ).includes(query.trim().toLowerCase());
}

function matchesNotification(notification, query) {
  if (!query.trim()) {
    return true;
  }

  return normalizeText(
    notification.saleId,
    notification.cashier,
    notification.customer,
    notification.payment,
    notification.primaryItemName
  ).includes(query.trim().toLowerCase());
}

function flattenInventory(inventory) {
  return [
    ...inventory.products.map((item) => ({ ...item, collection: "products" })),
    ...inventory.accessories.map((item) => ({ ...item, collection: "accessories" })),
    ...inventory.parts.map((item) => ({ ...item, collection: "parts" }))
  ];
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(body?.error || "Request failed.");
  }

  return body;
}

function FormField({ label, full = false, children }) {
  return (
    <div className={`form-group${full ? " full" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function Modal({ open, title, onClose, children, footer, compact = false }) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-bg open" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal${compact ? " compact" : ""}`}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="close-btn" onClick={onClose} type="button">
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
        <div className="form-actions">{footer}</div>
      </div>
    </div>
  );
}

function StatusBadge({ item }) {
  const status = getStatus(item);
  return <span className={`badge ${status.tone}`}>{status.label}</span>;
}

function NotificationSummary({ notification }) {
  return (
    <>
      <div className="notification-title">
        {notification.cashier} completed a sale
      </div>
      <div className="notification-sub">
        {notification.primaryItemName}
        {notification.lineCount > 1 ? ` +${notification.lineCount - 1} more` : ""}
        {" · "}
        {notification.quantityCount} unit{notification.quantityCount > 1 ? "s" : ""}
        {" · "}
        {formatCurrency(notification.total)}
      </div>
      <div className="notification-meta">
        {notification.saleId} · {notification.payment}
        {notification.customer ? ` · ${notification.customer}` : ""}
        {" · "}
        {formatDateTime(notification.date)}
      </div>
    </>
  );
}

export default function MobilePointApp({ pageId = DEFAULT_PAGE_ID }) {
  const router = useRouter();
  const currentPage = pageId || DEFAULT_PAGE_ID;
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState("");
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("All");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashierName, setCashierName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [liveNotification, setLiveNotification] = useState(null);
  const [streamConnected, setStreamConnected] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [productFilters, setProductFilters] = useState({ brand: "", stock: "" });
  const [accessoryFilter, setAccessoryFilter] = useState("");
  const [partFilter, setPartFilter] = useState("");
  const [productForm, setProductForm] = useState(createProductFormState);
  const [accessoryForm, setAccessoryForm] = useState(createAccessoryFormState);
  const [partForm, setPartForm] = useState(createPartFormState);
  const [supplierForm, setSupplierForm] = useState(createSupplierFormState);

  async function loadData(showLoader = false) {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const bootstrap = await request("/api/bootstrap", { cache: "no-store" });
      setData(bootstrap);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadData(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const savedDesktopState = window.localStorage.getItem("mobilepoint-sidebar-desktop");
    if (savedDesktopState === "closed") {
      setDesktopSidebarOpen(false);
    }

    const syncViewport = (event) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
    } else {
      mediaQuery.addListener(syncViewport);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", syncViewport);
      } else {
        mediaQuery.removeListener(syncViewport);
      }
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "mobilepoint-sidebar-desktop",
      desktopSidebarOpen ? "open" : "closed"
    );
  }, [desktopSidebarOpen]);

  useEffect(() => {
    if (!isMobileViewport) {
      setMobileSidebarOpen(false);
    }
  }, [isMobileViewport]);

  useEffect(() => {
    if (!isMobileViewport || !mobileSidebarOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileViewport, mobileSidebarOpen]);

  useEffect(() => {
    if (currentPage !== "dashboard") {
      setStreamConnected(false);
      return undefined;
    }

    const stream = new EventSource("/api/notifications/stream");

    stream.onopen = () => {
      setStreamConnected(true);
    };

    stream.onerror = () => {
      setStreamConnected(false);
    };

    const handleSaleNotification = (event) => {
      try {
        const notification = JSON.parse(event.data);
        setLiveNotification(notification);
        loadData();
      } catch (notificationError) {
        console.error(notificationError);
      }
    };

    stream.addEventListener("sale", handleSaleNotification);

    return () => {
      stream.removeEventListener("sale", handleSaleNotification);
      stream.close();
      setStreamConnected(false);
    };
  }, [currentPage]);

  useEffect(() => {
    if (!liveNotification) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setLiveNotification(null);
    }, 6000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [liveNotification]);

  const inventory = data.inventory || EMPTY_DATA.inventory;
  const allItems = flattenInventory(inventory);
  const searchResults = search.trim()
    ? allItems.filter((item) => matchesItem(item, search)).slice(0, 6)
    : [];
  const phoneBrands = Array.from(new Set([...PHONE_BRANDS, ...inventory.products.map((item) => item.brand)]));
  const accessoryCategories = Array.from(
    new Set([...ACCESSORY_CATEGORIES, ...inventory.accessories.map((item) => item.category)])
  );
  const partModels = Array.from(new Set(inventory.parts.map((item) => item.model))).filter(Boolean);

  const filteredProducts = inventory.products.filter((item) => {
    if (productFilters.brand && item.brand !== productFilters.brand) {
      return false;
    }
    if (productFilters.stock === "low" && item.qty > item.alert) {
      return false;
    }
    if (productFilters.stock === "ok" && item.qty <= item.alert) {
      return false;
    }
    return matchesItem(item, search);
  });

  const filteredAccessories = inventory.accessories.filter((item) => {
    if (accessoryFilter && item.category !== accessoryFilter) {
      return false;
    }
    return matchesItem(item, search);
  });

  const filteredParts = inventory.parts.filter((item) => {
    if (partFilter && item.model !== partFilter) {
      return false;
    }
    return matchesItem(item, search);
  });

  const filteredLowStock = data.lowStock.filter((item) => matchesItem(item, search));
  const filteredSales = data.sales.filter((sale) => matchesSale(sale, search));
  const filteredSuppliers = data.suppliers.filter((supplier) => matchesSupplier(supplier, search));
  const filteredCustomers = data.customers.filter((customer) => matchesCustomer(customer, search));
  const filteredNotifications = data.notifications.filter((notification) =>
    matchesNotification(notification, search)
  );
  const posItems = allItems.filter((item) => {
    if (item.qty === 0) {
      return false;
    }
    if (posFilter !== "All" && item.type !== posFilter) {
      return false;
    }
    return matchesItem(item, search);
  });

  const subtotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const discountValue = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal + tax - discountValue);
  const sidebarOpen = isMobileViewport ? mobileSidebarOpen : desktopSidebarOpen;
  const sidebarStateLabel = sidebarOpen ? "Close sidebar" : "Open sidebar";
  const isEditingProduct = editingItem?.collection === "products";
  const isEditingAccessory = editingItem?.collection === "accessories";
  const isEditingPart = editingItem?.collection === "parts";

  function resetEditorState() {
    setEditingItem(null);
    setDeleteTarget(null);
    setProductForm(createProductFormState());
    setAccessoryForm(createAccessoryFormState());
    setPartForm(createPartFormState());
    setSupplierForm(createSupplierFormState());
  }

  function navigateToPage(nextPageId, options = {}) {
    if (options.clearSearch) {
      setSearch("");
    }

    if (isMobileViewport) {
      setMobileSidebarOpen(false);
    }

    router.push(getPathForPage(nextPageId));
  }

  function toggleSidebar() {
    if (isMobileViewport) {
      setMobileSidebarOpen((current) => !current);
      return;
    }

    setDesktopSidebarOpen((current) => !current);
  }

  function closeSidebarDrawer() {
    if (isMobileViewport) {
      setMobileSidebarOpen(false);
    }
  }

  function openPrimaryModal() {
    if (currentPage === "accessories") {
      openCreateModal("accessories");
      return;
    }
    if (currentPage === "repairs") {
      openCreateModal("parts");
      return;
    }
    if (currentPage === "suppliers") {
      openSupplierModal();
      return;
    }
    openCreateModal("products");
  }

  function openCreateModal(collection) {
    setEditingItem(null);
    setDeleteTarget(null);

    if (collection === "products") {
      setProductForm(createProductFormState());
    }
    if (collection === "accessories") {
      setAccessoryForm(createAccessoryFormState());
    }
    if (collection === "parts") {
      setPartForm(createPartFormState());
    }

    setModal(INVENTORY_MODAL_BY_COLLECTION[collection]);
  }

  function openEditModal(collection, item) {
    setDeleteTarget(null);
    setEditingItem({ collection, id: item.id });

    if (collection === "products") {
      setProductForm(phoneToFormState(item));
    }
    if (collection === "accessories") {
      setAccessoryForm(accessoryToFormState(item));
    }
    if (collection === "parts") {
      setPartForm(partToFormState(item));
    }

    setModal(INVENTORY_MODAL_BY_COLLECTION[collection]);
  }

  function openSupplierModal() {
    setEditingItem(null);
    setDeleteTarget(null);
    setSupplierForm(createSupplierFormState());
    setModal("supplier");
  }

  function requestDelete(collection, item) {
    setEditingItem(null);
    setDeleteTarget({ collection, item });
    setModal("delete-confirm");
  }

  function closeModal() {
    const currentModal = modal;
    setModal("");
    if (currentModal === "receipt") {
      setReceipt(null);
      return;
    }

    resetEditorState();
  }

  function findLiveItem(itemId) {
    return allItems.find((item) => item.id === itemId);
  }

  function addToCart(item) {
    setCart((currentCart) => {
      const existing = currentCart.find((line) => line.id === item.id);
      if (existing) {
        if (existing.qty >= item.qty) {
          window.alert("Not enough stock for this item.");
          return currentCart;
        }
        return currentCart.map((line) =>
          line.id === item.id ? { ...line, qty: line.qty + 1 } : line
        );
      }

      return [
        ...currentCart,
        {
          id: item.id,
          name: itemLabel(item),
          price: item.sellPrice,
          qty: 1,
          sku: item.sku
        }
      ];
    });
  }

  function changeCartQty(itemId, delta) {
    setCart((currentCart) => {
      return currentCart
        .map((line) => {
          if (line.id !== itemId) {
            return line;
          }

          const inventoryItem = findLiveItem(itemId);
          const nextQty = line.qty + delta;
          if (nextQty <= 0) {
            return null;
          }

          return {
            ...line,
            qty: Math.min(nextQty, inventoryItem?.qty || nextQty)
          };
        })
        .filter(Boolean);
    });
  }

  function clearCart() {
    setCart([]);
    setDiscount(0);
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      setBusy(true);
      await request(`/api/items/${deleteTarget.collection}/${deleteTarget.item.id}`, { method: "DELETE" });
      setModal("");
      resetEditorState();
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message);
      window.alert(deleteError.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitProduct(event) {
    event.preventDefault();
    try {
      setBusy(true);
      await request(isEditingProduct ? `/api/items/products/${editingItem.id}` : "/api/items/products", {
        method: isEditingProduct ? "PUT" : "POST",
        body: JSON.stringify(productForm)
      });
      setProductForm(createProductFormState());
      setEditingItem(null);
      setModal("");
      await loadData();
    } catch (submitError) {
      setError(submitError.message);
      window.alert(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitAccessory(event) {
    event.preventDefault();
    try {
      setBusy(true);
      await request(
        isEditingAccessory ? `/api/items/accessories/${editingItem.id}` : "/api/items/accessories",
        {
          method: isEditingAccessory ? "PUT" : "POST",
          body: JSON.stringify(accessoryForm)
        }
      );
      setAccessoryForm(createAccessoryFormState());
      setEditingItem(null);
      setModal("");
      await loadData();
    } catch (submitError) {
      setError(submitError.message);
      window.alert(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitPart(event) {
    event.preventDefault();
    try {
      setBusy(true);
      await request(isEditingPart ? `/api/items/parts/${editingItem.id}` : "/api/items/parts", {
        method: isEditingPart ? "PUT" : "POST",
        body: JSON.stringify(partForm)
      });
      setPartForm(createPartFormState());
      setEditingItem(null);
      setModal("");
      await loadData();
    } catch (submitError) {
      setError(submitError.message);
      window.alert(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitSupplier(event) {
    event.preventDefault();
    try {
      setBusy(true);
      await request("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(supplierForm)
      });
      setSupplierForm(createSupplierFormState());
      setModal("");
      await loadData();
    } catch (submitError) {
      setError(submitError.message);
      window.alert(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  async function completeSale() {
    if (!cart.length) {
      window.alert("Cart is empty.");
      return;
    }
    if (!cashierName.trim()) {
      window.alert("Enter the employee or cashier name before completing the sale.");
      return;
    }

    try {
      setBusy(true);
      const response = await request("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((line) => ({ id: line.id, qty: line.qty })),
          cashier: cashierName.trim(),
          payment: paymentMethod,
          customer: customerName,
          discount: discountValue
        })
      });

      setReceipt(response.sale);
      setCart([]);
      setDiscount(0);
      setPaymentMethod("Cash");
      setCustomerName("");
      setModal("receipt");
      await loadData();
    } catch (checkoutError) {
      setError(checkoutError.message);
      window.alert(checkoutError.message);
    } finally {
      setBusy(false);
    }
  }

  function renderDashboard() {
    return (
      <>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Products</div>
            <div className="stat-value">{data.dashboard.totalProducts}</div>
            <div className="stat-sub">across all categories</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Today&apos;s Sales</div>
            <div className="stat-value">{formatCurrency(data.dashboard.todaySales)}</div>
            <div className="stat-sub up">{data.dashboard.todaySalesCount} transactions today</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Stock Value</div>
            <div className="stat-value">{formatCurrency(data.dashboard.stockValue)}</div>
            <div className="stat-sub">total inventory cost</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Low Stock Items</div>
            <div className="stat-value warning-text">{data.dashboard.lowStockCount}</div>
            <div className="stat-sub down">need reorder</div>
          </div>
        </div>

        <div className="two-col">
          <div>
            <div className="section-header">
              <span className="section-title">Recent Transactions</span>
              <button className="btn" onClick={() => navigateToPage("sales")} type="button">
                View all
              </button>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Payment</th>
                      <th>Qty</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dashboard.recentSales.length ? (
                      data.dashboard.recentSales.map((sale) => (
                        <tr key={sale.id}>
                          <td>
                            {sale.items[0]?.name || "—"}
                            {sale.items.length > 1 ? ` +${sale.items.length - 1} more` : ""}
                          </td>
                          <td>
                            <span className="badge accent">{sale.payment}</span>
                          </td>
                          <td>{sale.items.reduce((sum, item) => sum + item.qty, 0)}</td>
                          <td>{formatCurrency(sale.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="empty-row" colSpan="4">
                          No transactions yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <div className="section-header">
              <span className="section-title">Stock Alerts</span>
            </div>
            <div className="card">
              {data.lowStock.length ? (
                data.lowStock.slice(0, 4).map((item) => (
                  <div className="alert-item" key={item.id}>
                    <div className={`alert-icon ${item.qty === 0 ? "danger" : "warn"}`}>
                      <Icon name="alert" size={16} />
                    </div>
                    <div className="alert-text">
                      <div className="alert-name">{itemLabel(item)}</div>
                      <div className="alert-sub">
                        {item.sku} · Stock: {item.qty} (min {item.alert})
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state small">
                  <Icon name="check" size={34} />
                  <p>All stock levels are healthy.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="section-header">
          <span className="section-title">Realtime Sale Notifications</span>
          <span className={`live-pill ${streamConnected ? "online" : "offline"}`}>
            <span className="live-dot" />
            {streamConnected ? "Admin feed live" : "Reconnecting feed"}
          </span>
        </div>
        <div className="card">
          {filteredNotifications.length ? (
            filteredNotifications.slice(0, 5).map((notification) => (
              <div className="notification-item" key={notification.id}>
                <div className="notification-icon">
                  <Icon name="bell" size={16} />
                </div>
                <div className="notification-copy">
                  <NotificationSummary notification={notification} />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state small">
              <Icon name="bell" size={34} />
              <p>No sale notifications yet.</p>
            </div>
          )}
        </div>

        <div className="section-header">
          <span className="section-title">Inventory by Category</span>
        </div>
        <div className="card">
          <div className="breakdown-wrap">
            {data.dashboard.categoryBreakdown.map((category) => (
              <div className="breakdown-item" key={category.key}>
                <div className="breakdown-head">
                  <span>{category.label}</span>
                  <span>
                    {category.totalUnits} units · {formatCurrency(category.stockValue)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${category.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  function renderPos() {
    return (
      <div className="pos-layout">
        <div>
          <div className="chip-row">
            {["All", "Phone", "Accessory", "Part"].map((entry) => (
              <button
                className={`chip${posFilter === entry ? " active" : ""}`}
                key={entry}
                onClick={() => setPosFilter(entry)}
                type="button"
              >
                {entry === "All" ? "All" : `${entry}s`}
              </button>
            ))}
          </div>
          <div className="product-grid">
            {posItems.length ? (
              posItems.map((item) => (
                <button className="product-tile" key={item.id} onClick={() => addToCart(item)} type="button">
                  <div className="product-tile-name">{itemLabel(item)}</div>
                  <div className="product-tile-sku">{item.sku}</div>
                  <div className="product-tile-price">{formatCurrency(item.sellPrice)}</div>
                  <div className="product-tile-stock">{item.qty} in stock</div>
                </button>
              ))
            ) : (
              <div className="empty-state">
                <Icon name="packageOff" size={40} />
                <p>No items available for this filter.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <Icon className="card-icon" name="cart" size={16} />
              <span className="card-title">Current Sale</span>
            </div>

            <div>
              {cart.length ? (
                cart.map((line) => (
                  <div className="sale-item" key={line.id}>
                    <div className="sale-info">
                      <div className="sale-name">{line.name}</div>
                      <div className="sale-sku">{line.sku}</div>
                    </div>
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => changeCartQty(line.id, -1)} type="button">
                        −
                      </button>
                      <span className="qty-val">{line.qty}</span>
                      <button className="qty-btn" onClick={() => changeCartQty(line.id, 1)} type="button">
                        +
                      </button>
                    </div>
                    <div className="sale-price">{formatCurrency(line.price)}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state small">
                  <Icon name="cart" size={32} />
                  <p>Tap a product to add it to the sale.</p>
                </div>
              )}
            </div>

            <div className="pos-summary">
              <div className="pos-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="pos-row">
                <span>VAT (5%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="pos-row">
                <span>Discount</span>
                <span className="discount-inline">
                  ৳
                  <input
                    min="0"
                    onChange={(event) => setDiscount(event.target.value)}
                    type="number"
                    value={discount}
                  />
                </span>
              </div>
              <div className="pos-row total">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="pos-actions">
              <select onChange={(event) => setPaymentMethod(event.target.value)} value={paymentMethod}>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
              <input
                onChange={(event) => setCashierName(event.target.value)}
                placeholder="Employee / cashier name"
                type="text"
                value={cashierName}
              />
              <input
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Customer name (optional)"
                type="text"
                value={customerName}
              />
              <div className="dual-actions">
                <button className="btn" onClick={clearCart} type="button">
                  <Icon name="trash" size={14} />
                  Clear
                </button>
                <button className="btn primary" disabled={busy} onClick={completeSale} type="button">
                  <Icon name="check" size={14} />
                  Complete Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderProducts() {
    return (
      <>
        <div className="filter-row">
          <select
            onChange={(event) =>
              setProductFilters((current) => ({ ...current, brand: event.target.value }))
            }
            value={productFilters.brand}
          >
            <option value="">All Brands</option>
            {phoneBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
          <select
            onChange={(event) =>
              setProductFilters((current) => ({ ...current, stock: event.target.value }))
            }
            value={productFilters.stock}
          >
            <option value="">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="ok">In Stock</option>
          </select>
          <button className="btn primary" onClick={() => openCreateModal("products")} type="button">
            <Icon name="plus" size={14} />
            Add Phone
          </button>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Brand</th>
                  <th>Color/Storage</th>
                  <th>IMEI</th>
                  <th>Buy Price</th>
                  <th>Sell Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length ? (
                  filteredProducts.map((item) => (
                    <tr key={item.id}>
                      <td className="strong">{item.model}</td>
                      <td>{item.brand}</td>
                      <td>
                        <span className="tag">{item.color}</span> <span className="tag">{item.storage}</span>
                      </td>
                      <td className="muted small">{item.imei || "—"}</td>
                      <td>{formatCurrency(item.buyPrice)}</td>
                      <td className="accent-text">{formatCurrency(item.sellPrice)}</td>
                      <td>{item.qty}</td>
                      <td>
                        <StatusBadge item={item} />
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            aria-label="Edit phone"
                            className="btn icon-only"
                            onClick={() => openEditModal("products", item)}
                            title="Edit phone"
                            type="button"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            aria-label="Delete phone"
                            className="btn icon-only danger"
                            onClick={() => requestDelete("products", item)}
                            title="Delete phone"
                            type="button"
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-row" colSpan="9">
                      No phones found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  function renderAccessories() {
    return (
      <>
        <div className="filter-row">
          <select onChange={(event) => setAccessoryFilter(event.target.value)} value={accessoryFilter}>
            <option value="">All Types</option>
            {accessoryCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <button className="btn primary" onClick={() => openCreateModal("accessories")} type="button">
            <Icon name="plus" size={14} />
            Add Accessory
          </button>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Brand/Compat.</th>
                  <th>SKU</th>
                  <th>Buy Price</th>
                  <th>Sell Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredAccessories.length ? (
                  filteredAccessories.map((item) => (
                    <tr key={item.id}>
                      <td className="strong">{item.name}</td>
                      <td>
                        <span className="tag">{item.category}</span>
                      </td>
                      <td>
                        {item.brand} / {item.compat}
                      </td>
                      <td className="muted small">{item.sku}</td>
                      <td>{formatCurrency(item.buyPrice)}</td>
                      <td className="accent-text">{formatCurrency(item.sellPrice)}</td>
                      <td>{item.qty}</td>
                      <td>
                        <StatusBadge item={item} />
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            aria-label="Edit accessory"
                            className="btn icon-only"
                            onClick={() => openEditModal("accessories", item)}
                            title="Edit accessory"
                            type="button"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            aria-label="Delete accessory"
                            className="btn icon-only danger"
                            onClick={() => requestDelete("accessories", item)}
                            title="Delete accessory"
                            type="button"
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-row" colSpan="9">
                      No accessories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  function renderRepairs() {
    return (
      <>
        <div className="filter-row">
          <select onChange={(event) => setPartFilter(event.target.value)} value={partFilter}>
            <option value="">All Models</option>
            {partModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <button className="btn primary" onClick={() => openCreateModal("parts")} type="button">
            <Icon name="plus" size={14} />
            Add Part
          </button>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Part Name</th>
                  <th>Compatible Model</th>
                  <th>Quality</th>
                  <th>SKU</th>
                  <th>Buy Price</th>
                  <th>Sell Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredParts.length ? (
                  filteredParts.map((item) => (
                    <tr key={item.id}>
                      <td className="strong">{item.name}</td>
                      <td>{item.model}</td>
                      <td>
                        <span
                          className={`badge ${
                            item.quality === "Original"
                              ? "accent"
                              : item.quality === "OEM"
                                ? "neutral"
                                : "warning"
                          }`}
                        >
                          {item.quality}
                        </span>
                      </td>
                      <td className="muted small">{item.sku}</td>
                      <td>{formatCurrency(item.buyPrice)}</td>
                      <td className="accent-text">{formatCurrency(item.sellPrice)}</td>
                      <td>{item.qty}</td>
                      <td>
                        <StatusBadge item={item} />
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            aria-label="Edit repair part"
                            className="btn icon-only"
                            onClick={() => openEditModal("parts", item)}
                            title="Edit repair part"
                            type="button"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            aria-label="Delete repair part"
                            className="btn icon-only danger"
                            onClick={() => requestDelete("parts", item)}
                            title="Delete repair part"
                            type="button"
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-row" colSpan="9">
                      No repair parts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  function renderAlerts() {
    return (
      <div className="card">
        {filteredLowStock.length ? (
          filteredLowStock.map((item) => (
            <div className="alert-item" key={item.id}>
              <div className={`alert-icon ${item.qty === 0 ? "danger" : "warn"}`}>
                <Icon name="alert" size={16} />
              </div>
              <div className="alert-text">
                <div className="alert-name">
                  {itemLabel(item)} <span className="helper-inline">— {item.type}</span>
                </div>
                <div className="alert-sub">
                  SKU: {item.sku} · Current: {item.qty} · Min: {item.alert}
                </div>
              </div>
              <div>
                <StatusBadge item={item} />
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Icon name="check" size={40} />
            <p>All stock levels are healthy.</p>
          </div>
        )}
      </div>
    );
  }

  function renderSales() {
    return (
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Sold By</th>
                <th>Items</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Subtotal</th>
                <th>VAT</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length ? (
                filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="muted">{formatDateTime(sale.date)}</td>
                    <td>{sale.cashier || "—"}</td>
                    <td>{sale.items.map((item) => `${item.name} ×${item.qty}`).join(", ")}</td>
                    <td>{sale.customer || "—"}</td>
                    <td>
                      <span className="badge accent">{sale.payment}</span>
                    </td>
                    <td>{formatCurrency(sale.subtotal)}</td>
                    <td>{formatCurrency(sale.tax)}</td>
                    <td>{formatCurrency(sale.discount)}</td>
                    <td className="strong accent-text">{formatCurrency(sale.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-row" colSpan="9">
                    No sales yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderSuppliers() {
    return (
      <>
        <div className="filter-row">
          <button className="btn primary" onClick={openSupplierModal} type="button">
            <Icon name="plus" size={14} />
            Add Supplier
          </button>
        </div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Category</th>
                  <th>Address</th>
                  <th>Last Order</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length ? (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td className="strong">{supplier.name}</td>
                      <td>{supplier.phone || "—"}</td>
                      <td>
                        <span className="tag">{supplier.category}</span>
                      </td>
                      <td>{supplier.address || "—"}</td>
                      <td className="muted">{formatDate(supplier.lastOrder)}</td>
                      <td>
                        <span className="badge success">{supplier.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-row" colSpan="6">
                      No suppliers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  function renderCustomers() {
    return (
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Total Purchases</th>
                <th>Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="strong">{customer.name}</td>
                    <td>{customer.phone || "—"}</td>
                    <td>{formatCurrency(customer.total)}</td>
                    <td className="muted">{formatDate(customer.lastVisit)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-row" colSpan="4">
                    No customers yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderPage() {
    if (currentPage === "dashboard") {
      return renderDashboard();
    }
    if (currentPage === "pos") {
      return renderPos();
    }
    if (currentPage === "products") {
      return renderProducts();
    }
    if (currentPage === "accessories") {
      return renderAccessories();
    }
    if (currentPage === "repairs") {
      return renderRepairs();
    }
    if (currentPage === "alerts") {
      return renderAlerts();
    }
    if (currentPage === "sales") {
      return renderSales();
    }
    if (currentPage === "suppliers") {
      return renderSuppliers();
    }
    return renderCustomers();
  }

  return (
    <main className="workspace">
      <h1 className="sr-only">Mobile shop inventory and POS management system</h1>
      <div
        className={`app${isMobileViewport ? " app-mobile" : " app-desktop"}${
          !isMobileViewport && !desktopSidebarOpen ? " sidebar-collapsed" : ""
        }${isMobileViewport && mobileSidebarOpen ? " drawer-open" : ""}`}
      >
        <button
          aria-hidden={!isMobileViewport || !mobileSidebarOpen}
          className={`sidebar-overlay${isMobileViewport && mobileSidebarOpen ? " open" : ""}`}
          onClick={closeSidebarDrawer}
          tabIndex={isMobileViewport && mobileSidebarOpen ? 0 : -1}
          type="button"
        />
        <aside
          aria-hidden={isMobileViewport ? !mobileSidebarOpen : false}
          className={`sidebar${!isMobileViewport && !desktopSidebarOpen ? " collapsed" : ""}${
            isMobileViewport ? ` drawer${mobileSidebarOpen ? " mobile-open" : ""}` : ""
          }`}
        >
          <div className="logo">
            <div className="brand-row">
              <div className="brand-icon">
                <Icon name="mobile" size={16} />
              </div>
              <div className="brand-copy">
                <div className="logo-title">MobilePoint</div>
                <div className="logo-sub">Inventory &amp; POS</div>
              </div>
            </div>
          </div>

          <nav className="nav">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <div className="nav-section">{section.title}</div>
                {section.items.map((item) => (
                  <button
                    className={`nav-item${currentPage === item.id ? " active" : ""}`}
                    key={item.id}
                    onClick={() => navigateToPage(item.id, { clearSearch: true })}
                    title={item.label}
                    type="button"
                  >
                    <Icon name={item.icon} size={16} />
                    <span className="nav-label">{item.label}</span>
                    {item.showBadge ? <span className="nav-badge warn">{data.dashboard.lowStockCount}</span> : null}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="nav-item" title="Settings" type="button">
              <Icon name="settings" size={16} />
              <span className="nav-label">Settings</span>
            </button>
          </div>
        </aside>

        <section className="main">
          <header className="topbar">
            <div className="topbar-leading">
              <button
                aria-expanded={sidebarOpen}
                aria-label={sidebarStateLabel}
                className={`drawer-toggle${sidebarOpen ? " is-open" : ""}`}
                onClick={toggleSidebar}
                type="button"
              >
                <Icon name={isMobileViewport && mobileSidebarOpen ? "close" : "menu"} size={18} />
              </button>
              <div className="topbar-title">{getTitleForPage(currentPage)}</div>
            </div>
            <div className="topbar-actions">
              {currentPage === "dashboard" ? (
                <div className={`live-pill ${streamConnected ? "online" : "offline"}`}>
                  <span className="live-dot" />
                  {streamConnected ? "Live sale alerts" : "Connecting alerts"}
                </div>
              ) : null}
              {currentPage === "dashboard" ? (
                <div className="notification-chip">
                  <Icon name="bell" size={14} />
                  <span>{data.notifications.length}</span>
                </div>
              ) : null}
              <div className="search-wrap">
                <Icon className="search-icon" name="search" size={15} />
                <input
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search inventory..."
                  type="text"
                  value={search}
                />
                {search.trim() && searchResults.length ? (
                  <div className="search-results">
                    {searchResults.map((item) => (
                      <button
                        className="search-result"
                        key={`${item.collection}-${item.id}`}
                        onClick={() =>
                          navigateToPage(collectionToPage(item.collection), { clearSearch: true })
                        }
                        type="button"
                      >
                        <span className="strong">{itemLabel(item)}</span>
                        <span className="muted small">
                          {item.type} · {item.sku}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button className="btn" onClick={openPrimaryModal} type="button">
                <Icon name="plus" size={14} />
                Add Item
              </button>
              <button className="btn primary" onClick={() => navigateToPage("pos")} type="button">
                <Icon name="receipt" size={14} />
                New Sale
              </button>
            </div>
          </header>

          <div className="content">
            {error ? (
              <div className="error-banner">
                <Icon name="alert" size={16} />
                <span>{error}</span>
              </div>
            ) : null}

            {loading ? (
              <div className="loading-panel">
                <div className="spinner" />
                <p>Loading inventory workspace...</p>
              </div>
            ) : (
              renderPage()
            )}
          </div>
        </section>
      </div>

      {currentPage === "dashboard" && liveNotification ? (
        <div className="notification-toast" role="status">
          <div className="notification-toast-icon">
            <Icon name="bell" size={16} />
          </div>
          <div className="notification-toast-copy">
            <NotificationSummary notification={liveNotification} />
          </div>
        </div>
      ) : null}

      <Modal
        footer={
          <>
            <button className="btn" onClick={closeModal} type="button">
              Cancel
            </button>
            <button className="btn primary" disabled={busy} form="product-form" type="submit">
              {isEditingProduct ? "Update Phone" : "Add Phone"}
            </button>
          </>
        }
        onClose={closeModal}
        open={modal === "product"}
        title={isEditingProduct ? "Update Phone" : "Add Phone"}
      >
        <form className="form-grid" id="product-form" onSubmit={submitProduct}>
          <FormField label="Brand">
            <select
              onChange={(event) => setProductForm((current) => ({ ...current, brand: event.target.value }))}
              value={productForm.brand}
            >
              {PHONE_BRANDS.map((brand) => (
                <option key={brand}>{brand}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Model">
            <input
              onChange={(event) => setProductForm((current) => ({ ...current, model: event.target.value }))}
              placeholder="Galaxy A55"
              required
              type="text"
              value={productForm.model}
            />
          </FormField>
          <FormField label="Color">
            <input
              onChange={(event) => setProductForm((current) => ({ ...current, color: event.target.value }))}
              placeholder="Midnight Black"
              type="text"
              value={productForm.color}
            />
          </FormField>
          <FormField label="Storage">
            <select
              onChange={(event) => setProductForm((current) => ({ ...current, storage: event.target.value }))}
              value={productForm.storage}
            >
              {PHONE_STORAGES.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          </FormField>
          <FormField label="IMEI (optional)">
            <input
              onChange={(event) => setProductForm((current) => ({ ...current, imei: event.target.value }))}
              placeholder="359876543210987"
              type="text"
              value={productForm.imei}
            />
          </FormField>
          <FormField label="Buy Price (৳)">
            <input
              min="0"
              onChange={(event) => setProductForm((current) => ({ ...current, buyPrice: event.target.value }))}
              placeholder="0"
              type="number"
              value={productForm.buyPrice}
            />
          </FormField>
          <FormField label="Sell Price (৳)">
            <input
              min="0"
              onChange={(event) => setProductForm((current) => ({ ...current, sellPrice: event.target.value }))}
              placeholder="0"
              type="number"
              value={productForm.sellPrice}
            />
          </FormField>
          <FormField label="Stock Qty">
            <input
              min="0"
              onChange={(event) => setProductForm((current) => ({ ...current, qty: event.target.value }))}
              type="number"
              value={productForm.qty}
            />
          </FormField>
          <FormField label="Low Stock Alert">
            <input
              min="0"
              onChange={(event) => setProductForm((current) => ({ ...current, alert: event.target.value }))}
              type="number"
              value={productForm.alert}
            />
          </FormField>
        </form>
      </Modal>

      <Modal
        footer={
          <>
            <button className="btn" onClick={closeModal} type="button">
              Cancel
            </button>
            <button className="btn primary" disabled={busy} form="accessory-form" type="submit">
              {isEditingAccessory ? "Update Accessory" : "Add Accessory"}
            </button>
          </>
        }
        onClose={closeModal}
        open={modal === "accessory"}
        title={isEditingAccessory ? "Update Accessory" : "Add Accessory"}
      >
        <form className="form-grid" id="accessory-form" onSubmit={submitAccessory}>
          <FormField label="Name">
            <input
              onChange={(event) => setAccessoryForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="USB-C Fast Charger 65W"
              required
              type="text"
              value={accessoryForm.name}
            />
          </FormField>
          <FormField label="Category">
            <select
              onChange={(event) => setAccessoryForm((current) => ({ ...current, category: event.target.value }))}
              value={accessoryForm.category}
            >
              {ACCESSORY_CATEGORIES.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Brand">
            <input
              onChange={(event) => setAccessoryForm((current) => ({ ...current, brand: event.target.value }))}
              placeholder="Anker"
              type="text"
              value={accessoryForm.brand}
            />
          </FormField>
          <FormField label="Compatible With">
            <input
              onChange={(event) => setAccessoryForm((current) => ({ ...current, compat: event.target.value }))}
              placeholder="Samsung / Universal"
              type="text"
              value={accessoryForm.compat}
            />
          </FormField>
          <FormField label="Buy Price (৳)">
            <input
              min="0"
              onChange={(event) => setAccessoryForm((current) => ({ ...current, buyPrice: event.target.value }))}
              placeholder="0"
              type="number"
              value={accessoryForm.buyPrice}
            />
          </FormField>
          <FormField label="Sell Price (৳)">
            <input
              min="0"
              onChange={(event) => setAccessoryForm((current) => ({ ...current, sellPrice: event.target.value }))}
              placeholder="0"
              type="number"
              value={accessoryForm.sellPrice}
            />
          </FormField>
          <FormField label="Stock Qty">
            <input
              min="0"
              onChange={(event) => setAccessoryForm((current) => ({ ...current, qty: event.target.value }))}
              type="number"
              value={accessoryForm.qty}
            />
          </FormField>
          <FormField label="Low Stock Alert">
            <input
              min="0"
              onChange={(event) => setAccessoryForm((current) => ({ ...current, alert: event.target.value }))}
              type="number"
              value={accessoryForm.alert}
            />
          </FormField>
        </form>
      </Modal>

      <Modal
        footer={
          <>
            <button className="btn" onClick={closeModal} type="button">
              Cancel
            </button>
            <button className="btn primary" disabled={busy} form="part-form" type="submit">
              {isEditingPart ? "Update Part" : "Add Part"}
            </button>
          </>
        }
        onClose={closeModal}
        open={modal === "part"}
        title={isEditingPart ? "Update Repair Part" : "Add Repair Part"}
      >
        <form className="form-grid" id="part-form" onSubmit={submitPart}>
          <FormField label="Part Name">
            <input
              onChange={(event) => setPartForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="LCD Display"
              required
              type="text"
              value={partForm.name}
            />
          </FormField>
          <FormField label="Compatible Model">
            <input
              onChange={(event) => setPartForm((current) => ({ ...current, model: event.target.value }))}
              placeholder="Samsung A55"
              type="text"
              value={partForm.model}
            />
          </FormField>
          <FormField label="Quality">
            <select
              onChange={(event) => setPartForm((current) => ({ ...current, quality: event.target.value }))}
              value={partForm.quality}
            >
              {PART_QUALITIES.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          </FormField>
          <FormField label="SKU">
            <input
              onChange={(event) => setPartForm((current) => ({ ...current, sku: event.target.value }))}
              placeholder="AUTO"
              type="text"
              value={partForm.sku}
            />
          </FormField>
          <FormField label="Buy Price (৳)">
            <input
              min="0"
              onChange={(event) => setPartForm((current) => ({ ...current, buyPrice: event.target.value }))}
              placeholder="0"
              type="number"
              value={partForm.buyPrice}
            />
          </FormField>
          <FormField label="Sell Price (৳)">
            <input
              min="0"
              onChange={(event) => setPartForm((current) => ({ ...current, sellPrice: event.target.value }))}
              placeholder="0"
              type="number"
              value={partForm.sellPrice}
            />
          </FormField>
          <FormField label="Stock Qty">
            <input
              min="0"
              onChange={(event) => setPartForm((current) => ({ ...current, qty: event.target.value }))}
              type="number"
              value={partForm.qty}
            />
          </FormField>
          <FormField label="Low Stock Alert">
            <input
              min="0"
              onChange={(event) => setPartForm((current) => ({ ...current, alert: event.target.value }))}
              type="number"
              value={partForm.alert}
            />
          </FormField>
        </form>
      </Modal>

      <Modal
        footer={
          <>
            <button className="btn" onClick={closeModal} type="button">
              Cancel
            </button>
            <button className="btn primary" disabled={busy} form="supplier-form" type="submit">
              Add Supplier
            </button>
          </>
        }
        onClose={closeModal}
        open={modal === "supplier"}
        title="Add Supplier"
      >
        <form className="form-grid" id="supplier-form" onSubmit={submitSupplier}>
          <FormField label="Supplier Name">
            <input
              onChange={(event) => setSupplierForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Dhaka Mobile Wholesale"
              required
              type="text"
              value={supplierForm.name}
            />
          </FormField>
          <FormField label="Phone">
            <input
              onChange={(event) => setSupplierForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="01711-000000"
              type="text"
              value={supplierForm.phone}
            />
          </FormField>
          <FormField label="Category">
            <select
              onChange={(event) => setSupplierForm((current) => ({ ...current, category: event.target.value }))}
              value={supplierForm.category}
            >
              {SUPPLIER_CATEGORIES.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Address">
            <input
              onChange={(event) => setSupplierForm((current) => ({ ...current, address: event.target.value }))}
              placeholder="Elephant Road, Dhaka"
              type="text"
              value={supplierForm.address}
            />
          </FormField>
        </form>
      </Modal>

      <Modal
        compact
        footer={
          <>
            <button className="btn" onClick={closeModal} type="button">
              Keep Item
            </button>
            <button className="btn danger" disabled={busy} onClick={handleDelete} type="button">
              <Icon name="trash" size={14} />
              Delete Item
            </button>
          </>
        }
        onClose={closeModal}
        open={modal === "delete-confirm" && Boolean(deleteTarget)}
        title={`Delete ${deleteTarget ? INVENTORY_LABEL_BY_COLLECTION[deleteTarget.collection] : "Item"}`}
      >
        <div className="delete-confirm">
          {deleteTarget ? (
            <>
              <div className="delete-confirm-hero">
                <div className="delete-confirm-icon">
                  <Icon name="alert" size={18} />
                </div>
                <div className="delete-confirm-copy">
                  <div className="delete-confirm-title">Remove this item from inventory?</div>
                  <p className="delete-confirm-text">
                    This action cannot be undone. The selected{" "}
                    {INVENTORY_LABEL_BY_COLLECTION[deleteTarget.collection].toLowerCase()} will be removed
                    from stock and from future sales selection immediately.
                  </p>
                </div>
              </div>
              <div className="delete-preview">
                <div className="delete-preview-name">{itemLabel(deleteTarget.item)}</div>
                <div className="delete-preview-meta">
                  {deleteTarget.item.sku || "No SKU"} · Stock {deleteTarget.item.qty}
                </div>
                <div className="delete-preview-tags">
                  <span className="tag">{INVENTORY_LABEL_BY_COLLECTION[deleteTarget.collection]}</span>
                  {deleteTarget.item.brand ? <span className="tag">{deleteTarget.item.brand}</span> : null}
                  {deleteTarget.item.category ? <span className="tag">{deleteTarget.item.category}</span> : null}
                  {deleteTarget.item.storage ? <span className="tag">{deleteTarget.item.storage}</span> : null}
                  {deleteTarget.item.quality ? <span className="tag">{deleteTarget.item.quality}</span> : null}
                </div>
                <div className="delete-preview-note">
                  Buy {formatCurrency(deleteTarget.item.buyPrice)} · Sell{" "}
                  {formatCurrency(deleteTarget.item.sellPrice)}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </Modal>

      <Modal
        compact
        footer={
          <button className="btn primary" onClick={closeModal} type="button">
            <Icon name="check" size={14} />
            Done
          </button>
        }
        onClose={closeModal}
        open={modal === "receipt" && Boolean(receipt)}
        title="Sale Receipt"
      >
        <div className="receipt-body">
          {receipt ? (
            <>
              <div className="receipt-header">
                <div className="receipt-title">MobilePoint</div>
                <div className="receipt-meta">{formatDateTime(receipt.date)}</div>
                <div className="receipt-meta">Receipt #{receipt.id}</div>
              </div>
              <div className="receipt-block">
                {receipt.items.map((item) => (
                  <div className="receipt-line" key={`${receipt.id}-${item.id}`}>
                    <span>
                      {item.name} ×{item.qty}
                    </span>
                    <span>{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="receipt-line">
                <span>Subtotal</span>
                <span>{formatCurrency(receipt.subtotal)}</span>
              </div>
              <div className="receipt-line">
                <span>VAT (5%)</span>
                <span>{formatCurrency(receipt.tax)}</span>
              </div>
              {receipt.discount ? (
                <div className="receipt-line">
                  <span>Discount</span>
                  <span>-{formatCurrency(receipt.discount)}</span>
                </div>
              ) : null}
              <div className="receipt-line total">
                <span>Total</span>
                <span>{formatCurrency(receipt.total)}</span>
              </div>
              <div className="receipt-note">
                Payment: {receipt.payment} · Sold by: {receipt.cashier}
                {receipt.customer ? ` · Customer: ${receipt.customer}` : ""}
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    </main>
  );
}
