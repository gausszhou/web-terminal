import { MockPty } from "@web-terminal/mockpty";

export class Terminal {
  public identifier: number;

  private pty: MockPty;

  constructor(identifier: number) {
    this.pty = new MockPty("bash", [], { cwd: "/root" });
    this.identifier = identifier;
    this.pty.onData(this.onData.bind(this));
  }
  
  init() {}

  refresh() {
    this.pty = new MockPty("bash", [], { cwd: "/root" });
    this.pty.onData(this.onData.bind(this));
  }

  write(data: string) {
    this.pty.write(data);
  }

  kill() {
    this.pty.kill();
  }

  onData(data:string): void {
    // TODO Override
  }
}
