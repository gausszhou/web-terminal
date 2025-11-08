import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { Frame, FrameCodec, FrameType } from '@web-terminal/common';
import { Terminal } from './terminal/terminal.js';
import { isEcho, onEcho } from './echo/index.js';
import { isTerminal, TerminalManager } from './terminal/use-terminal.js';
import { isVncMessage, VNCManager } from './vnc/use-vnc.js';
import { VNCServerSocket } from './vnc/vnc.js';

const onTerminalInit = (frame: Frame, terminal: Terminal) => {
  // console.log(frame.identifier, '收到 TERMINAL_INIT 帧:', frame.payloadLength);
  terminal.init();
};

const onTerminalRefresh = (frame: Frame, terminal: Terminal) => {
  // console.log(frame.identifier, '收到 TERMINAL_REFRESH 帧:', frame.payloadLength);
  terminal.refresh();
};

const onTerminalData = (frame: Frame, terminal: Terminal) => {
  const input = new TextDecoder().decode(frame.payload);
  // console.log(frame.identifier, '收到 TERMINAL_DATA 帧:', frame.payloadLength);
  terminal.write(input);
};

const onVncInit = (frame: Frame, socket: VNCServerSocket) => {
  // console.log(frame.identifier, '收到 VNC_INIT 帧:', frame.payloadLength);
};

const onVncData = (frame: Frame, socket: VNCServerSocket) => {
  // console.log(frame.identifier, '收到 VNC_DATA 帧:', frame.payloadLength);
  socket.write(frame.payload);
};

export function useWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server });
  const terminalManager = new TerminalManager();
  const vncManager = new VNCManager();
  // WebSocket连接处理
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('用户连接:', req.socket.remoteAddress);

    ws.on('message', (message: ArrayBuffer) => {
      const frame = FrameCodec.decode(message);
      if (isEcho(frame)) {
        onEcho(ws, frame);
      } else if (isTerminal(frame)) {

        // 终端
        const terminal = terminalManager.getTerminal(frame.identifier, ws);
        if (frame.type === FrameType.TERMINAL_INIT) {
          onTerminalInit(frame, terminal);
        } else if (frame.type === FrameType.TERMINAL_REFRESH) {
          onTerminalRefresh(frame, terminal);
        } else if (frame.type === FrameType.TERMINAL_DATA) {
          onTerminalData(frame, terminal);
        }

      } else if (isVncMessage(frame)) {
        
        // VNC
        const vncSocket = vncManager.getVncSocket(ws, frame.identifier);
        if (frame.type === FrameType.VNC_INIT) {
          onVncInit(frame, vncSocket);
        } else if (frame.type === FrameType.VNC_DATA) {
          onVncData(frame, vncSocket);
        }

      } else {
        console.log(frame.identifier, '收到未知帧类型:', FrameType[frame.type]);
      }
    });

    ws.on('close', () => {
      console.log('用户断开连接:', req.socket.remoteAddress);
      terminalManager.removeConnection(ws);
      vncManager.removeConnection(ws);
    });
  });
}
