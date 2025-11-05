# Web Terminal Monorepo

基于 pnpm 管理的 monorepo 项目，包含前端门户和后端服务。

## 项目结构

```
web-terminal-monorepo/
├── packages/
│   ├── web-terminal-portal/     # 前端门户项目
│   │   ├── src/
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   └── index.html
│   └── web-terminal-service/    # 后端服务项目
│       ├── src/
│       └── package.json
├── pnpm-workspace.yaml          # pnpm 工作空间配置
├── package.json                 # 根目录配置
└── README.md
```

## 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
# 安装所有依赖
pnpm install:all

# 或者分别安装
pnpm install
```

### 开发模式

```bash
# 同时启动前端和后端服务
pnpm dev

# 分别启动服务
pnpm dev:portal    # 启动前端 (端口 3001)
pnpm dev:service   # 启动后端 (端口 3000)
```

### 生产构建

```bash
# 构建所有项目
pnpm build

# 分别构建
pnpm build:portal
pnpm build:service
```

### 启动服务

```bash
# 启动所有服务
pnpm start

# 分别启动
pnpm start:portal
pnpm start:service
```

## 项目说明

### web-terminal-portal (前端门户)

- **技术栈**: Vite + xterm.js + Socket.IO Client
- **端口**: 3001
- **功能**: 提供 Web 终端界面，支持终端操作和实时通信

### web-terminal-service (后端服务)

- **技术栈**: Express + Socket.IO + node-pty
- **端口**: 3000
- **功能**: 提供终端服务，处理 Socket.IO 连接和伪终端操作

## 开发指南

### 添加新包

1. 在 `packages/` 目录下创建新包
2. 在新包中创建 `package.json`
3. 根目录运行 `pnpm install` 安装依赖

### 包间依赖

在 monorepo 内，包之间可以直接引用：

```json
{
  "dependencies": {
    "web-terminal-service": "workspace:*"
  }
}
```

### 环境变量

后端服务支持以下环境变量：

- `PORT`: 服务端口 (默认: 3000)
- `HOST`: 服务主机 (默认: localhost)
- `NODE_ENV`: 环境模式 (默认: development)
- `LOG_LEVEL`: 日志级别 (默认: info)

## 部署说明

### 开发环境

```bash
pnpm dev
```

### 生产环境

```bash
pnpm build
pnpm start
```

## 许可证

MIT License