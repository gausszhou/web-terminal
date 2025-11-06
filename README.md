# Web Terminal Monorepo

基于 pnpm 管理的 monorepo 项目，包含前端门户、后端服务和公共库。

## 项目结构

```
web-terminal-monorepo/
├── packages/
│   ├── web-terminal-common/     # 公共库 (二进制数据帧格式和编解码工具)
│   │   ├── src/
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   ├── web-terminal-portal/     # 前端门户项目
│   │   ├── src/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.js
│   │   └── index.html
│   └── web-terminal-service/    # 后端服务项目
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── shells/
│   └── build.sh                # 构建脚本
├── pnpm-workspace.yaml         # pnpm 工作空间配置
├── package.json                # 根目录配置
└── README.md
```

## 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

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

## 项目说明

### @web-terminal/portal (前端门户)

- **技术栈**: Vue 3 + Vite + TypeScript + xterm.js
- **端口**: 由Vite自动分配
- **功能**: 提供 Web 终端界面，支持终端操作和实时通信
- **依赖**: 使用 `@web-terminal/common` 公共库进行数据编解码

### @web-terminal/service (后端服务)

- **技术栈**: Express + TypeScript + WebSocket (ws)
- **端口**: 由服务配置决定
- **功能**: 提供终端服务，处理 WebSocket 连接和终端操作
- **依赖**: 使用 `@web-terminal/common` 公共库进行数据编解码

### @web-terminal/common (公共库)

- **功能**: 二进制数据帧格式和编码/解码工具
- **用途**: 为前端和后端提供统一的数据通信格式
- **技术栈**: TypeScript + Vite + Vitest

## 开发指南

### 添加新包

1. 在 `packages/` 目录下创建新包
2. 在新包中创建 `package.json`，确保包名以 `@web-terminal/` 开头
3. 根目录运行 `pnpm install` 安装依赖

### 包间依赖

在 monorepo 内，包之间可以直接引用：

```json
{
  "dependencies": {
    "@web-terminal/common": "workspace:*"
  }
}
```

### 构建顺序

项目构建有依赖关系，构建脚本 `shells/build.sh` 会按以下顺序执行：

1. `web-terminal-common` (公共库，其他包依赖此包)
2. `web-terminal-portal` (前端门户)
3. `web-terminal-service` (后端服务)

### 环境变量

各项目支持的环境变量请参考各自的配置文件。建议使用 `.env.example` 作为模板创建本地环境变量文件。

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