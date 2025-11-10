import { updateSystemClipboard } from '@/utils/clipboard';
import { getLogger, log } from 'loglevel';

const logger = getLogger('RFBClipboard');
logger.setLevel('debug');

export class RFBClipboard {
  private rfb: any;
  private isConnected: boolean = false;
  private clipboardBuffer: string = '';
  unsetRFBInstance: () => void = () => {};

  constructor() {}

  // 设置 RFB 实例
  public setRFBInstance(rfb: any): void {
    this.rfb = rfb;
    this.isConnected = true;
    this.unsetRFBInstance = this.setupRFBClipboard();
  }

  // 设置 RFB 剪贴板回调
  private setupRFBClipboard(): () => void {
    if (!this.rfb) return () => {};
    // 设置剪贴板接收回调
    const onClipboard = (e: CustomEvent) => this.handleRemoteClipboard(e);
    this.rfb.addEventListener('clipboard', onClipboard);
    // 监听连接状态
    const onConnect = () => {
      this.isConnected = true;
      logger.debug('RFB connected, clipboard ready');
    };
    this.rfb.addEventListener('connect', onConnect);
    // 监听断开状态
    const onDisconnect = () => {
      this.isConnected = false;
      logger.debug('RFB disconnected, clipboard disabled');
    };
    this.rfb.addEventListener('disconnect', onDisconnect);

    return () => {
      this.rfb.removeEventListener('clipboard', onClipboard);
      this.rfb.removeEventListener('connect', onConnect);
      this.rfb.removeEventListener('disconnect', onDisconnect);
    };
  }

  // 处理远程剪贴板数据
  private handleRemoteClipboard(e: CustomEvent): void {
    const text = e.detail.text as string;
    logger.info('Received clipboard from remote:', text);
    this.clipboardBuffer = text;
    updateSystemClipboard(text);
  }

  // 发送剪贴板数据到远程
  public sendClipboardToRemote(text: string): void {
    if (!this.isConnected || !this.rfb) {
      console.warn('RFB not connected, cannot send clipboard');
      return;
    }

    try {
      this.rfb.clipboardPasteFrom(text);
      console.log('Sent clipboard to remote:', text.substring(0, 50) + '...');
    } catch (error) {
      console.error('Failed to send clipboard to remote:', error);
    }
  }

  // 手动设置剪贴板内容
  public setClipboardText(text: string): void {
    this.clipboardBuffer = text;
    updateSystemClipboard(text);
    this.sendClipboardToRemote(text);
  }

  // 获取当前剪贴板内容
  public async getClipboardText(): Promise<string> {
    try {
      if (navigator.clipboard) {
        return await navigator.clipboard.readText();
      }
    } catch (error) {
      logger.warn('Failed to read clipboard:', error);
    }
    return this.clipboardBuffer;
  }

  // 清理资源
  public destroy(): void {
    this.unsetRFBInstance();
  }
}
