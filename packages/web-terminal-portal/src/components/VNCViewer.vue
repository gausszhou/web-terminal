<template>
  <div class="vnc-container">
    <!-- VNC 显示区域 -->
    <div ref="vncScreen" class="vnc-screen"></div>
    <!-- 连接状态 -->
    <div v-if="!connected" class="connection-status">
      <Loading v-if="connecting" message="正在连接 VNC 服务器..." />
      <div v-else class="disconnected">
        <span>未连接</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Loading from '@/components/Loading.vue';
import { ref, onMounted, onUnmounted } from 'vue';
import RFB from '@novnc/novnc/lib/rfb';
import { WebSocketConnection } from './WebSocketConnection';
import NoVncClient from '@novnc/novnc/lib/rfb';
import { WebSocketDataChannel } from './WebSocketDataChannel';
import { Frame, FrameCodec, FrameType } from '@web-terminal/common';

// 配置参数（使用默认值）
const props = defineProps({
  url: {
    type: String,
    default: '/ws-vnc'
  },
  reconnect: {
    type: Boolean,
    default: true
  },
  reconnectDelay: {
    type: Number,
    default: 5000
  }
});

// 响应式数据
const vncScreen = ref(null);
const connected = ref(false);
const connecting = ref(false);
let rfb: NoVncClient;
let connection: WebSocketConnection;
let channel: WebSocketDataChannel;
let ws: WebSocket;

const encode = (data: string | ArrayBuffer) => {
  const frame = FrameCodec.create(FrameType.VNC_DATA, channel.identifier, data);
  return frame.toBuffer();
};

const onChannelOpen = () => {
  console.log(channel.identifier, '数据通道打开');
  channel._send(FrameType.VNC_INIT, '');
};

const onChannelMessage = (event: Event) => {
  console.log(channel.identifier, '收到数据通道消息');
};

// 连接 VNC
const connect = () => {
  if (!vncScreen.value) return;
  connecting.value = true;
  ws = new WebSocket('/ws-8080');

  connection = new WebSocketConnection(props.url);
  channel = connection.createDataChannel('vnc');
  channel.encode = encode;
  // channel.decode = decode;
  channel.addEventListener('open', onChannelOpen);
  channel.addEventListener('message', onChannelMessage);
  try {
    rfb = new RFB(vncScreen.value, channel, {
      credentials: {
        username: 'gauss',
        password: 'abc123456',
        target: 'web-terminal'
      }
    });
    // 事件监听
    rfb.addEventListener('connect', onConnect);
    rfb.addEventListener('disconnect', onDisconnect);
    rfb.addEventListener('credentialsrequired', onCredentialsRequired);
    rfb.addEventListener('securityfailure', onSecurityFailure);
    rfb.addEventListener('desktopname', onDesktopName);
  } catch (error) {
    console.error('VNC 连接失败:', error);
    connecting.value = false;
  }
};

// 事件处理函数
const onConnect = () => {
  console.log('VNC 连接成功');
  connected.value = true;
  connecting.value = false;
};

const onDisconnect = () => {
  console.log('VNC 连接断开');
  connected.value = false;
  connecting.value = false;
};

const onCredentialsRequired = (event: CustomEvent) => {
  console.log('需要认证:', event.detail);
  // 如果需要密码但未提供，可以在这里处理
};

const onSecurityFailure = (event: CustomEvent) => {
  console.error('安全认证失败:', event.detail);
  connecting.value = false;
};

const onDesktopName = (event: CustomEvent) => {
  console.log('桌面名称:', event.detail.name);
};

// 发送 Ctrl+Alt+Del
const sendCtrlAltDel = () => {
  if (rfb && connected.value) {
    rfb.sendCtrlAltDel();
  }
};

// 组件挂载时连接
onMounted(() => {
  connect();
});

// 组件卸载时断开连接
onUnmounted(() => {
  if (rfb) {
    rfb.disconnect();
  }
  if (channel) {
    channel.close();
  }
  if (connection) {
    connection.close();
  }
});

// 暴露方法给父组件
defineExpose({
  sendCtrlAltDel,
  reconnect: connect,
  disconnect: () => {
    if (rfb) {
      rfb.disconnect();
    }
  }
});
</script>

<style scoped>
.vnc-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
}

.vnc-screen {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.connection-status {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  text-align: center;
}

.disconnected {
  color: #ccc;
}
</style>
