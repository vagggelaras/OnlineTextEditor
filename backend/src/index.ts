import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { WebSocketServer } from "ws";
import { env } from "./config/env";
import { corsOptions } from "./config/cors";
import { errorHandler } from "./middleware/errorHandler";
import { hocuspocus } from "./services/collaboration.service";
import authRoutes from "./routes/auth.routes";
import documentRoutes from "./routes/documents.routes";
import folderRoutes from "./routes/folders.routes";
import chartRoutes from "./routes/charts.routes";
import shareRoutes from "./routes/shares.routes";
import versionRoutes from "./routes/versions.routes";
import { asyncHandler } from "./middleware/asyncHandler";
import { getSharedDocument } from "./controllers/shares.controller";

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/documents/:documentId/charts", chartRoutes);
app.use("/api/documents/:documentId/shares", shareRoutes);
app.use("/api/documents/:documentId/versions", versionRoutes);

// Public route: access shared document by token (no auth required)
app.get("/api/shared/:token", asyncHandler(getSharedDocument));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Error handling
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// WebSocket server for collaboration (no own HTTP server)
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrade requests for collaboration
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    hocuspocus.handleConnection(ws, request);
  });
});

const PORT = parseInt(env.PORT, 10);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Collaboration WebSocket ready on ws://localhost:${PORT}`);
});

export default app;
