import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pino from "pino-http";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import swaggerUi from "swagger-ui-express";

// Module routes
import authRoutes from "./modules/auth/auth.route";
import {
  routePublicRouter,
  routeAdminRouter,
} from "./modules/jeepney-routes/jeepney-routes.route";
import gpsRoutes from "./modules/gps/gps.route";
import heatmapRoutes from "./modules/heatmap/heatmap.route";
import hazardRoutes from "./modules/hazards/hazards.route";
import aiRoutes from "./modules/ai/ai.route";
import usersRoutes from "./modules/users/users.route";
import terminalsRoutes from "./modules/terminals/terminals.route";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const openApiSpecPath = path.join(__dirname, "../docs/openapi.json");
let openApiSpec: Record<string, unknown> = {};

try {
  const specRaw = fs.readFileSync(openApiSpecPath, "utf8");
  openApiSpec = JSON.parse(specRaw) as Record<string, unknown>;
} catch {
  openApiSpec = {
    openapi: "3.0.3",
    info: {
      title: "CalamBiyahe API",
      version: "1.0.0",
      description:
        "OpenAPI spec could not be loaded. Please regenerate docs/openapi.json",
    },
    paths: {},
  };
}

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser(process.env.COOKIES_SECRET)); // signed cookies
app.use(pino());

// Serving uploaded images
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/health", (req, res) => {
  res.json({ success: true, message: "CalamBiyahe API is running" });
});

// API docs
app.get("/docs/openapi.json", (req, res) => {
  res.json(openApiSpec);
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/routes", routePublicRouter);
app.use("/api/v1/admin/routes", routeAdminRouter);
app.use("/api/v1/gps", gpsRoutes);
app.use("/api/v1/heatmap", heatmapRoutes);
app.use("/api/v1/hazards", hazardRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/terminals", terminalsRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
