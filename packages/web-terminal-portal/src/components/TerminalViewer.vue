<template>
  <div class="terminal-container">
    <div class="terminal-header">
      <div class="terminal-title">Web Terminal</div>
      <div class="button-container">
        <button class="button refresh-button" @click="refresh">刷新</button>
      </div>
      <div class="terminal-status-container">
        <div class="terminal-status" :class="statusClass">{{ statusText }}</div>
        <div class="terminal-latency">{{ latencyText }}</div>
      </div>
    </div>
    <div v-if="!connected" class="connection-status">
      <Loading v-if="connecting" message="正在连接终端服务器..." />
      <div v-else class="disconnected">
        <span>未连接</span>
      </div>
    </div>
    <div>
      <div ref="terminalRef" class="terminal"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Loading from '@/components/Loading.vue';
import { ref, onMounted, onUnmounted } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Frame, FrameType } from '@web-terminal/common';
import { WebSocketConnection } from '@/modules/WebSocketConnection';
import { WebSocketDataChannel } from '@/modules/WebSocketDataChannel';

const props = defineProps({
  url: {
    type: String,
    default: '/api/ws/terminal'
  }
});

const connected = ref(false);
const connecting = ref(false);
const terminalRef = ref<HTMLElement>();
const statusText = ref('连接中...');
const latencyText = ref('延迟：...ms');
const statusClass = ref('');

let terminal: Terminal;
let fitAddon: FitAddon;
let connection: WebSocketConnection;
let channel: WebSocketDataChannel;

// ====== 终端事件处理 ======
const onData = (data: string) => {
  channel._send(FrameType.TERMINAL_DATA, data);
};

const onPaste = (event: ClipboardEvent) => {
  if (event.clipboardData) {
    const text = event.clipboardData.getData('text');
    console.log(text);
    terminal.write(text);
  }
};

const onResize = () => {
  fitAddon.fit();
};

const initTerminal = () => {
  terminal = new Terminal({
    theme: {
      background: '#1e1e1e',
      foreground: '#ffffff',
      cursor: '#ffffff'
    },
    fontSize: 14,
    fontFamily: "Consolas, 'Courier New', monospace",
    cursorBlink: true
  });

  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  // 监听终端输入
  terminal.onData(onData);

  if (terminalRef.value) {
    terminalRef.value.addEventListener('paste', onPaste);
    terminal.open(terminalRef.value);
    setTimeout(() => {
      fitAddon.fit();
    }, 100);
  }
  window.addEventListener('resize', onResize);
};

const destroyTerminal = () => {
  if (terminal) {
    terminal.dispose();
  }
  if (terminalRef.value) {
    terminalRef.value.removeEventListener('paste', onPaste);
  }
  window.removeEventListener('resize', onResize);
};

// ====== WebSocket 事件处理 ======

const onConnectionPong = () => {  
  latencyText.value = `延迟: ${connection.rtt}ms`;
};

const onConnectionTimeout = () => {
  console.log('连接超时');
  statusText.value = '连接超时';
  statusClass.value = 'disconnected';
  connection.reconnect(props.url);
};

// ====== 刷新终端 ======

const refresh = () => {
  // term.write("\x1b[2J\x1b[0;0H");
  terminal.reset();
  channel._send(FrameType.TERMINAL_REFRESH, '');
};

const onChannelOpen = () => {
  statusText.value = '已连接';
  statusClass.value = 'connected';
  channel._send(FrameType.TERMINAL_INIT, '');
  connected.value = true;
  connecting.value = false;
};

const onChannelClose = () => {
  console.log('数据通道已关闭');
  statusText.value = '已断开';
  statusClass.value = 'disconnected';
};

const onChannelMessage = (event: Event) => {
  const frame = (event as MessageEvent).data as Frame;
  if (frame.type === FrameType.TERMINAL_DATA) {
    const text = new TextDecoder().decode(frame.payload);
    terminal.write(text);
  }
};

const initWebSocket = () => {
  connecting.value = true;
  connection = new WebSocketConnection(props.url);
  connection.addEventListener('pong', onConnectionPong);
  connection.addEventListener('timeout', onConnectionTimeout);
  channel = connection.createDataChannel('default');
  channel.addEventListener('open', onChannelOpen);
  channel.addEventListener('close', onChannelClose);
  channel.addEventListener('message', onChannelMessage);
};

const destroyWebSocket = () => {
  if (channel) {
    channel.removeEventListener('open', onChannelOpen);
    channel.removeEventListener('close', onChannelClose);
    channel.removeEventListener('message', onChannelMessage);
  }
  if (connection) {
    connection.close();
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

<style>
/* 导入xterm.js样式 */
@import 'xterm/css/xterm.css';
</style>

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
  gap: 10px;
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

.button-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 5px;
}

.button {
  padding: 5px 10px;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  line-height: 20px;
  border: none;
  background-color: transparent;
}
.button:hover {
  background-color: #555;
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

.connection-status {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  text-align: center;
  z-index: 99;
}

.disconnected {
  color: #ccc;
}
</style>
