// mock-pty.ts - 优化后的实现
import { EventEmitter } from "events";
import { IPty, IPtyForkOptions } from "./types";

export class MockPty extends EventEmitter implements IPty {
  public readonly pid: number;
  public cols: number;
  public rows: number;

  private _isDestroyed: boolean = false;
  public _dataCallbacks: Array<(data: string) => void> = [];
  private _exitCallbacks: Array<(code: number, signal?: number) => void> = [];
  private _command: string;
  private _args: string[];
  private _cwd: string;
  private _env: { [key: string]: string };

  // 新增：输入缓冲区相关
  private _inputBuffer: string = "";
  private _currentInput: string = "";
  private _isProcessing: boolean = false;
  //
  private _outputBuffer: string = "";
  private _history: string[] = [];

  constructor(command: string, args: string[], options: IPtyForkOptions) {
    super();
    this.pid = Math.floor(Math.random() * 10000) + 1000;
    this.cols = options.cols || 80;
    this.rows = options.rows || 24;
    this._command = command;
    this._args = args;
    this._cwd = options.cwd || process.cwd();
    this._env =
      options.env || ({ ...process.env } as { [key: string]: string });
    this._simulateStartup();
  }

  private _simulateStartup(): void {
    // 模拟终端启动过程
    setTimeout(() => {
      this._writeOutput(
        `MockPty: Started ${this._command} with args [${this._args.join(
          ", "
        )}]\r\n`
      );
      this._writeOutput(`Working directory: ${this._cwd}\r\n`);
      this._writePrompt();
    }, 50);
  }

  private _writeOutput(data: string): void {
    this._outputBuffer += data;
    this._flushOutput();
  }

  private _flushOutput(): void {
    if (this._outputBuffer.length > 0 && !this._isProcessing) {
      this._isProcessing = true;

      // 使用微任务来批量处理输出，避免频繁回调
      Promise.resolve().then(() => {
        this._dataCallbacks.forEach((callback) => callback(this._outputBuffer));
        if (this._outputBuffer === "\x1b[2J\x1b[0;0H") {
          this._history = [];
        } else {
          this._history.push(this._outputBuffer);
        }
        this.emit("data", this._outputBuffer);
        this._outputBuffer = "";
        this._isProcessing = false;
      });
    }
  }

  private _writePrompt(): void {
    this._writeOutput(`$ `);
  }

  private _handleCommandExecution(command: string): void {
    if (this._isDestroyed) return;

    // 显示执行的命令
    this._writeOutput(`\r\n`);

    // 处理特殊命令
    switch (command.trim()) {
      case "exit":
      case "quit":
        this.destroy(0);
        return;

      case "clear":
      case "cls":
        // 模拟清屏 - 发送 ANSI 清屏序列
        this._writeOutput("\x1b[2J\x1b[0;0H");
        break;

      case "pwd":
        this._writeOutput(`${this._cwd}\r\n`);
        break;

      case "whoami":
        this._writeOutput(`mock-user\r\n`);
        break;

      case "ls":
      case "dir":
        this._writeOutput(`file1.txt\tfile2.js\tREADME.md\tdocuments/\r\n`);
        break;

      case "echo":
        this._writeOutput(`${command.substring(5)}\r\n`);
        break;

      case "history":
        this._writeOutput(`${this._inputBuffer}\r\n`);
        break;

      case "help":
        this._writeOutput(
          `Available commands: ls, ll, pwd, whoami, echo, clear, exit, help\r\n`
        );
        break;

      default:
        if (command.startsWith("echo ")) {
          const message = command.substring(5);
          this._writeOutput(`${message}\r\n`);
        } else if (command.startsWith("cd ")) {
          const path = command.substring(3);
          this._cwd = path;
          this._writeOutput(`Changed directory to ${path}\r\n`);
        } else if (command.trim() === "") {
          // 空命令，什么都不做
        } else {
          this._writeOutput(`mockpty: command not found: ${command}\r\n`);
        }
    }

    // 显示新的提示符（如果不是退出命令）
    if (!["exit", "quit"].includes(command.trim())) {
      this._writePrompt();
    }
  }

  private _processInputData(data: string): void {
    for (const char of data) {
      this._processSingleCharacter(char);
    }
  }

  private _processSingleCharacter(char: string): void {
    // 处理控制字符
    switch (char) {
      case "\r": // 回车 (Linux/Mac)
      case "\n": // 换行
        this._handleEnter();
        return;

      case "\x7f": // 退格 (Linux/Mac)
      case "\b": // 退格 (Windows)
        this._handleBackspace();
        return;

      case "\x03": // Ctrl+C
        this._handleCtrlC();
        return;

      case "\x04": // Ctrl+D
        this._handleCtrlD();
        return;

      case "\t": // Tab
        this._handleTab();
        return;

      case "\x1b": // ESC 序列开始，暂时忽略复杂的 ANSI 序列
        return;
    }

    // 处理可打印字符
    if (char >= " " && char <= "~") {
      this._handlePrintableChar(char);
    }
  }

  private _handleEnter(): void {
    const command = this._currentInput.trim();
    this._currentInput = "";
    this._handleCommandExecution(command);
  }

  private _handleBackspace(): void {
    if (this._currentInput.length > 0) {
      // 删除最后一个字符
      this._currentInput = this._currentInput.slice(0, -1);
      // 发送退格序列：移动光标、删除字符、再移动光标
      this._writeOutput("\b \b");
    }
  }

  private _handleCtrlC(): void {
    this._writeOutput(`^C\r\n`);
    this._currentInput = "";
    this._writePrompt();
  }

  private _handleCtrlD(): void {
    if (this._currentInput.length === 0) {
      this.destroy(0);
    } else {
      // 如果不是空行，Ctrl+D 不执行任何操作
      this._writeOutput(`^D`);
    }
  }

  private _handleTab(): void {
    // 简单的 Tab 补全模拟
    const commands = [
      "ls",
      "ll",
      "pwd",
      "whoami",
      "echo",
      "clear",
      "exit",
      "help",
      "cd",
    ];
    const matches = commands.filter((cmd) =>
      cmd.startsWith(this._currentInput)
    );

    if (matches.length === 1) {
      // 唯一匹配，自动补全
      const completion = matches[0].slice(this._currentInput.length);
      this._currentInput = matches[0];
      this._writeOutput(completion);
    } else if (matches.length > 1) {
      // 多个匹配，显示所有可能
      this._writeOutput(`\r\n`);
      matches.forEach((cmd) => this._writeOutput(`${cmd}    `));
      this._writeOutput(`\r\n$ ${this._currentInput}`);
    }
    // 没有匹配则不执行任何操作
  }

  private _handlePrintableChar(char: string): void {
    this._currentInput += char;
    this._writeOutput(char);
  }

  public onData(callback: (data: string) => void): void {
    this._dataCallbacks.push(callback);
  }

  public onExit(callback: (code: number, signal?: number) => void): void {
    this._exitCallbacks.push(callback);
  }

  public write(data: string): void {
    if (this._isDestroyed) {
      console.warn("Attempted to write to destroyed pty");
      return;
    }

    this._processInputData(data);
  }

  public resize(cols: number, rows: number): void {
    if (this._isDestroyed) return;

    this.cols = cols;
    this.rows = rows;

    // 模拟终端大小改变事件
    this.emit("resize", { cols, rows });
  }

  public kill(signal?: string): void {
    this.destroy(signal === "SIGKILL" ? 137 : 1);
  }

  public destroy(code: number = 0, signal?: number): void {
    if (this._isDestroyed) return;

    this._isDestroyed = true;

    // 清理输出缓冲区
    this._flushOutput();

    // 发送退出消息
    setTimeout(() => {
      this._dataCallbacks.forEach((callback) =>
        callback(`\r\nProcess exited with code ${code}\r\n`)
      );
      this.emit("data", `\r\nProcess exited with code ${code}\r\n`);

      // 触发退出回调
      this._exitCallbacks.forEach((callback) => callback(code, signal));
      this.emit("exit", code, signal);

      // 清理
      this._dataCallbacks = [];
      this._exitCallbacks = [];
      this.removeAllListeners();
    }, 10);
  }

  // 辅助方法，用于测试
  public getCurrentInput(): string {
    return this._currentInput;
  }

  public isDestroyed(): boolean {
    return this._isDestroyed;
  }

  public getHistory(): string[] {
    return this._history;
  }
}
