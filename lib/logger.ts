type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private context: LogContext = {};

  constructor(private module: string) {}

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    // In production, you might send this to a logging service
    // For now, we'll use console methods based on level
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.module}] ${message}`;
    
    switch (level) {
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(logMessage, context || '');
        }
        break;
      case 'info':
        console.info(logMessage, context || '');
        break;
      case 'warn':
        console.warn(logMessage, context || '');
        break;
      case 'error':
        console.error(logMessage, context || '');
        break;
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    this.log('error', message, errorContext);
  }

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
    return this;
  }

  child(module: string): Logger {
    const childLogger = new Logger(`${this.module}:${module}`);
    childLogger.context = { ...this.context };
    return childLogger;
  }
}

// Factory function to create loggers
export function createLogger(module: string): Logger {
  return new Logger(module);
}

// Pre-configured loggers for common modules
export const dbLogger = createLogger('database');
export const authLogger = createLogger('auth');
export const apiLogger = createLogger('api');