import cors from "cors";
import "dotenv/config";
import express, { NextFunction, type Request, Response } from "express";
import * as fs from "fs/promises";
import { createServer } from "http";
import * as path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";
import { serveStatic, setupVite } from "./vite.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [express] ${message}`);
}

async function main() {
  const app = express();

  // Basic middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: false }));

  // Logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const reqPath = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (reqPath.startsWith("/api")) {
        let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }
        log(logLine);
      }
    });

    next();
  });

  try {
    console.log("Starting server initialization...");

    // Check environment variables
    console.log("Checking for required API keys...");
    if (!process.env.OPENAI_API_KEY) {
      console.error("ERROR: OPENAI_API_KEY not found.");
      process.exit(1);
    }
    console.log("API key check complete");

    // Create required directories
    log("Creating required directories...");
    const uploadsDir = path.join(__dirname, "..", "uploads");
    const datasetsDir = path.join(__dirname, "..", "uploads", "datasets");

    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.mkdir(datasetsDir, { recursive: true });
      log("Required directories created successfully");
    } catch (err) {
      console.error("Error creating directories:", err);
      throw new Error("Failed to create required directories");
    }

    // Register API routes
    registerRoutes(app);

    // Create HTTP server
    const server = createServer(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ error: message });
    });

    // Setup static file serving or development server
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    const PORT = parseInt(process.env.PORT || "5050", 10);
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT}`);
      log(`Environment: ${app.get("env")}`);
      log(`Server URL: http://0.0.0.0:${PORT}`);
    });

    // Handle server errors
    server.on("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    });
  } catch (error) {
    console.error("Server initialization error:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.stack : String(error)
    );
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
