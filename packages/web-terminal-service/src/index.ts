import express from "express";
import http from "http";
import type { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { FrameCodec, FrameType } from "@web-terminal/common";
import { WebSocketServer } from "ws";
import pty from "./mock-pty.js";

// 获取当前文件的目录路径（ESM替代__dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app: Express = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, "../../web-terminal-portal/dist")));

// 根路径重定向到终端页面
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../web-terminal-portal/dist/index.html"));
});

// 健康检查端点
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// WebSocket连接处理
wss.on("connection", (ws, req) => {
  console.log("用户连接:", req.socket.remoteAddress);  
  // 创建伪终端
  const terminal = pty.spawn("bash", [], { cwd: '/root' });

  // 监听终端输出并发送给客户端
  terminal.onData((data: string | Buffer) => {
    ws.send(FrameCodec.encode(FrameType.DATA, data));
  });

  // 监听客户端发送的终端输入
  ws.on("message", (message: Uint8Array) => {
    const frame = FrameCodec.decode(message);    
    if (frame.type === FrameType.DATA) {
      const input = new TextDecoder().decode(frame.payload);
      console.log("收到DATA帧:", input);
      terminal.write(input);
    } else if (frame.type === FrameType.PING) {
      // 收到PING帧，回复PONG帧
      const pingTime = FrameCodec.buffer2number(frame.payload);
      console.log("收到PING帧:", pingTime);
      ws.send(FrameCodec.encode(FrameType.PONG, frame.payload));
    }
  });

  // 断开连接时清理资源
  ws.on("close", () => {
    console.log("用户断开连接:", req.socket.remoteAddress);
    terminal.kill();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Web终端服务运行在 http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});

export default app;