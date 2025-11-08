import { Frame, FrameCodec, FrameType } from "@web-terminal/common";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import { ConnectionManage, Terminal } from "./terminal.js";

const connectionManage = new ConnectionManage();

const onEcho = (ws: WebSocket, frame: Frame) => {
  const pingTime = FrameCodec.buffer2number(frame.payload);
  const replyType = frame.type === FrameType.PING ? FrameType.PONG : FrameType.PING;  
  console.log(frame.identifier, `收到 ${FrameType[frame.type]} 帧:`, pingTime, frame.payloadLength);
  const pongFrame = FrameCodec.create(
    replyType,
    frame.identifier,   
    frame.payload
  );
  const buffer = pongFrame.toBuffer();
  ws.send(buffer);
};

const onTerminalInit = (frame: Frame, terminal: Terminal) => {
  console.log(frame.identifier, "收到 TERMINAL_INIT 帧:", frame.payloadLength);
  terminal.init();
};

const onTerminalRefresh = (frame: Frame, terminal: Terminal) => {
  console.log(frame.identifier, "收到 TERMINAL_REFRESH 帧:", frame.payloadLength);
  terminal.refresh();
};

const onTerminalData = (frame: Frame, terminal: Terminal) => {
  const input = new TextDecoder().decode(frame.payload);
  console.log(frame.identifier, "收到 TERMINAL_DATA 帧:", frame.payloadLength);
  terminal.write(input);
};

export function useWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server });
  // WebSocket连接处理
  wss.on("connection", (ws: WebSocket, req) => {
    console.log("用户连接:", req.socket.remoteAddress, connectionManage.terminalSize());
    // 监听客户端发送的终端输入
    ws.on("message", (message: ArrayBuffer) => {      
      const frame = FrameCodec.decode(message);
      const terminal = connectionManage.getTerminal(frame.identifier, ws);
      if (frame.type === FrameType.PING || frame.type === FrameType.PONG) {
        onEcho(ws, frame);
      } else if (frame.type === FrameType.TERMINAL_INIT) {
        onTerminalInit(frame, terminal);
      } else if (frame.type === FrameType.TERMINAL_REFRESH) {
        onTerminalRefresh(frame, terminal);
      } else if (frame.type === FrameType.TERMINAL_DATA) {
        onTerminalData(frame, terminal);
      }
    });

    // 断开连接时清理资源
    ws.on("close", () => {
      console.log("用户断开连接:", req.socket.remoteAddress);
      connectionManage.removeConnection(ws);
    });
  });
}
