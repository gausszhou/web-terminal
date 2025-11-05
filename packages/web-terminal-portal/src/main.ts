import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import './style.css'
import { FrameCodec, FrameType } from '@web-terminal/common'

const termContainer = document.getElementById('terminal') as HTMLElement
const statusElement = document.getElementById('status') as HTMLElement
const latencyElement = document.getElementById('latency') as HTMLElement
const appElement = document.getElementById('app') as HTMLElement
// 初始化xterm.js终端
const term = new Terminal({
    theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
    },
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    cursorBlink: true
})

// 初始化fit插件
const fitAddon = new FitAddon()
term.loadAddon(fitAddon)
// 将终端挂载到DOM元素
term.open(termContainer)
setTimeout(() => {
    fitAddon.fit()
}, 100)

const ws = new WebSocket('ws://localhost:3000/terminal')
ws.binaryType = "arraybuffer";
let lastKeepAliveTimestamp = Date.now()

// 更新连接状态
ws.onopen = () => {
    statusElement.textContent = '已连接'
    statusElement.style.color = '#4CAF50'
    lastKeepAliveTimestamp = Date.now()
    ws.send(FrameCodec.encode(FrameType.PING, FrameCodec.number2buffer(lastKeepAliveTimestamp)))
}

ws.onclose = () => {    
    statusElement.textContent = '已断开'
    statusElement.style.color = '#f44336'
}

// 监听终端输出并显示
ws.onmessage = (event: MessageEvent<ArrayBuffer>) => {
    const frame = FrameCodec.decode(new Uint8Array(event.data))
    if (frame.type === FrameType.DATA) {
        console.log("收到DATA帧:", new TextDecoder().decode(frame.payload))
        term.write(new TextDecoder().decode(frame.payload))
    } else if (frame.type === FrameType.PONG) {
        console.log("收到PONG帧:", FrameCodec.buffer2number(frame.payload))
        const latency = Date.now() - FrameCodec.buffer2number(frame.payload)
        latencyElement.textContent = `延迟: ${latency}ms`
    }
}

// 监听终端输入并发送到服务器
term.onData((data) => {
    ws.send(FrameCodec.encode(FrameType.DATA, data))    
})

setInterval(() => {
    lastKeepAliveTimestamp = Date.now()
    ws.send(FrameCodec.encode(FrameType.PING, lastKeepAliveTimestamp))
}, 5 * 1000)

// 处理粘贴事件
document.addEventListener('paste', (event) => {
    if (event.clipboardData) {
        const text = event.clipboardData.getData('text')
        term.write(text)
        ws.send(FrameCodec.encode(FrameType.DATA, text))
    }
})

appElement.style.display = 'block'
