import { FrameCodec, FrameType } from "@web-terminal/common";
import { WebSocketCommon } from "./WebSocketCommon";

export class WebSocketDataChannel extends WebSocketCommon implements WebSocket {
  ws: WebSocket;
  public identifier: number;

  constructor(ws: WebSocket) {
    super();
    this.ws = ws;
    this.identifier = FrameCodec.randomIdentifier();
  }

  public send(data: string | ArrayBuffer) {
    this.ws.send(data);
  }

  public close() {}

  public _send(type: FrameType, data: string | Uint8Array) {
    const frame = FrameCodec.encode(type, this.identifier, data);
    this.ws.send(frame.toBuffer());
  }

  public sendData(data: string | Uint8Array) {
    this._send(FrameType.DATA, data);
  }

  public ping() {
    this._send(FrameType.PING, FrameCodec.number2buffer(Date.now()));
  }

  set onopen(callback: (ev: Event) => any) {
    this.ws.onopen = callback.bind(this);
  }
  set onerror(callback: (ev: Event) => any) {
    this.ws.onerror = callback.bind(this);
  }
  set onclose(callback: (ev: Event) => any) {
    this.ws.onclose = callback.bind(this);
  }
  set onmessage(callback: (ev: MessageEvent) => any) {
    this.ws.onmessage = callback.bind(this);
  }
}
