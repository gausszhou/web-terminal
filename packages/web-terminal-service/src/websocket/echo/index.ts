import { Frame, FrameCodec, FrameType } from '@web-terminal/common';
import WebSocket from 'ws';

export const isEcho = (frame: Frame) => {
  return frame.type === FrameType.PING || frame.type === FrameType.PONG;
};

export const onEcho = (ws: WebSocket, frame: Frame) => {
  const pingTime = FrameCodec.buffer2number(frame.payload);
  const replyType = frame.type === FrameType.PING ? FrameType.PONG : FrameType.PING;
  // console.log(frame.identifier, `收到 ${FrameType[frame.type]} 帧:`, pingTime, frame.payloadLength);
  const pongFrame = FrameCodec.create(replyType, frame.identifier, frame.payload);
  const buffer = pongFrame.toBuffer();
  ws.send(buffer);
};
