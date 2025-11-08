import { MockPty } from "./terminal-mock-pty.js";

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
