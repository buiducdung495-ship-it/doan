import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createHRRouter } from "./src/backend/hr/api";

import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Security & Core Middlewares
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
    next();
  });

  app.use(express.json({ limit: "64kb" }));

  // Only the HR API is mounted; legacy E-Office endpoints stay disabled.
  app.use("/api", createHRRouter());

  // Dev server vs static production server routing
  if (process.env.NODE_ENV !== "production") {
    console.log("🚀 Running in development mode with Vite live preview...");
    const vite = await createViteServer({
      configLoader: "runner",
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Running in production mode, serving pre-built assets...");
    const distPath = path.join(process.cwd(), "dist");
    // Only browser assets are public, never server.cjs or its source map.
    app.use("/assets", express.static(path.join(distPath, "assets"), { immutable: true, maxAge: "1y" }));

    // Fallback for Single Page Application routing (React Router)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, process.env.HOST || "127.0.0.1", () => {
    console.log(
      `📡 Fullstack Server successfully bound to http://localhost:${PORT}`,
    );
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to launch Express server:", err);
  process.exitCode = 1;
});
