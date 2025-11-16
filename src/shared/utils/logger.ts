/**
 * Centralized logging utility
 *
 * Features:
 * - Conditional logging based on environment
 * - Consistent log formatting
 * - Easy to extend with external logging services (Sentry, LogRocket, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const defaultConfig: LoggerConfig = {
  enabled: isDevelopment,
  level: isDevelopment ? 'debug' : 'error',
};

class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig = defaultConfig) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const requestedLevelIndex = levels.indexOf(level);

    return requestedLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} ${prefix}${contextStr} [${level.toUpperCase()}] ${message}`;
  }

  /**
   * Debug level logging - only in development
   */
  debug(message: string, context?: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context), ...args);
    }
  }

  /**
   * Info level logging - general information
   */
  info(message: string, context?: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context), ...args);
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context), ...args);
    }
  }

  /**
   * Error level logging
   * In production, this should be sent to error tracking service
   */
  error(message: string, context?: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context), error, ...args);

      // In production, send to error tracking service
      if (isProduction) {
        // TODO: Integrate with Sentry, LogRocket, or other service
        // Example: Sentry.captureException(error);
      }
    }
  }

  /**
   * Create a child logger with a specific context/prefix
   */
  createChild(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }
}

/**
 * Context-specific logger that automatically includes context in all logs
 */
class ContextLogger {
  constructor(
    private parent: Logger,
    private context: string
  ) {}

  debug(message: string, ...args: unknown[]): void {
    this.parent.debug(message, this.context, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.parent.info(message, this.context, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.parent.warn(message, this.context, ...args);
  }

  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    this.parent.error(message, this.context, error, ...args);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for creating custom loggers
export { Logger, ContextLogger };
