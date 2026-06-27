# MobilePoint Inventory

A mobile shop inventory and POS system rebuilt from `mobile_shop_inventory_system.html` using:

- Next.js for the frontend
- Node.js + Express for the backend server
- A JSON file store for simple local persistence

## Features

- Dashboard with stock KPIs, category breakdown, low-stock alerts, and recent sales
- POS checkout with tax, discount, payment method, cashier capture, customer capture, and receipt modal
- Inventory management for phones, accessories, and repair parts with edit/update support
- Supplier and customer tracking
- Low-stock monitoring
- Realtime admin sale notifications while the dashboard is open
- Search across inventory records
- Designed delete confirmation before inventory removal

## Project Structure

```text
.
├── data/store.json          # JSON-backed local database
├── server.js                # Express + Next.js custom server
├── server/
│   ├── routes.js            # REST API routes
│   └── store.js             # Store helpers and business logic
└── src/
    ├── app/
    │   ├── globals.css      # App styling
    │   ├── layout.jsx       # Next.js layout
    │   └── page.jsx         # Entry page
    └── components/
        ├── Icon.jsx         # Inline SVG icon set
        └── MobilePointApp.jsx
```

## Run Locally

Node requirement:

- Node.js `20.9.0` or newer

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the URL printed in the terminal.

If port `3000` is already in use, the app will automatically try the next available port such as `3001`.

To force a specific port:

```bash
PORT=3001 npm run dev
```

## App Routes

- `/` redirects to `/dashboard`
- `/dashboard`
- `/point-of-sale`
- `/products`
- `/accessories`
- `/repair-parts`
- `/low-stock`
- `/sales-history`
- `/suppliers`
- `/customers`

## API Endpoints

- `GET /api/health`
- `GET /api/bootstrap`
- `GET /api/notifications/stream`
- `GET /api/search?q=...`
- `POST /api/items/:collection`
- `PUT /api/items/:collection/:id`
- `DELETE /api/items/:collection/:id`
- `POST /api/suppliers`
- `POST /api/checkout`

Valid inventory collections:

- `products`
- `accessories`
- `parts`

## Notes

- Data is persisted to [data/store.json](/home/munna/DevOps/Projects/telecom-inventory/data/store.json).
- The admin dashboard listens to `/api/notifications/stream` for live sale alerts.
- This setup is intentionally lightweight, so it is easy to upgrade later to MongoDB, PostgreSQL, authentication, invoices, or multi-user support.
