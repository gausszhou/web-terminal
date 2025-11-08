import type { Express } from "express";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

import { useWebSocket } from "./websocket/index.js";

// 获取当前文件的目录路径（ESM替代__dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, "../../web-terminal-portal/dist")));

// 根路径重定向到终端页面
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../web-terminal-portal/dist/index.html"));
});

app.get("/vnc", (req, res) => {
  res.sendFile(path.join(__dirname, "../../web-terminal-portal/dist/index.html"));
});

// 健康检查端点
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

useWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Web终端服务运行在 http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});

export default app;