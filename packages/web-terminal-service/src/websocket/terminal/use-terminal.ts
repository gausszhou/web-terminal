import { Frame, FrameCodec, FrameType } from '@web-terminal/common';
import WebSocket from 'ws';
import { Terminal } from './terminal.js';

export const isTerminal = (frame: Frame) => {
  return frame.type === FrameType.TERMINAL_INIT || frame.type === FrameType.TERMINAL_REFRESH || frame.type === FrameType.TERMINAL_DATA;
}

export const onPtyData = (data: string, terminal: Terminal, ws: WebSocket) => {
  const frame = FrameCodec.create(FrameType.TERMINAL_DATA, terminal.identifier, new TextEncoder().encode(data));
  // console.log(terminal.identifier, '发送 TERMINAL_DATA 帧:', frame.payloadLength);
  ws.send(frame.toBuffer());
};

export class TerminalManager {
  private terminals: Map<WebSocket | number, Map<number, Terminal>> = new Map();

  public removeConnection(ws: WebSocket) {
    const connection = this.terminals.get(ws);
    if (connection) {
      connection.forEach(terminal => terminal.kill());
      connection.clear();
    }
  }

  public getTerminal(identifier: number, ws: WebSocket) {
    let connection = this.terminals.get(0);
    if (!connection) {
      connection = new Map();
      this.terminals.set(0, connection);
    }
    const terminalId = 0;
    let terminal = connection.get(terminalId);
    if (terminal) {
      terminal.cache(identifier);
      terminal.onData((data: string) => onPtyData(data, terminal!, ws));
      return terminal;
    }
    terminal = new Terminal(identifier);
    terminal.onData((data: string) => onPtyData(data, terminal, ws));
    connection.set(terminalId, terminal);
    return terminal;
  }

  public terminalSize() {
    let size = 0;
    this.terminals.forEach(connection => {
      size += connection.size;
    });
    return size;
  }
}

