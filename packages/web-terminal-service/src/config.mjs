// 服务配置
export const config = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  
  terminal: {
    // 默认终端配置
    defaultShell: process.platform === "win32" ? "powershell.exe" : "bash",
    defaultCols: 80,
    defaultRows: 30,
    terminalName: "xterm-color"
  },
  
  cors: {
    // CORS配置
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
    methods: ["GET", "POST"]
  },
  
  // 环境变量配置
  env: {
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  }
}

export default config