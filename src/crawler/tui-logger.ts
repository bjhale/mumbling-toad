import { Logger, LogLevel } from 'crawlee';

type TuiLoggerCallback = (level: string, message: string) => void;

const formatPayload = (data?: unknown): string => {
  if (data === undefined || data === null) {
    return '';
  }
  if (typeof data === 'string') {
    return data;
  }
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
};

const formatException = (exception?: Error): string => {
  if (!exception) {
    return '';
  }
  return exception.stack || exception.message;
};

export class TuiLogger extends Logger {
  constructor(private callback: TuiLoggerCallback) {
    super();
  }

  _log(level: LogLevel, message: string, data?: unknown, exception?: Error): void {
    if (level > LogLevel.WARNING) {
      return;
    }

    const payload = formatPayload(data);
    const errorDetails = formatException(exception);
    const details = [payload, errorDetails].filter(Boolean).join(' ');
    const formatted = details ? `${message} ${details}` : message;
    const levelLabel = LogLevel[level]?.toString() ?? String(level);

    this.callback(levelLabel, formatted);
  }
}

export const createTuiLogger = (callback: TuiLoggerCallback): TuiLogger => {
  return new TuiLogger(callback);
};
