// Structured JSON logger designed for Google Cloud Logging (Firebase)
// Avoids Winston/Pino overhead for Edge compatibility while maintaining structure.

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogContext {
  userId?: string;
  engine?: 'navigation' | 'match' | 'proof' | 'radar' | 'salary' | 'context';
  durationMs?: number;
  tokenUsage?: number;
  routeId?: string;
  [key: string]: any;
}

export const logger = {
  log: (level: LogLevel, message: string, context?: LogContext) => {
    // In production, GCP Logging automatically parses JSON on stdout/stderr
    const logEntry = {
      severity: level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (process.env.NODE_ENV === 'development') {
      // Pretty print in dev
      const prefix = `[${level}] ${context?.engine ? `[${context.engine.toUpperCase()}] ` : ''}`;
      console.log(`${prefix}${message}`, context ? `\n  ${JSON.stringify(context)}` : '');
    } else {
      // Structured JSON in prod
      if (level === 'ERROR') {
        console.error(JSON.stringify(logEntry));
      } else if (level === 'WARN') {
        console.warn(JSON.stringify(logEntry));
      } else {
        console.log(JSON.stringify(logEntry));
      }
    }
  },

  info: (msg: string, ctx?: LogContext) => logger.log('INFO', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => logger.log('WARN', msg, ctx),
  error: (msg: string, ctx?: LogContext) => logger.log('ERROR', msg, ctx),
  debug: (msg: string, ctx?: LogContext) => {
    if (process.env.NODE_ENV === 'development') logger.log('DEBUG', msg, ctx);
  },

  // Helper for tracking AI engine execution time
  trackExecution: async <T>(engineName: LogContext['engine'], userId: string, task: () => Promise<T>): Promise<T> => {
    const start = Date.now();
    try {
      const result = await task();
      logger.info(`${engineName} executed successfully`, { engine: engineName, userId, durationMs: Date.now() - start });
      return result;
    } catch (error: any) {
      logger.error(`${engineName} failed: ${error.message}`, { engine: engineName, userId, durationMs: Date.now() - start, error: error.stack });
      throw error;
    }
  }
};
