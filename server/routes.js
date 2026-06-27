const express = require("express");
const notifications = require("./notifications");
const store = require("./store");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.get("/bootstrap", async (_req, res, next) => {
  try {
    res.json(await store.getBootstrap());
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    res.json({ results: await store.searchInventory(req.query.q) });
  } catch (error) {
    next(error);
  }
});

router.get("/notifications/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  res.write("retry: 5000\n\n");

  const unsubscribe = notifications.subscribeToSales((notification) => {
    res.write("event: sale\n");
    res.write(`data: ${JSON.stringify(notification)}\n\n`);
  });

  const heartbeat = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});

router.post("/items/:collection", async (req, res, next) => {
  try {
    const item = await store.addItem(req.params.collection, req.body);
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

router.put("/items/:collection/:id", async (req, res, next) => {
  try {
    const item = await store.updateItem(req.params.collection, req.params.id, req.body);
    res.status(200).json({ item });
  } catch (error) {
    next(error);
  }
});

router.delete("/items/:collection/:id", async (req, res, next) => {
  try {
    const deleted = await store.deleteItem(req.params.collection, req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Item not found." });
      return;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post("/suppliers", async (req, res, next) => {
  try {
    const supplier = await store.addSupplier(req.body);
    res.status(201).json({ supplier });
  } catch (error) {
    next(error);
  }
});

router.post("/checkout", async (req, res, next) => {
  try {
    const result = await store.checkout(req.body);
    notifications.publishNotification(result.notification);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
