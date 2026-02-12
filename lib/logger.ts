type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatLog(level: LogLevel, module: string, message: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    ...(data && { data }),
  };

  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }

  // Pretty format for development
  const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${module}]`;
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `${prefix} ${message}${dataStr}`;
}

export function createLogger(module: string) {
  return {
    debug(message: string, data?: Record<string, unknown>) {
      if (shouldLog('debug')) console.debug(formatLog('debug', module, message, data));
    },
    info(message: string, data?: Record<string, unknown>) {
      if (shouldLog('info')) console.info(formatLog('info', module, message, data));
    },
    warn(message: string, data?: Record<string, unknown>) {
      if (shouldLog('warn')) console.warn(formatLog('warn', module, message, data));
    },
    error(message: string, data?: Record<string, unknown>) {
      if (shouldLog('error')) console.error(formatLog('error', module, message, data));
    },
  };
}
