import { FrameCodec, FrameType } from "@web-terminal/common";
import WebSocket from "ws";
import { MockPty } from "./mock-pty.js";

class Terminal {
  pty: MockPty;
  identifier: number;

  constructor(terminal: MockPty, identifier: number) {
    this.pty = terminal;
    this.identifier = identifier;
  }

  onData(data: string) {
    this.pty.write(data);
  }

  kill() {
    this.pty.kill();
  }
}

export class ConnectionManage {
  private terminals: Map<WebSocket, Map<number, Terminal>> = new Map();

  public removeConnection(ws: WebSocket) {
    const connection = this.terminals.get(ws);
    if (connection) {
      connection.clear();
    }
  }

  public getTerminal(terminalId: number, ws: WebSocket) {
    let connection = this.terminals.get(ws);
    if (!connection) {
      connection = new Map();
      this.terminals.set(ws, connection);
    }
    let terminal = connection.get(terminalId);
    if (terminal) {
      return terminal;
    }
    const pty = new MockPty("bash", [], { cwd: "/root" });
    // 监听终端输出并发送给客户端
    pty.onData((data: string) => {
      ws.send(FrameCodec.encode(FrameType.DATA, terminalId, new TextEncoder().encode(data)).toBuffer());
    });
    terminal = new Terminal(pty, terminalId);
    connection.set(terminalId, terminal);
    return terminal;
  }
}
