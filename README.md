# Telecom Store Inventory Management Web App

Simple full-stack inventory app for a telecom store, built as two separate projects:

- `frontend/` - Next.js responsive web UI
- `backend/` - Express + SQLite API

## Features

- Add new products with name, barcode, quantity, price, category, and low-stock threshold
- Search by product name or barcode
- Use a USB barcode scanner through the main search input
- Quick `-1`, `+1`, and `+5` stock adjustment buttons
- View all inventory in a sortable table
- Highlight low-stock products
- Edit and delete products

## Tech Stack

- Frontend: Next.js App Router + TypeScript
- Backend: Node.js + Express
- Database: SQLite

## Project Structure

```text
Telecom/
├── backend/
│   ├── package.json
│   └── src/
├── frontend/
│   ├── app/
│   ├── lib/
│   ├── types/
│   └── package.json
└── README.md
```

## Run Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs by default on `http://localhost:4000`.

## Run Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Frontend runs by default on `http://localhost:3000`.

## API Endpoints

- `GET /api/health`
- `GET /api/products?query=&sort=&lowStockOnly=&threshold=`
- `POST /api/products`
- `PATCH /api/products/:id`
- `POST /api/products/:id/adjust`
- `DELETE /api/products/:id`

## Notes

- Barcode scanner support works through the search field because most USB scanners act like a keyboard.
- Phone camera barcode scanning is not included in v1 yet, but the frontend is structured so it can be added later with a library such as `html5-qrcode`.
- Data is stored in `backend/data.sqlite`, so the same inventory can be shared by multiple devices on the same backend.
# telecom-inventory
