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
import { ref, onMounted, onUnmounted } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { FrameCodec, FrameType } from '@web-terminal/common'

const terminalRef = ref<HTMLElement>()
const statusText = ref('连接中...')
const latencyText = ref('延迟：...ms')
const statusClass = ref('')

let term: Terminal
let fitAddon: FitAddon
let ws: WebSocket
let lastKeepAliveTimestamp = Date.now()

const initTerminal = () => {
  term = new Terminal({
    theme: {
      background: '#1e1e1e',
      foreground: '#ffffff',
      cursor: '#ffffff',
    },
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    cursorBlink: true
  })

  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  
  if (terminalRef.value) {
    term.open(terminalRef.value)
    setTimeout(() => {
      fitAddon.fit()
    }, 100)
  }
}

const initWebSocket = () => {
  ws = new WebSocket('/terminal')
  ws.binaryType = "arraybuffer"

  ws.onopen = () => {
    statusText.value = '已连接'
    statusClass.value = 'connected'
    lastKeepAliveTimestamp = Date.now()
    ws.send(FrameCodec.encode(FrameType.PING, FrameCodec.number2buffer(lastKeepAliveTimestamp)))
  }

  ws.onclose = () => {
    statusText.value = '已断开'
    statusClass.value = 'disconnected'
  }

  ws.onmessage = (event: MessageEvent<ArrayBuffer>) => {
    const frame = FrameCodec.decode(new Uint8Array(event.data))
    if (frame.type === FrameType.DATA) {
      console.log("收到DATA帧:", new TextDecoder().decode(frame.payload))
      term.write(new TextDecoder().decode(frame.payload))
    } else if (frame.type === FrameType.PONG) {
      console.log("收到PONG帧:", FrameCodec.buffer2number(frame.payload))
      const latency = Date.now() - FrameCodec.buffer2number(frame.payload)
      latencyText.value = `延迟: ${latency}ms`
    }
  }
}

const fitTerminal = () => {
    fitAddon.fit()
  }

const setupEventListeners = () => {
  // 监听终端输入
  term.onData((data) => {
    ws.send(FrameCodec.encode(FrameType.DATA, data))
  })

  // 处理粘贴事件
  if (terminalRef.value) {
    terminalRef.value.addEventListener('paste', (event) => {
      if (event.clipboardData) {
        const text = event.clipboardData.getData('text')
        console.log(text)
        term.write(text)
        ws.send(FrameCodec.encode(FrameType.DATA, text))
      }
    })
  }

  window.addEventListener('resize', fitTerminal)
}

onMounted(() => {
  initTerminal()
  initWebSocket()
  setupEventListeners()
  onUnmounted(() => {
    if (ws) {
      ws.close()
    }
    if (term) {
      term.dispose()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', fitTerminal)
})
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
  color: #4CAF50;
}

.terminal-status.disconnected {
  color: #f44336;
}

.terminal-latency {
  color: #888;
  font-size: 12px;
}


</style>