import net from 'net';
import WebSocket from 'ws';
import { analyzeVNCMessage } from '@web-terminal/common';
import dotenv from "dotenv";
dotenv.config();


const VNC_PORT = Number(process.env.VNC_PORT) || 5900;
const VNC_HOST = process.env.VNC_HOST || 'localhost';

export function createSocket() {
  const socket = net.createConnection({
    port: VNC_PORT,
    host: VNC_HOST
  });
  return socket;
}

export class VNCServerSocket {
  private socket: net.Socket;

  identifier: number;

  constructor(ws: WebSocket, identifier: number) {
    console.log(identifier, '创建 VNC 连接');
    this.socket = createSocket();
    this.identifier = identifier;
    this.socket.on('connect', () => {
      console.log('VNC 连接成功');
    });

    this.socket.on('data', (data: Uint8Array) => {
      analyzeVNCMessage(data, 'server_to_client');
      this.onData(data);
    });

    this.socket.on('close', () => {
      console.log('VNC 连接关闭');
      ws.close();
    });

    this.socket.on('error', err => {
      console.log('VNC 连接错误:', err);
      this.socket.end();
      ws.close();
    });

    ws.on('close', () => {
      this.socket.end();
    });

    ws.on('error', () => {
      this.socket.end();
    });
  }

  createSocket() {
    const socket = net.createConnection({
      port: VNC_PORT,
      host: VNC_HOST
    });
    return socket;
  }

  onData(data:Uint8Array) {
    // TODO Override
  }

  write(data: Uint8Array) {
    analyzeVNCMessage(data as Uint8Array, 'client_to_server');
    this.socket.write(data);
  }
}
