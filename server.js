const net = require("net");
const express = require("express");
const next = require("next");
const apiRoutes = require("./server/routes");

const requestedPort = Number.parseInt(process.env.PORT || "3000", 10);
const portWasExplicitlySet = Boolean(process.env.PORT);
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

function isPortFree(port) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer();

    tester.once("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        resolve(false);
        return;
      }

      reject(error);
    });

    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port, "0.0.0.0");
  });
}

async function findAvailablePort(startPort, allowFallback) {
  let currentPort = startPort;
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (await isPortFree(currentPort)) {
      return currentPort;
    }

    if (!allowFallback) {
      throw new Error(`Port ${startPort} is already in use. Choose another PORT and try again.`);
    }

    currentPort += 1;
  }

  throw new Error(`Could not find a free port between ${startPort} and ${startPort + maxAttempts - 1}.`);
}

nextApp
  .prepare()
  .then(async () => {
    const port = await findAvailablePort(requestedPort, !portWasExplicitlySet);
    const app = express();

    app.use(express.json());
    app.use("/api", apiRoutes);
    app.use("/api", (_req, res) => {
      res.status(404).json({ error: "API route not found." });
    });

    app.use((error, _req, res, _next) => {
      const message = error instanceof Error ? error.message : "Unexpected server error.";
      const status =
        error && typeof error === "object" && typeof error.status === "number"
          ? error.status
          : /required|Unknown|not found|Not enough stock/i.test(message)
            ? 400
            : 500;

      res.status(status).json({ error: message });
    });

    app.use((req, res) => nextHandler(req, res));

    const server = app.listen(port, () => {
      if (port !== requestedPort) {
        console.log(
          `Port ${requestedPort} was busy, so MobilePoint is running at http://localhost:${port}`
        );
        return;
      }

      console.log(`MobilePoint is running at http://localhost:${port}`);
    });

    server.on("error", (error) => {
      console.error(error);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
