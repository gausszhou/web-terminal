import { FrameCodec, FrameType } from "@web-terminal/common";
import WebSocket from "ws";
import { MockPty } from "./mock-pty.js";

export class Terminal {
  pty: MockPty;
  identifier: number;
  history: string[] = [];
  _dataCallbacks: ((data: string) => void)[] = [];

  constructor(identifier: number) {
    this.pty = new MockPty("bash", [], { cwd: "/root" });
    this.identifier = identifier;
    this.pty.onData(this._onData.bind(this));
    this.pty.onExit(this._onExit.bind(this));
  }
  
  init() {
    if (this.pty.getHistory().length > 0) {
      const data = this.pty.getHistory().join("");
      this._dataCallbacks.forEach((callback) => callback(data));
      return false;
    } else {
      this.refresh();
    }
  }

  cache(identifier: number) {
    this.identifier = identifier;
    this._dataCallbacks = [];
  }

  refresh() {
    this.pty = new MockPty("bash", [], { cwd: "/root" });
    this.pty.onData(this._onData.bind(this));
    this.pty.onExit(this._onExit.bind(this));
  }

  write(data: string) {
    this.pty.write(data);
  }

  kill() {
    this.pty.kill();
  }

  _onExit() {
    this._dataCallbacks.forEach((callback) => callback('exit'));
  }

  _onData(data: string) {
    this._dataCallbacks.forEach((callback) => callback(data));
  }

  onData(callback: (data: string) => void): void {
    this._dataCallbacks.push(callback);
  }
}
 const onData = (data: string,terminal: Terminal,  ws: WebSocket) => {
      const frame = FrameCodec.create(
        FrameType.TERMINAL_DATA,
        terminal.identifier,
        new TextEncoder().encode(data)
      );
      console.log(
        terminal.identifier,
        "发送 TERMINAL_DATA 帧:",
        frame.payloadLength
      );
      ws.send(frame.toBuffer());
    }


export class ConnectionManage {
  private terminals: Map<WebSocket | number, Map<number, Terminal>> = new Map();

  public removeConnection(ws: WebSocket) {
    const connection = this.terminals.get(ws);
    if (connection) {
      connection.clear();
    }
  }

  public getTerminal(terminalId: number, ws: WebSocket) {
    let connection = this.terminals.get(0);
    if (!connection) {
      connection = new Map();
      this.terminals.set(0, connection);
    }
    let terminal = connection.get(0);
    if (terminal) {
      terminal.cache(terminalId);
      terminal.onData((data: string) => onData(data, terminal!, ws));
      return terminal;
    }
    terminal = new Terminal(terminalId);
    terminal.onData((data: string) => onData(data,terminal, ws));
    connection.set(0, terminal);
    return terminal;
  }

  public terminalSize() {
    let size = 0;
    this.terminals.forEach((connection) => {
      size += connection.size;
    });
    return size;
  }
}
