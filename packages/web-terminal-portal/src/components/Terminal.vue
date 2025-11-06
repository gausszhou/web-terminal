<template>
  <div class="terminal-container">
    <div class="terminal-header">
      <div class="terminal-title">Web Terminal</div>
      <div class="terminal-status-container">
        <div class="terminal-status" :class="statusClass">{{ statusText }}</div>
        <div class="terminal-latency">{{ latencyText }}</div>
      </div>
    </div>
    <div ref="terminalRef" class="terminal"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { Frame, FrameCodec, FrameType } from "@web-terminal/common";
import { WebSocketConnection } from "./WebSocketConnection";
import { WebSocketDataChannel } from "./WebSocketDataChannel";

console.log(FrameCodec.validate());

const terminalRef = ref<HTMLElement>();
const statusText = ref("连接中...");
const latencyText = ref("延迟：...ms");
const statusClass = ref("");

let term: Terminal;
let fitAddon: FitAddon;
let connection: WebSocketConnection;
let channel: WebSocketDataChannel;

// ====== 终端事件处理 ======
const onData = (data: string) => {
  channel.sendData(data);
};

const onPaste = (event: ClipboardEvent) => {
  if (event.clipboardData) {
    const text = event.clipboardData.getData("text");
    console.log(text);
    term.write(text);
  }
};

const onResize = () => {
  fitAddon.fit();
};

const initTerminal = () => {
  term = new Terminal({
    theme: {
      background: "#1e1e1e",
      foreground: "#ffffff",
      cursor: "#ffffff",
    },
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    cursorBlink: true,
  });

  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  // 监听终端输入
  term.onData(onData);
  
  if (terminalRef.value) {
    terminalRef.value.addEventListener("paste", onPaste);
    term.open(terminalRef.value);
    setTimeout(() => {
      fitAddon.fit();
    }, 100);
  }
  window.addEventListener("resize", onResize);
};

const destroyTerminal = () => {
  if (term) {
    term.dispose();
  }
  if (terminalRef.value) {
    terminalRef.value.removeEventListener("paste", onPaste);
  }
  window.removeEventListener("resize", onResize);
};

// ====== WebSocket 事件处理 ======

const onChannelOpen = () => {
  statusText.value = "已连接";
  statusClass.value = "connected";
  channel.sendData('');
};

const onChannelPong = () => {
  latencyText.value = `延迟: ${connection.rtt}ms`;
}

const onChannelClose = () => {
  statusText.value = "已断开";
  statusClass.value = "disconnected";
};

const onChannelMessage = (event: Event) => {
  const frame = (event as MessageEvent).data as Frame;
  if (frame.type === FrameType.DATA) {
    console.log("收到DATA帧:", frame);
    term.write(new TextDecoder().decode(frame.payload));
  }
};

const initWebSocket = () => {
  connection = new WebSocketConnection("/terminal");
  channel = connection.createDataChannel("default");
  connection.addEventListener("pong", onChannelPong);
  channel.addEventListener("open", onChannelOpen);
  channel.addEventListener("close", onChannelClose);
  channel.addEventListener("message", onChannelMessage);
};

const destroyWebSocket = () => {
  if (connection) {
    connection.close();
  }
  if (channel) {
    channel.removeEventListener("open", onChannelOpen);
    channel.removeEventListener("close", onChannelClose);
    channel.removeEventListener("message", onChannelMessage);
  }
};

onMounted(() => {
  initTerminal();
  initWebSocket();
});

onUnmounted(() => {
  destroyTerminal();
  destroyWebSocket();
});
</script>

<style scoped>
.terminal-container {
  width: 100%;
  height: 100%;
}

.terminal-header {
  height: 40px;
  background-color: #2d2d2d;
  padding: 0px 15px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.terminal {
  padding: 10px;
  height: calc(100svh - 50px);
  height: calc(100vh - 50px);
}

.terminal-title {
  font-weight: bold;
  color: #cccccc;
}

.terminal-status-container {
  display: flex;
  align-items: center;
  gap: 5px;
}

.terminal-status {
  font-size: 12px;
}

.terminal-status.connected {
  color: #4caf50;
}

.terminal-status.disconnected {
  color: #f44336;
}

.terminal-latency {
  color: #888;
  font-size: 12px;
}
</style>
