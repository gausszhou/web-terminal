<template>
  <div class="network-info">
    <div class="network-speed">
      <div>⬆️ {{ state.upSpeed }} Byte/s</div>
      <div>⬇️ {{ state.downSpeed }} Byte/s</div>
    </div>
    <div class="network-state">
      <div class="network-status" :class="state.isConnected ? 'connected' : 'disconnected'">🌐 {{ state.isConnected ? '已连接' : '未连接' }}</div>
      <div>⏳ {{ state.rtt }}ms</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createNetworkInfo } from '@/modules/WebSocketConnection';
import { onMounted, onUnmounted, reactive } from 'vue';

const props = defineProps({
  connection: {
    default: () => createNetworkInfo()
  }
});

let state = reactive(createNetworkInfo());
let timer = 0;

const updateState = () => {
  state.rtt = props.connection.rtt;
  state.upBytes = props.connection.upBytes;
  state.downBytes = props.connection.downBytes;
  state.upSpeed = props.connection.upSpeed;
  state.downSpeed = props.connection.downSpeed;
  state.isConnected = props.connection.isConnected;
};

onMounted(() => {
  updateState();
  timer = setInterval(() => {
    updateState();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});

defineExpose({
  updateState
})
</script>

<style scoped>
.network-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  line-height: 16px;
}

.network-speed {
  width: 120px;
  overflow: hidden;
}

.network-state {
  width: 60px;
}

.network-status.connected {
  color: #4caf50;
}

.network-status.disconnected {
  color: #f44336;
}
</style>
