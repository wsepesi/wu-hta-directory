/**
 * Error logging utility for tracking and debugging errors
 * In production, this would integrate with services like Sentry, LogRocket, etc.
 */

type ErrorLevel = 'error' | 'warning' | 'info';

interface ErrorContext {
  userId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  metadata?: Record<string, unknown>;
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log an error with context
   */
  logError(error: Error | string, context?: ErrorContext, level: ErrorLevel = 'error') {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      level,
      message: errorMessage,
      stack: errorStack,
      context,
      environment: process.env.NODE_ENV,
    };

    // In development, log to console
    if (this.isDevelopment) {
      console.group(`[${level.toUpperCase()}] ${timestamp}`);
      console.error('Message:', errorMessage);
      if (errorStack) console.error('Stack:', errorStack);
      if (context) console.log('Context:', context);
      console.groupEnd();
    }

    // In production, send to error tracking service
    if (!this.isDevelopment) {
      this.sendToErrorService(logEntry);
    }

    // Always log to server logs
    this.logToServer(logEntry);
  }

  /**
   * Log API errors with request context
   */
  logApiError(
    error: Error | string,
    request: {
      method?: string;
      url?: string;
      headers?: Record<string, string>;
      body?: unknown;
    },
    response?: {
      statusCode?: number;
      body?: unknown;
    }
  ) {
    const context: ErrorContext = {
      path: request.url,
      method: request.method,
      statusCode: response?.statusCode,
      metadata: {
        requestHeaders: request.headers,
        requestBody: request.body,
        responseBody: response?.body,
      },
    };

    this.logError(error, context);
  }

  /**
   * Log client-side errors
   */
  logClientError(error: Error | string, componentName?: string, props?: unknown) {
    const context: ErrorContext = {
      metadata: {
        component: componentName,
        props: props,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      },
    };

    this.logError(error, context);
  }

  /**
   * Send error to external service (Sentry, etc.)
   */
  private async sendToErrorService(logEntry: Record<string, unknown>) {
    // TODO: Implement integration with error tracking service
    // Example: Sentry.captureException(error, { extra: context });
    
    // For now, we'll just log that we would send it
    if (this.isDevelopment) {
      console.log('Would send to error service:', logEntry);
    }
  }

  /**
   * Log to server (could be file, database, etc.)
   */
  private logToServer(logEntry: Record<string, unknown>) {
    // In a real app, this might write to a log file or database
    // For now, we'll use console.log which will be captured by server logs
    if (typeof window === 'undefined') {
      // Server-side logging
      console.error(JSON.stringify(logEntry));
    }
  }

  /**
   * Create a wrapped version of a function that logs errors
   */
  wrapAsync<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    context?: Partial<ErrorContext>
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.logError(error as Error, context);
        throw error;
      }
    }) as T;
  }

  /**
   * Create a wrapped version of an API route handler
   */
  wrapApiHandler<T extends (...args: unknown[]) => Promise<unknown>>(
    handler: T,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _routeName: string
  ): T {
    return (async (...args: Parameters<T>) => {
      const [request] = args;
      try {
        return await handler(...args);
      } catch (error) {
        this.logApiError(
          error as Error,
          {
            method: (request as Record<string, unknown>)?.method as string,
            url: (request as Record<string, unknown>)?.url as string,
          },
          {
            statusCode: 500,
          }
        );
        throw error;
      }
    }) as T;
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Export helper functions
export const logError = errorLogger.logError.bind(errorLogger);
export const logApiError = errorLogger.logApiError.bind(errorLogger);
export const logClientError = errorLogger.logClientError.bind(errorLogger);
export const wrapAsync = errorLogger.wrapAsync.bind(errorLogger);
export const wrapApiHandler = errorLogger.wrapApiHandler.bind(errorLogger);