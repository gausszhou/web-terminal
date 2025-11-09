# Web Terminal

Web Terminal 和 Web VNC 技术调研

## 部署 VNC

```bash
docker run consol/ubuntu-xfce-vnc --help
# password vncpassword
# resolution 1280x720
docker run -d -p 5901:5901 -p 6901:6901 -e VNC_PW="vncpassword" -e VNC_RESOLUTION=1280x720 consol/ubuntu-xfce-vnc
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