import express from "express";
import http from "http";
import { Server as socketIo } from "socket.io";
import * as pty from "node-pty";
import path from "path";
import { fileURLToPath } from "url";

// 获取当前文件的目录路径（ESM替代__dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new socketIo(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// 健康检查端点
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API 信息端点
app.get("/api/info", (req, res) => {
  res.json({
    name: "Web Terminal Service",
    version: "1.0.0",
    description: "Web Terminal 后端服务",
    endpoints: [
      "/health - 健康检查",
      "/api/info - 服务信息"
    ]
  });
});

// Socket.IO连接处理
io.on("connection", (socket) => {
  console.log("用户连接:", socket.id);

  // 创建伪终端
  const shell = process.platform === "win32" ? "powershell.exe" : "bash";
  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: process.cwd(),
    env: process.env,
  });

  // 监听终端输出并发送给客户端
  ptyProcess.onData((data) => {
    socket.emit("terminal-output", data);
  });

  // 监听客户端发送的终端输入
  socket.on("terminal-input", (data) => {
    ptyProcess.write(data);
  });

  // 监听终端大小变化
  socket.on("resize", (size) => {
    ptyProcess.resize(size.cols, size.rows);
  });

  // 监听保持连接信号
  socket.on("keep-alive", (data) => {
    console.log("收到用户保持连接信号:", data);
    socket.emit("keep-alive", data);
  });

  // 断开连接时清理资源
  socket.on("disconnect", () => {
    console.log("用户断开连接:", socket.id);
    ptyProcess.kill();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Web终端服务运行在 http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`API信息: http://localhost:${PORT}/api/info`);
});

export default app;