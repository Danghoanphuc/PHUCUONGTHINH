import { Injectable, Logger } from '@nestjs/common';

export interface LogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: any;
  [key: string]: any;
}

@Injectable()
export class LoggerService {
  private logger = new Logger('Application');

  log(message: string, context?: LogContext) {
    const logEntry = this.formatLogEntry('INFO', message, context);
    this.logger.log(logEntry);
  }

  error(message: string, error?: any, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error?.message || error,
      stack: error?.stack,
    };
    const logEntry = this.formatLogEntry('ERROR', message, errorContext);
    this.logger.error(logEntry);
  }

  warn(message: string, context?: LogContext) {
    const logEntry = this.formatLogEntry('WARN', message, context);
    this.logger.warn(logEntry);
  }

  debug(message: string, context?: LogContext) {
    const logEntry = this.formatLogEntry('DEBUG', message, context);
    this.logger.debug(logEntry);
  }

  logRequest(method: string, endpoint: string, requestId: string) {
    if (process.env.NODE_ENV !== 'production') {
      this.log(`Incoming ${method} request`, {
        endpoint,
        method,
        requestId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  logResponse(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    requestId: string,
  ) {
    // Only log slow requests or errors in production
    if (process.env.NODE_ENV === 'production') {
      if (statusCode >= 400 || duration > 1000) {
        this.log(`${method} ${endpoint} completed`, {
          endpoint,
          method,
          statusCode,
          duration: duration,
          requestId,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      this.log(`${method} ${endpoint} completed`, {
        endpoint,
        method,
        statusCode,
        duration: duration,
        requestId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    context?: LogContext,
  ) {
    this.debug(`Database ${operation} on ${table}`, {
      operation,
      table,
      duration: duration,
      ...context,
    });
  }

  logAuthenticationAttempt(
    email: string,
    success: boolean,
    context?: LogContext,
  ) {
    const message = success
      ? `Authentication successful for ${email}`
      : `Authentication failed for ${email}`;
    this.log(message, {
      email,
      success,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  logAuthorizationFailure(
    userId: string,
    resource: string,
    context?: LogContext,
  ) {
    this.warn(`Authorization denied for user ${userId} accessing ${resource}`, {
      userId,
      resource,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  private formatLogEntry(
    level: string,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] [${level}] ${message} ${contextStr}`.trim();
  }
}
