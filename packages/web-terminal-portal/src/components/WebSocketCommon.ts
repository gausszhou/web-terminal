export abstract class WebSocketCommon extends EventTarget {
  abstract ws: WebSocket;

  readonly CONNECTING = WebSocket.CONNECTING;
  readonly OPEN = WebSocket.OPEN;
  readonly CLOSING = WebSocket.CLOSING;
  readonly CLOSED = WebSocket.CLOSED;

  set binaryType(type: BinaryType) {
    this.ws.binaryType = type;
  }

  get binaryType(): BinaryType {
    return this.ws.binaryType;
  }

  get readyState(): number {
    return this.ws.readyState;
  }

  get url(): string {
    return this.ws.url;
  }

  get extensions(): string {
    return this.ws.extensions;
  }

  get protocol(): string {
    return this.ws.protocol;
  }

  get bufferedAmount(): number {
    return this.ws.bufferedAmount;
  }
}
