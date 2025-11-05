import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { io } from 'socket.io-client'

// 初始化xterm.js终端
const term = new Terminal({
    theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: '#264F78'
    },
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    cursorBlink: true
})

// 初始化fit插件
const fitAddon = new FitAddon()
term.loadAddon(fitAddon)

// 将终端挂载到DOM元素
term.open(document.getElementById('terminal'))
fitAddon.fit()

// 连接Socket.IO
const socket = io({
    path: '/socket.io'
})

let lastKeepAliveTimestamp = Date.now()

// 更新连接状态
socket.on('connect', () => {
    document.getElementById('status').textContent = '已连接'
    document.getElementById('status').style.color = '#4CAF50'
    lastKeepAliveTimestamp = Date.now()
    socket.emit('keep-alive', { timestamp: lastKeepAliveTimestamp })
})

socket.on('disconnect', () => {
    document.getElementById('status').textContent = '已断开'
    document.getElementById('status').style.color = '#f44336'
})

// 监听终端输出并显示
socket.on('terminal-output', (data) => {
    term.write(data)
})

// 监听终端输入并发送到服务器
term.onData((data) => {
    socket.emit('terminal-input', data)
})

// 监听窗口大小变化
window.addEventListener('resize', () => {
    fitAddon.fit()
    const dimensions = fitAddon.proposeDimensions()
    socket.emit('resize', {
        cols: dimensions.cols,
        rows: dimensions.rows
    })
})

socket.on('keep-alive', (data) => {
    const serverTimestamp = data.timestamp
    lastKeepAliveTimestamp = Date.now()
    const latency = lastKeepAliveTimestamp - serverTimestamp
    console.log('收到服务器保持连接信号, latency:', latency + 'ms')
    document.getElementById('latency').textContent = '延迟: ' + latency + 'ms'
})

setInterval(() => {
    lastKeepAliveTimestamp = Date.now()
    socket.emit('keep-alive', { timestamp: lastKeepAliveTimestamp })
}, 5 * 1000)

// 初始调整大小
setTimeout(() => {
    fitAddon.fit()
    const dimensions = fitAddon.proposeDimensions()
    socket.emit('resize', {
        cols: dimensions.cols,
        rows: dimensions.rows
    })
}, 100)

// 处理粘贴事件
term.element.addEventListener('paste', (event) => {
    const text = event.clipboardData.getData('text')
    term.write(text)
    socket.emit('terminal-input', text)
})