import { FrameCodec, FrameType } from "@web-terminal/common";
import { WebSocketConnection } from "./WebSocketConnection";

export class WebSocketDataChannel extends EventTarget implements WebSocket {
  readonly CONNECTING = WebSocket.CONNECTING;
  readonly OPEN = WebSocket.OPEN;
  readonly CLOSING = WebSocket.CLOSING;
  readonly CLOSED = WebSocket.CLOSED;

  public identifier: number;
  public label: string;
  private connection: WebSocketConnection;

  constructor(connection: WebSocketConnection, label: string) {
    super();
    this.connection = connection;
    this.identifier = FrameCodec.randomIdentifier();
    this.label = label;
  }

  set binaryType(type: BinaryType) {
    this.connection.binaryType = type;
  }

  get binaryType(): BinaryType {
    return this.connection.binaryType;
  }

  get readyState(): number {
    return this.connection.readyState;
  }

  get url(): string {
    return this.connection.url;
  }

  get extensions(): string {
    return this.connection.extensions;
  }

  get protocol(): string {
    return this.connection.protocol;
  }

  get bufferedAmount(): number {
    return this.connection.bufferedAmount;
  }

  set onopen(callback: (ev: Event) => any) {}

  set onerror(callback: (ev: Event) => any) {}

  set onclose(callback: (ev: Event) => any) {}

  set onmessage(callback: (ev: MessageEvent) => any) {}

    public send(data: string | ArrayBuffer) {
    this.connection.send(data);
  }

  public close() {
    this.connection.closeDataChannel(this.label);
  }


  /**
   * 发送数据 携带标识符
   * @param type 帧类型
   * @param data 数据
   */
  public _send(type: FrameType, data: string | Uint8Array) {
    const frame = FrameCodec.create(type, this.identifier, data);
    this.connection.send(frame.toBuffer());
  }
}
