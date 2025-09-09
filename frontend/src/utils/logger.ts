type LogLevel = 'log' | 'warn' | 'error';

const consoleMethods: Record<LogLevel, (msg: string) => void> = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const payload = meta ? { message, ...meta } : { message };
  const serialized = JSON.stringify({ level, ...payload });
  consoleMethods[level](serialized);
};

const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('log', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};

export default logger;
