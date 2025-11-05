import * as pty from "node-pty";
import { EventEmitter } from "node:events";

class MockProcess {

  private stringBuffer: string = "";

  emitter = new EventEmitter();

  write(data: string) {
    this.stringBuffer += data;
    this.emitter.emit("data", data);
  }

  on(event: string, callback: (data: Buffer) => void) {
    this.emitter.on(event, callback);
  }

  onData(callback: (data: Buffer) => void) {
    this.emitter.on("data", callback);
  }

  kill() {
    this.emitter.removeAllListeners("data");
  }
}

export function createTerminal() {
  if (process.platform === "win32") {
    return new MockProcess();
  } else {
    return pty.spawn("bash", [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: process.env,
    });
  }
}
