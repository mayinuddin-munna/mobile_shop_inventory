export const DEFAULT_PAGE_ID = "dashboard";

export const PAGE_ROUTES = {
  dashboard: {
    id: "dashboard",
    slug: "dashboard",
    path: "/dashboard",
    title: "Dashboard"
  },
  pos: {
    id: "pos",
    slug: "point-of-sale",
    path: "/point-of-sale",
    title: "Point of Sale"
  },
  products: {
    id: "products",
    slug: "products",
    path: "/products",
    title: "Phones"
  },
  accessories: {
    id: "accessories",
    slug: "accessories",
    path: "/accessories",
    title: "Accessories"
  },
  repairs: {
    id: "repairs",
    slug: "repair-parts",
    path: "/repair-parts",
    title: "Repair Parts"
  },
  alerts: {
    id: "alerts",
    slug: "low-stock",
    path: "/low-stock",
    title: "Low Stock Alerts"
  },
  sales: {
    id: "sales",
    slug: "sales-history",
    path: "/sales-history",
    title: "Sales History"
  },
  suppliers: {
    id: "suppliers",
    slug: "suppliers",
    path: "/suppliers",
    title: "Suppliers"
  },
  customers: {
    id: "customers",
    slug: "customers",
    path: "/customers",
    title: "Customers"
  }
};

const PAGE_IDS_BY_SLUG = Object.values(PAGE_ROUTES).reduce((accumulator, route) => {
  accumulator[route.slug] = route.id;
  return accumulator;
}, {});

export function getPageIdFromSlug(slug) {
  return PAGE_IDS_BY_SLUG[slug] || null;
}

export function getPathForPage(pageId) {
  return PAGE_ROUTES[pageId]?.path || PAGE_ROUTES[DEFAULT_PAGE_ID].path;
}

export function getTitleForPage(pageId) {
  return PAGE_ROUTES[pageId]?.title || PAGE_ROUTES[DEFAULT_PAGE_ID].title;
}

export function getAllRouteSlugs() {
  return Object.values(PAGE_ROUTES).map((route) => route.slug);
}
