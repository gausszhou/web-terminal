// types.ts - 类型定义
export interface IPtyForkOptions {
  name?: string;
  cols?: number;
  rows?: number;
  cwd?: string;
  env?: { [key: string]: string };
  encoding?: string;
}

export interface IPty {
  readonly pid: number;
  readonly cols: number;
  readonly rows: number;
  
  onData: (callback: (data: string) => void) => void;
  onExit: (callback: (code: number, signal?: number) => void) => void;
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  kill: (signal?: string) => void;
}

export interface IPtyOpenOptions {
  cols?: number;
  rows?: number;
}