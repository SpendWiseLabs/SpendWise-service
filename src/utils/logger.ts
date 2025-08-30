export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private sanitizeArn(arn: string): string {
    // Sanitizes ARNs for secure logging
    if (!arn) return '[REDACTED]';

    // Para ARNs de rol: arn:aws:iam::123456789012:role/role-name
    // Mostrar solo: arn:aws:iam::****:role/role-name
    const arnParts = arn.split(':');
    if (arnParts.length >= 5 && arnParts[2] === 'iam') {
      return `${arnParts.slice(0, 4).join(':')}:****:${arnParts.slice(5).join(':')}`;
    }

    // Para otros ARNs, mostrar solo la estructura
    return arn.replace(/\d{12}/g, '****');
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  // Método específico para logging seguro de ARNs
  logArn(level: LogLevel, message: string, arn: string): void {
    const sanitizedArn = this.sanitizeArn(arn);
    this[level](message, sanitizedArn);
  }
}

// Singleton thread-safe
export const logger = new Logger();
