import { Frame, FrameCodec, FrameType } from "@web-terminal/common";

describe("Frame", () => {
  describe("constructor", () => {
    it("should create a frame with correct properties", () => {
      const type = FrameType.DATA;
      const identifier = 12345;
      const payload = new Uint8Array([1, 2, 3, 4, 5]);
      
      const frame = new Frame(type, identifier, payload);
      
      expect(frame.type).toBe(type);
      expect(frame.identifier).toBe(identifier);
      expect(frame.payloadLength).toBe(payload.byteLength);
      expect(frame.payload).toEqual(payload);
    });

    it("should handle empty payload", () => {
      const frame = new Frame(FrameType.PING, 999, new Uint8Array(0));
      
      expect(frame.payloadLength).toBe(0);
      expect(frame.payload.byteLength).toBe(0);
    });
  });

  describe("toBuffer", () => {
    it("should convert frame to buffer correctly", () => {
      const type = FrameType.RESIZE;
      const identifier = 54321;
      const payload = new TextEncoder().encode("test data");
      const frame = new Frame(type, identifier, payload);
      
      const buffer = frame.toBuffer();
      
      expect(buffer.byteLength).toBe(Frame.HeaderSize + payload.byteLength);
      
      // 验证头部数据
      const view = new DataView(buffer.buffer);
      expect(view.getUint8(0)).toBe(type);
      expect(view.getUint8(1)).toBe(payload.byteLength);
      expect(view.getUint32(2, true)).toBe(identifier);
      
      // 验证负载数据
      const payloadData = buffer.slice(Frame.HeaderSize);
      expect(new TextDecoder().decode(payloadData)).toBe("test data");
    });

    it("should handle empty payload in buffer conversion", () => {
      const frame = new Frame(FrameType.PONG, 111, new Uint8Array(0));
      const buffer = frame.toBuffer();
      
      expect(buffer.byteLength).toBe(Frame.HeaderSize);
      
      const view = new DataView(buffer.buffer);
      expect(view.getUint8(0)).toBe(FrameType.PONG);
      expect(view.getUint8(1)).toBe(0);
      expect(view.getUint32(2, true)).toBe(111);
    });
  });
});

describe("FrameCodec", () => {
  describe("encode", () => {
    it("should encode string data correctly", () => {
      const type = FrameType.DATA;
      const identifier = 123;
      const data = "Hello, World!";
      
      const frame = FrameCodec.encode(type, identifier, data);
      
      expect(frame.type).toBe(type);
      expect(frame.identifier).toBe(identifier);
      expect(frame.payloadLength).toBe(new TextEncoder().encode(data).byteLength);
      expect(new TextDecoder().decode(frame.payload)).toBe(data);
    });

    it("should encode number data correctly", () => {
      const type = FrameType.PING;
      const identifier = 456;
      const data = 123.456;
      
      const frame = FrameCodec.encode(type, identifier, data);
      
      expect(frame.type).toBe(type);
      expect(frame.identifier).toBe(identifier);
      expect(frame.payloadLength).toBe(8); // double precision float
      expect(FrameCodec.buffer2number(frame.payload)).toBe(data);
    });

    it("should encode Uint8Array data correctly", () => {
      const type = FrameType.RESIZE;
      const identifier = 789;
      const data = new Uint8Array([10, 20, 30, 40, 50]);
      
      const frame = FrameCodec.encode(type, identifier, data);
      
      expect(frame.type).toBe(type);
      expect(frame.identifier).toBe(identifier);
      expect(frame.payloadLength).toBe(data.byteLength);
      expect(frame.payload).toEqual(data);
    });

    it("should encode ArrayBuffer data correctly", () => {
      const type = FrameType.DATA;
      const identifier = 999;
      const arrayBuffer = new ArrayBuffer(4);
      const view = new DataView(arrayBuffer);
      view.setUint32(0, 0x12345678, true);
      
      const frame = FrameCodec.encode(type, identifier, arrayBuffer);
      
      expect(frame.type).toBe(type);
      expect(frame.identifier).toBe(identifier);
      expect(frame.payloadLength).toBe(4);
      
      const payloadView = new DataView(frame.payload.buffer);
      expect(payloadView.getUint32(0, true)).toBe(0x12345678);
    });

    it("should throw error for unsupported data type", () => {
      expect(() => {
        FrameCodec.encode(FrameType.DATA, 123, { invalid: "object" } as any);
      }).toThrow("Unsupported data type for encoding");
    });
  });

  describe("decode", () => {
    it("should decode valid buffer correctly", () => {
      const originalFrame = FrameCodec.encode(FrameType.PONG, 555, "test message");
      const buffer = originalFrame.toBuffer();
      
      const decodedFrame = FrameCodec.decode(buffer);
      
      expect(decodedFrame.type).toBe(FrameType.PONG);
      expect(decodedFrame.identifier).toBe(555);
      expect(decodedFrame.payloadLength).toBe(12); // "test message" length
      expect(new TextDecoder().decode(decodedFrame.payload)).toBe("test message");
    });

    it("should throw error for buffer too short", () => {
      const shortBuffer = new Uint8Array([FrameType.PING, 0]); // Only 2 bytes
      
      expect(() => {
        FrameCodec.decode(shortBuffer);
      }).toThrow("Data too short: expected at least 6 bytes, got 2");
    });

    it("should throw error for incomplete payload", () => {
      // 创建头部但payload不完整的buffer
      const buffer = new Uint8Array(Frame.HeaderSize + 5); // 声明有5字节payload
      const view = new DataView(buffer.buffer);
      view.setUint8(0, FrameType.DATA);
      view.setUint8(1, 10); // 声明10字节payload，但实际只有5字节
      view.setUint32(2, 123, true);
      
      expect(() => {
        FrameCodec.decode(buffer);
      }).toThrow("Incomplete data: expected 16 bytes, got 11");
    });

    it("should throw error for invalid frame type", () => {
      const buffer = new Uint8Array(Frame.HeaderSize);
      const view = new DataView(buffer.buffer);
      view.setUint8(0, 0xFF); // 无效的帧类型
      view.setUint8(1, 0);
      view.setUint32(2, 123, true);
      
      expect(() => {
        FrameCodec.decode(buffer);
      }).toThrow("Invalid frame type: 255");
    });

    it("should handle all valid frame types", () => {
      const validTypes = [FrameType.PING, FrameType.PONG, FrameType.DATA, FrameType.RESIZE];
      
      validTypes.forEach(type => {
        const frame = FrameCodec.encode(type, 111, "test");
        const decodedFrame = FrameCodec.decode(frame.toBuffer());
        expect(decodedFrame.type).toBe(type);
      });
    });
  });

  describe("number2buffer and buffer2number", () => {
    it("should convert number to buffer and back correctly", () => {
      const testNumbers = [0, 1, -1, 123.456, -789.123, Math.PI, Number.MAX_SAFE_INTEGER];
      
      testNumbers.forEach(number => {
        const buffer = FrameCodec.number2buffer(number);
        const convertedNumber = FrameCodec.buffer2number(buffer);
        expect(convertedNumber).toBe(number);
      });
    });

    it("should throw error for buffer too short in buffer2number", () => {
      const shortBuffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7]); // 7 bytes instead of 8
      
      expect(() => {
        FrameCodec.buffer2number(shortBuffer);
      }).toThrow("Data too short for number conversion: expected 8 bytes, got 7");
    });

    it("should handle edge case numbers", () => {
      const edgeCases = [
        Number.MIN_VALUE,
        Number.MAX_VALUE,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        Number.NaN
      ];
      
      edgeCases.forEach(number => {
        const buffer = FrameCodec.number2buffer(number);
        const convertedNumber = FrameCodec.buffer2number(buffer);
        
        if (Number.isNaN(number)) {
          expect(Number.isNaN(convertedNumber)).toBe(true);
        } else {
          expect(convertedNumber).toBe(number);
        }
      });
    });
  });

  describe("randomIdentifier", () => {
    it("should generate identifiers within valid range", () => {
      const identifiers = Array.from({ length: 100 }, () => FrameCodec.randomIdentifier());
      
      identifiers.forEach(id => {
        expect(id).toBeGreaterThanOrEqual(0);
        expect(id).toBeLessThan(0xfffffff); // 小于 2^28
        expect(Number.isInteger(id)).toBe(true);
      });
    });

    it("should generate unique identifiers", () => {
      const identifiers = new Set();
      
      // 生成足够多的标识符来测试唯一性
      for (let i = 0; i < 1000; i++) {
        identifiers.add(FrameCodec.randomIdentifier());
      }
      
      // 由于是随机数，可能会有重复，但重复率应该很低
      expect(identifiers.size).toBeGreaterThan(900); // 允许少量重复
    });
  });

  describe("integration tests", () => {
    it("should encode and decode complex data correctly", () => {
      const testData = {
        string: "Hello, World! 🚀",
        number: 123.456789,
        binary: new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05])
      };
      
      // 测试字符串
      const stringFrame = FrameCodec.encode(FrameType.DATA, 1, testData.string);
      const decodedStringFrame = FrameCodec.decode(stringFrame.toBuffer());
      expect(new TextDecoder().decode(decodedStringFrame.payload)).toBe(testData.string);
      
      // 测试数字
      const numberFrame = FrameCodec.encode(FrameType.PING, 2, testData.number);
      const decodedNumberFrame = FrameCodec.decode(numberFrame.toBuffer());
      expect(FrameCodec.buffer2number(decodedNumberFrame.payload)).toBe(testData.number);
      
      // 测试二进制数据
      const binaryFrame = FrameCodec.encode(FrameType.DATA, 3, testData.binary);
      const decodedBinaryFrame = FrameCodec.decode(binaryFrame.toBuffer());
      expect(decodedBinaryFrame.payload).toEqual(testData.binary);
    });

    it("should handle round-trip encoding/decoding", () => {
      const originalData = "Round-trip test data with special chars: ñáéíóú 中文 🎉";
      const identifier = FrameCodec.randomIdentifier();
      
      const encodedFrame = FrameCodec.encode(FrameType.DATA, identifier, originalData);
      const buffer = encodedFrame.toBuffer();
      const decodedFrame = FrameCodec.decode(buffer);
      const decodedData = new TextDecoder().decode(decodedFrame.payload);
      
      expect(decodedData).toBe(originalData);
      expect(decodedFrame.type).toBe(FrameType.DATA);
      expect(decodedFrame.identifier).toBe(identifier);
    });
  });
});