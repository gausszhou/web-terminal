import { Frame, FrameCodec, FrameType } from '@web-terminal/common';
import WebSocket from 'ws';
import { VNCServerSocket } from './vnc.js';

const onVncData = (data: Uint8Array, socket: VNCServerSocket, ws: WebSocket) => {
  let payload: Uint8Array;
  if (typeof data === 'string') {
    payload = new TextEncoder().encode(data)
  } else if (data instanceof Uint8Array) {
    payload = data;
  } else {
    payload = new Uint8Array(data)
  }
  const frame = FrameCodec.create(FrameType.VNC_DATA, socket.identifier, data);
  // console.log(socket.identifier, '发送 VNC_DATA 帧:', frame.payloadLength);
  ws.send(frame.toBuffer());
};

export class VNCManager {
  private vncSockets: Map<WebSocket, Map<number, VNCServerSocket>> = new Map();

  getVncSocket(ws: WebSocket, identifier: number): VNCServerSocket {
    let map = this.vncSockets.get(ws);
    if (!map) {
      map = new Map();
      this.vncSockets.set(ws, map);
    }
    const socketId = 0; // 每个连接对应一个 VncSocket
    let vncSocket = map.get(socketId);
    if (vncSocket) {
      vncSocket.identifier = identifier;
      vncSocket.onData = data => onVncData(data, vncSocket!, ws)
      return vncSocket;
    }
    vncSocket = new VNCServerSocket(ws, identifier);
    vncSocket.onData = (data) => onVncData(data, vncSocket, ws)
    map.set(socketId, vncSocket)
    return vncSocket;
  }

  removeConnection(ws: WebSocket) {
    const map = this.vncSockets.get(ws);
    if (map) {
      map.forEach(vncSocket => vncSocket.close());
      this.vncSockets.clear();
    }
  }
}

export const  isVncMessage = (frame: Frame) => {
return frame.type === FrameType.VNC_DATA || frame.type === FrameType.VNC_INIT;
}
