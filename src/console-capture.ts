export type ConsoleMessage = {
  timestamp: number;
  level: 'log' | 'warn' | 'error';
  message: string;
};

type ConsoleMethod = (...args: unknown[]) => void;

let originalLog: ConsoleMethod | null = null;
let originalWarn: ConsoleMethod | null = null;
let originalError: ConsoleMethod | null = null;
let isCapturing = false;

const stringifyArgs = (args: unknown[]): string => {
  return args
    .map(arg => {
      if (typeof arg === 'string') {
        return arg;
      }
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ');
};

export const startCapture = (callback: (msg: ConsoleMessage) => void): void => {
  if (isCapturing) {
    return;
  }

  originalLog = console.log;
  originalWarn = console.warn;
  originalError = console.error;
  isCapturing = true;

  console.log = (...args: unknown[]) => {
    callback({
      timestamp: Date.now(),
      level: 'log',
      message: stringifyArgs(args),
    });
  };

  console.warn = (...args: unknown[]) => {
    callback({
      timestamp: Date.now(),
      level: 'warn',
      message: stringifyArgs(args),
    });
  };

  console.error = (...args: unknown[]) => {
    callback({
      timestamp: Date.now(),
      level: 'error',
      message: stringifyArgs(args),
    });
  };
};

export const stopCapture = (): void => {
  if (!isCapturing) {
    return;
  }

  if (originalLog) {
    console.log = originalLog;
  }
  if (originalWarn) {
    console.warn = originalWarn;
  }
  if (originalError) {
    console.error = originalError;
  }

  isCapturing = false;
  originalLog = null;
  originalWarn = null;
  originalError = null;
};
