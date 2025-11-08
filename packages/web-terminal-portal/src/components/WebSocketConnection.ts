import { Frame, FrameCodec, FrameType } from "@web-terminal/common";
import { WebSocketDataChannel } from "./WebSocketDataChannel";
import { WebSocketCommon } from "./WebSocketCommon";

export class WebSocketConnection extends WebSocketCommon implements WebSocket {
  ws: WebSocket;
  private identifier: number;
  private dataChannels: Map<string, WebSocketDataChannel> = new Map();
  private dataChannelIdentifiers: Map<number, string> = new Map();

  private keepAliveInterval: number = 0;
  private _lastPongTime: number = 0;
  private _rtt: number = 0;

  constructor(url: string, protocol?: string) {
    super();
    this.ws = this.createWebSocket(url, protocol);
    this.identifier = FrameCodec.randomIdentifier();
    this.addEventListener("message", async (ev) => {
      const frame = (ev as MessageEvent).data as Frame;
      if (frame.type === FrameType.PONG) {
        this._onPong(frame);
      }
    });
  }

  get rtt(): number {
    return this._rtt;
  }

  set onopen(callback: (ev: Event) => any) {
    this.ws.onopen = (ev) => {
      this._startKeepAlive();
      const event = new Event("open", {});
      this.dispatchEvent(event);
      this.getAllDataChannels().forEach((channel) => {
        channel.dispatchEvent(event);
      });
      callback(ev);
    };
  }

  set onmessage(callback: (ev: MessageEvent) => any) {
    this.ws.onmessage = (ev) => {
      this._onMessage(ev);
      callback(ev);
    };
  }

  set onerror(callback: (ev: Event) => any) {
    this.ws.onerror = callback;
  }

  set onclose(callback: (ev: CloseEvent) => any) {
    this.ws.onclose = callback;
  }

  public send(data: string | ArrayBuffer) {
    this.ws.send(data);
  }

  public close() {
    this.clearDataChannels();
    this._stopKeepAlive();
    this.ws.close();
  }

  public reconnect(url: string, protocol?: string) {
    console.log("重新连接到:", url, protocol);
    this.ws = this.createWebSocket(url, protocol);
    this.identifier = FrameCodec.randomIdentifier();
  }

  // === 自定义方法 ===
  public _send(
    opcode: FrameType,
    data: string | number | ArrayBuffer | Uint8Array
  ) {
    if (this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }
    const frame = FrameCodec.create(opcode, this.identifier, data);
    console.log(frame.identifier, "发送数据:", frame.payload);
    this.ws.send(frame.toBuffer());
  }

  private _onOpen() {
    this._startKeepAlive();
    const event = new Event("open", {});
    this.dispatchEvent(event);
    this.getAllDataChannels().forEach((channel) => {
      channel.dispatchEvent(event);
    });
  }

  /**
   * 处理收到的消息
   * @param ev 消息事件
   */
  private _onMessage(ev: MessageEvent) {
    const frame = FrameCodec.decode(ev.data);
    if (frame.identifier === this.identifier) {
      this.dispatchEvent(new MessageEvent("message", { data: frame }));
      return;
    }
    const dataChannel = this.getDataChannelByIdentifier(frame.identifier);
    if (dataChannel) {
      dataChannel.dispatchEvent(new MessageEvent("message", { data: frame }));
    }
  }

  private _onError() {
    const event = new Event("error", {});
    this.dispatchEvent(event);
    this.getAllDataChannels().forEach((channel) => {
      channel.dispatchEvent(event);
    });
  }

  private _onClose() {
    const event = new Event("close", {});
    this.dispatchEvent(event);
    this.getAllDataChannels().forEach((channel) => {
      channel.dispatchEvent(event);
    });
  }

  public _ping() {
    this._send(FrameType.PING, Date.now());
  }

  private _onPong(frame: Frame) {
    const pingTime = FrameCodec.buffer2number(frame.payload);
    console.log(
      frame.identifier,
      "收到 PONG 帧:",
      pingTime,
      frame.toBuffer().byteLength
    );
    this._lastPongTime = Date.now();
    this._rtt = this._lastPongTime - pingTime;
    const event = new Event("pong", {});
    this.dispatchEvent(event);
    this.getAllDataChannels().forEach((channel) => {
      channel.dispatchEvent(event);
    });
  }

  private _startKeepAlive() {
    clearInterval(this.keepAliveInterval);
    this._ping();
    this._lastPongTime = Date.now();
    this.keepAliveInterval = setInterval(() => {
      this._checkKeepAlive();
      this._ping();
    }, 5000);
  }

  /**
   * 检查是否超时
   */
  private _checkKeepAlive() {
    const interval = Date.now() - this._lastPongTime;
    if (interval > 3 * 5000) {
      const event = new Event("timeout", {});
      this.dispatchEvent(event);
      this.getAllDataChannels().forEach((channel) => {
        channel.dispatchEvent(event);
      });
    }
  }

  private _stopKeepAlive() {
    clearInterval(this.keepAliveInterval);
  }
  /**
   * 创建 WebSocket 实例
   * @param url WebSocket 服务器 URL
   * @param protocol 可选的子协议
   * @returns WebSocket 实例
   */
  private createWebSocket(url: string, protocol?: string): WebSocket {
    const ws = new WebSocket(url, protocol);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => {
      this._onOpen();
    };
    ws.onmessage = (ev) => {
      this._onMessage(ev);
    };
    ws.onerror = () => {
      this._onError();
    };
    ws.onclose = () => {
      this._onClose();
    };
    return ws;
  }

  public createDataChannel(label: string): WebSocketDataChannel {
    let dataChannel = this.dataChannels.get(label);
    if (dataChannel) {
      return dataChannel;
    }
    dataChannel = new WebSocketDataChannel(this, label);
    this.dataChannels.set(label, dataChannel);
    this.dataChannelIdentifiers.set(dataChannel.identifier, label);
    return dataChannel;
  }

  public getDataChannel(label: string): WebSocketDataChannel | undefined {
    return this.dataChannels.get(label);
  }

  public getAllDataChannels(): WebSocketDataChannel[] {
    return Array.from(this.dataChannels.values());
  }

  private getDataChannelByIdentifier(
    identifier: number
  ): WebSocketDataChannel | undefined {
    const label = this.dataChannelIdentifiers.get(identifier);
    if (label) {
      return this.dataChannels.get(label);
    }
    return undefined;
  }

  public closeDataChannel(label: string) {
    const dataChannel = this.dataChannels.get(label);
    if (dataChannel) {
      this.dataChannels.delete(label);
      this.dataChannelIdentifiers.delete(dataChannel.identifier);
    }
  }

  public clearDataChannels() {
    this.dataChannels.clear();
    this.dataChannelIdentifiers.clear();
  }
}
