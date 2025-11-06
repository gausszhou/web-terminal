import { FrameCodec, FrameType } from "@web-terminal/common";
import { WebSocketDataChannel } from "./WebSocketDataChannel";
import { WebSocketCommon } from "./WebSocketCommon";

export class WebSocketConnection extends WebSocketCommon implements WebSocket {
  ws: WebSocket;
  private identifier: number;
  private dataChannels: Map<string, WebSocketDataChannel> = new Map();
  private dataChannelIdentifiers: Map<number, string> = new Map();

  private heartbeatChannel: WebSocketDataChannel;
  private keepAliveInterval: number = 0;
  private _rtt: number = 0;

  constructor(url: string, protocol?: string) {
    super();
    this.ws = this.createWebSocket(url, protocol);
    this.identifier = FrameCodec.randomIdentifier();
    // 注册心跳通道
    this.heartbeatChannel = this.createDataChannel("heartbeat");
    this.heartbeatChannel.addEventListener("message", (ev: Event) => {
      const frame = ev as MessageEvent;
      if (frame.data.type === FrameType.PONG) {
        const pongAt = Date.now();
        const pingAt = FrameCodec.buffer2number(frame.data.payload);
        const rtt = pongAt - pingAt;
        this._rtt = rtt;
        const event = new MessageEvent("pong", { data: frame });
        this.dispatchEvent(event);
        this.getAllDataChannels().forEach((channel) => {
          channel.dispatchEvent(event);
        });
      }
    });
  }

  get rtt(): number {
    return this._rtt;
  }

  set onopen(callback: (ev: Event) => any) {
    this.ws.onopen = (ev) => {
      this.startKeepAlive();
      const event = new Event("open", {});
      this.dispatchEvent(event);
      this.getAllDataChannels().forEach((channel) => {
        channel.dispatchEvent(event);
      });
      callback(ev);
    };
  }

  send(data: string | ArrayBuffer) {
    this._send(FrameType.DATA, data);
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

  public _send(opcode: FrameType, data: string | ArrayBuffer) {
    const frame = FrameCodec.encode(opcode, this.identifier, data);
    this.ws.send(frame.toBuffer());
  }

  public close() {
    this.clearDataChannels();
    this.stopKeepAlive();
    this.ws.close();
  }

  private startKeepAlive() {
    this.heartbeatChannel.ping();
    this.keepAliveInterval = setInterval(() => {
      this.heartbeatChannel.ping();
    }, 5000);
  }

  private stopKeepAlive() {
    clearInterval(this.keepAliveInterval);
  }

  private _onOpen() {
    this.startKeepAlive();
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
    dataChannel = new WebSocketDataChannel(this.ws);
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
