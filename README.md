# Web Terminal

Web Terminal 和 Web VNC 技术调研

## 部署 VNC

```bash
docker run --rm -p 6080:6080 -p 5901:5901 \
consol/ubuntu-xfce-vnc \
bash -c "x11vnc -create -forever -nopw -display :1 & websockify --web /usr/share/novnc/ 6080 localhost:5901"
```

## 开发

### 安装依赖

```bash
# 安装所有依赖
pnpm install
```

### 开发模式

```bash
# 分别启动服务
pnpm dev:portal    # 启动前端门户 (端口由Vite自动分配)
pnpm dev:service   # 启动后端服务 (端口由服务配置决定)
```

### 生产构建

```bash
# 构建所有项目
pnpm build

# 构建脚本会依次构建：
# 1. web-terminal-common (公共库)
# 2. web-terminal-portal (前端门户)
# 3. web-terminal-service (后端服务)
```

### 启动服务

```bash
# 启动后端服务
pnpm start
```

### 其他命令

```bash
# 代码检查
pnpm lint

# 清理构建产物
pnpm clean
```

## 许可证

MIT License