import { env } from './env';

// Error severity levels
export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Error context interface
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

// Performance transaction interface
export interface Transaction {
  name: string;
  op: string;
  startTime: number;
  endTime?: number;
  status?: 'ok' | 'error' | 'cancelled';
  data?: Record<string, any>;
}

class MonitoringService {
  private initialized = false;
  private transactions: Map<string, Transaction> = new Map();
  
  // Initialize monitoring (prepare for Sentry integration)
  async initialize() {
    if (this.initialized) return;
    
    // In production, initialize Sentry here
    if (env.SENTRY_DSN && env.NODE_ENV === 'production') {
      // TODO: Initialize Sentry
      console.log('Monitoring service initialized (Sentry integration pending)');
    }
    
    this.initialized = true;
  }
  
  // Capture an exception
  captureException(
    error: Error | unknown,
    context?: ErrorContext,
    severity: ErrorSeverity = ErrorSeverity.ERROR
  ) {
    // Format error
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Log to console in development
    if (env.NODE_ENV === 'development') {
      console.error(`[${severity.toUpperCase()}]`, errorObj.message, {
        stack: errorObj.stack,
        ...context,
      });
    }
    
    // In production, send to Sentry
    if (env.SENTRY_DSN && env.NODE_ENV === 'production') {
      // TODO: Send to Sentry
      // Sentry.captureException(errorObj, {
      //   level: severity,
      //   contexts: { custom: context },
      //   tags: context?.tags,
      //   extra: context?.extra,
      // });
    }
    
    // Also log to our error logger
    this.logError(errorObj, context, severity);
  }
  
  // Capture a message
  captureMessage(
    message: string,
    severity: ErrorSeverity = ErrorSeverity.INFO,
    context?: ErrorContext
  ) {
    // Log to console in development
    if (env.NODE_ENV === 'development') {
      console.log(`[${severity.toUpperCase()}]`, message, context);
    }
    
    // In production, send to Sentry
    if (env.SENTRY_DSN && env.NODE_ENV === 'production') {
      // TODO: Send to Sentry
      // Sentry.captureMessage(message, severity);
    }
  }
  
  // Start a performance transaction
  startTransaction(name: string, op: string = 'http.server'): string {
    const transactionId = `${name}-${Date.now()}-${Math.random()}`;
    const transaction: Transaction = {
      name,
      op,
      startTime: Date.now(),
    };
    
    this.transactions.set(transactionId, transaction);
    return transactionId;
  }
  
  // Finish a performance transaction
  finishTransaction(
    transactionId: string,
    status: 'ok' | 'error' | 'cancelled' = 'ok',
    data?: Record<string, any>
  ) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;
    
    transaction.endTime = Date.now();
    transaction.status = status;
    transaction.data = data;
    
    // Log performance in development
    if (env.NODE_ENV === 'development') {
      const duration = transaction.endTime - transaction.startTime;
      console.log(`[PERF] ${transaction.name}: ${duration}ms (${status})`);
    }
    
    // In production, send to Sentry
    if (env.SENTRY_DSN && env.NODE_ENV === 'production' && env.SENTRY_TRACES_SAMPLE_RATE > 0) {
      // TODO: Send to Sentry
      // const sentryTransaction = Sentry.startTransaction({
      //   name: transaction.name,
      //   op: transaction.op,
      // });
      // sentryTransaction.finish();
    }
    
    // Clean up
    this.transactions.delete(transactionId);
  }
  
  // Set user context
  setUserContext(userId: string, email?: string, username?: string) {
    if (env.SENTRY_DSN && env.NODE_ENV === 'production') {
      // TODO: Set Sentry user context
      // Sentry.setUser({ id: userId, email, username });
    }
  }
  
  // Clear user context
  clearUserContext() {
    if (env.SENTRY_DSN && env.NODE_ENV === 'production') {
      // TODO: Clear Sentry user context
      // Sentry.setUser(null);
    }
  }
  
  // Add breadcrumb
  addBreadcrumb(
    message: string,
    category: string,
    level: ErrorSeverity = ErrorSeverity.INFO,
    data?: Record<string, any>
  ) {
    if (env.SENTRY_DSN && env.NODE_ENV === 'production') {
      // TODO: Add Sentry breadcrumb
      // Sentry.addBreadcrumb({
      //   message,
      //   category,
      //   level,
      //   data,
      //   timestamp: Date.now() / 1000,
      // });
    }
  }
  
  // Internal error logging
  private logError(
    error: Error,
    context?: ErrorContext,
    severity: ErrorSeverity = ErrorSeverity.ERROR
  ) {
    // Create error log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      severity,
      message: error.message,
      stack: error.stack,
      context,
      environment: env.NODE_ENV,
      version: process.env.npm_package_version,
    };
    
    // In production, you might want to send this to a logging service
    // For now, just stringify it
    const logMessage = JSON.stringify(logEntry);
    
    // Log based on severity
    switch (severity) {
      case ErrorSeverity.DEBUG:
      case ErrorSeverity.INFO:
        console.log(logMessage);
        break;
      case ErrorSeverity.WARNING:
        console.warn(logMessage);
        break;
      case ErrorSeverity.ERROR:
      case ErrorSeverity.FATAL:
        console.error(logMessage);
        break;
    }
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

// Helper function to wrap async functions with error handling
export function withMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    name?: string;
    op?: string;
    captureErrors?: boolean;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const transactionId = monitoring.startTransaction(
      options?.name || fn.name || 'anonymous',
      options?.op || 'function'
    );
    
    try {
      const result = await fn(...args);
      monitoring.finishTransaction(transactionId, 'ok');
      return result;
    } catch (error) {
      monitoring.finishTransaction(transactionId, 'error');
      
      if (options?.captureErrors !== false) {
        monitoring.captureException(error);
      }
      
      throw error;
    }
  }) as T;
}

// Initialize monitoring on module load
if (typeof window === 'undefined') {
  monitoring.initialize().catch(console.error);
}