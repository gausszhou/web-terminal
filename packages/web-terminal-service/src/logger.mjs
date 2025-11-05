// 简单的日志工具
class Logger {
  constructor(level = 'info') {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    }
    this.level = this.levels[level] || this.levels.info
  }

  log(level, message, ...args) {
    if (this.levels[level] <= this.level) {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args)
    }
  }

  error(message, ...args) {
    this.log('error', message, ...args)
  }

  warn(message, ...args) {
    this.log('warn', message, ...args)
  }

  info(message, ...args) {
    this.log('info', message, ...args)
  }

  debug(message, ...args) {
    this.log('debug', message, ...args)
  }
}

// 创建默认日志实例
export const logger = new Logger(process.env.LOG_LEVEL || 'info')

export default Logger