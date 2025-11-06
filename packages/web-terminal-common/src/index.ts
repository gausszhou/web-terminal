/**
 * 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7
 * +---------------+--------------+
 * |   FrameType   |Payload Length|
 * +---------------+--------------+
 * |                              |
 * |         Identifier           |
 * |                              |
 * +---------------+--------------+
 * |                              |
 * |            Payload           |
 * |                              |
 * +---------------+--------------+
 */

// 不能使用 Buffer，因为 Buffer 是 Node.js 中的一个类，浏览器中没有这个类
// 使用 DataView 和 TypedArray 确保浏览器和 Node.js 行为一致

export enum FrameType {
  PING = 0x01,
  PONG = 0x02,
  DATA = 0x03,
  RESIZE = 0x04,
}

export class Frame {
  static HeaderSize = 6;

  type: FrameType;
  payloadLength: number;
  identifier: number;
  payload: Uint8Array;

  constructor(type: FrameType, identifier: number, payload: Uint8Array) {
    this.type = type;
    this.payloadLength = payload.byteLength;
    this.identifier = identifier;
    this.payload = payload;
  }

  toBuffer(): Uint8Array {
    const buffer = new Uint8Array(Frame.HeaderSize + this.payloadLength);
    const view = new DataView(buffer.buffer);
    view.setUint8(0, this.type);
    view.setUint8(1, this.payloadLength);
    view.setUint32(2, this.identifier, true);
    buffer.set(this.payload, Frame.HeaderSize);
    return buffer;
  }
}

export class FrameCodec {
  static encode(
    type: FrameType,
    identifier: number,
    data: string | number | Uint8Array | ArrayBuffer
  ): Frame {
    let playload: Uint8Array = new Uint8Array(0);
    if (typeof data === "string") {
      playload = new TextEncoder().encode(data);
    } else if (typeof data === "number") {
      playload = FrameCodec.number2buffer(data);
    } else if (data instanceof Uint8Array) {
      playload = data;
    } else if (data instanceof ArrayBuffer) {
      playload = new Uint8Array(data);
    } else {
      throw new Error("Unsupported data type for encoding");
    }
    const frame = new Frame(type, identifier, playload);
    return frame;
  }

  static decode(buf: Uint8Array): Frame {
    // 检查数据长度是否足够
    if (buf.length < Frame.HeaderSize) {
      throw new Error(
        `Data too short: expected at least ${Frame.HeaderSize} bytes, got ${buf.length}`
      );
    }

    const buffer = new Uint8Array(buf);
    const view = new DataView(buffer.buffer);
    const type = view.getUint8(0);
    const payloadLength = view.getUint8(1);
    const identifier = view.getUint32(2, true);

    // 检查payload长度是否有效
    if (buf.length < Frame.HeaderSize + payloadLength) {
      throw new Error(
        `Incomplete data: expected ${
          Frame.HeaderSize + payloadLength
        } bytes, got ${buf.length}`
      );
    }

    const payload = buffer.slice(
      Frame.HeaderSize,
      Frame.HeaderSize + payloadLength
    );

    // 验证FrameType是否有效
    if (!Object.values(FrameType).includes(type)) {
      throw new Error(`Invalid frame type: ${type}`);
    }

    const frame = new Frame(type, identifier, payload);
    return frame;
  }

  static number2buffer(number: number): Uint8Array {
    const buffer = new Uint8Array(8);
    const view = new DataView(buffer.buffer);
    view.setFloat64(0, number, true);
    return buffer;
  }

  static buffer2number(data: Uint8Array): number {
    // 检查数据长度是否足够（需要8字节来存储double）
    if (data.length < 8) {
      throw new Error(
        `Data too short for number conversion: expected 8 bytes, got ${data.length}`
      );
    }

    const buffer = new Uint8Array(data);
    const view = new DataView(buffer.buffer);
    return view.getFloat64(0, true);
  }

  static randomIdentifier(): number {
    return Math.floor(Math.random() * 0xfffffff);
  }

  static validate() {
    const time = Date.now();
    const encodedFrame = FrameCodec.encode(
      FrameType.PING,
      FrameCodec.randomIdentifier(),
      time
    );
    const decodedFrame = FrameCodec.decode(encodedFrame.toBuffer());
    return (
      decodedFrame.type === FrameType.PING &&
      decodedFrame.payloadLength === 8 &&
      FrameCodec.buffer2number(decodedFrame.payload) === time
    );
  }
}
