import { FrameCodec, FrameType } from "@web-terminal/common";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import { ConnectionManage } from "./terminal.js";

const connectionManage = new ConnectionManage();

export function useWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server });
  // WebSocket连接处理
  wss.on("connection", (ws: WebSocket, req) => {
    console.log("用户连接:", req.socket.remoteAddress);
    // 监听客户端发送的终端输入
    ws.on("message", (message: ArrayBuffer) => {
      const frame = FrameCodec.decode(message);
      console.log("收到帧:", frame);
      const terminal = connectionManage.getTerminal(frame.identifier, ws);
      const pty = terminal.pty;
      if (frame.type === FrameType.DATA) {
        const input = new TextDecoder().decode(frame.payload);
        console.log("收到DATA帧:", input);
        pty.write(input);
      } else if (frame.type === FrameType.PING) {
        // 收到PING帧，回复PONG帧
        const pingTime = FrameCodec.buffer2number(frame.payload);
        console.log("收到PING帧:", pingTime);
        const pongFrame = FrameCodec.encode(
          FrameType.PONG,
          frame.identifier,
          frame.payload
        );
        console.log("发送PONG帧:", pongFrame);
        ws.send(pongFrame.toBuffer());
      }
    });

    // 断开连接时清理资源
    ws.on("close", () => {
      console.log("用户断开连接:", req.socket.remoteAddress);
      connectionManage.removeConnection(ws);
    });
  });
}
