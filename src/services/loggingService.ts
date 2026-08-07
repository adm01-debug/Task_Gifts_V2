/**
 * Centralized Logging Service
 * Provides consistent error handling and logging across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
}

const isDev = import.meta.env.DEV;

class LoggingService {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private createEntry(level: LogLevel, message: string, context?: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  private formatMessage(context: string | undefined, message: string): string {
    return context ? `[${context}] ${message}` : message;
  }

  debug(message: string, context?: string, data?: unknown): void {
    if (isDev) {
      const entry = this.createEntry('debug', message, context, data);
      this.addLog(entry);
      console.debug(this.formatMessage(context, message), data ?? '');
    }
  }

  info(message: string, context?: string, data?: unknown): void {
    const entry = this.createEntry('info', message, context, data);
    this.addLog(entry);
    if (isDev) {
      console.info(this.formatMessage(context, message), data ?? '');
    }
  }

  warn(message: string, context?: string, data?: unknown): void {
    const entry = this.createEntry('warn', message, context, data);
    this.addLog(entry);
    console.warn(this.formatMessage(context, message), data ?? '');
  }

  error(message: string, context?: string, error?: unknown): void {
    const entry = this.createEntry('error', message, context, error);
    this.addLog(entry);
    console.error(this.formatMessage(context, message), error ?? '');
    
    // Send to global message system if available
    const msgSystem = (window as unknown as {
      __GLOBAL_MESSAGE_SYSTEM__?: {
        showMessage: (msg: string, level: string, title?: string) => void;
      };
    }).__GLOBAL_MESSAGE_SYSTEM__;
    if (msgSystem) {
      msgSystem.showMessage(message, "error", context || "Erro de Sistema");
    }
    
    // In production, you could send errors to an external service here
    // Example: sendToErrorTracking(entry);
  }

  /**
   * Log an API/async operation error with standardized format
   */
  apiError(operation: string, error: unknown, context?: string): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.error(`${operation} failed: ${errorMessage}`, context, error);
  }

  /**
   * Get recent logs (useful for debugging)
   */
  getRecentLogs(count = 20): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new LoggingService();
