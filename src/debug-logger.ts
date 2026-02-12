import { openSync, writeSync, closeSync } from 'fs';

export type DebugLevel = 'debug' | 'info' | 'warning' | 'error';

export const DEBUG_LEVEL_PRIORITY: Record<DebugLevel, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
};

let fd: number | null = null;
let currentLevel: DebugLevel = 'warning';

const LOG_FILE_PATH = './mumbling-toad-debug.log';
const ANSI_REGEX = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*[a-zA-Z]', 'g');

export function parseDebugLevel(value: string): DebugLevel | null {
  const normalized = value.toLowerCase();
  if (normalized === 'debug' || normalized === 'info' || normalized === 'warning' || normalized === 'error') {
    return normalized as DebugLevel;
  }
  return null;
}

export function shouldLog(level: DebugLevel, threshold: DebugLevel): boolean {
  return DEBUG_LEVEL_PRIORITY[level] >= DEBUG_LEVEL_PRIORITY[threshold];
}

export function initDebugLog(level: DebugLevel): void {
  if (fd !== null) {
    return;
  }

  currentLevel = level;
  try {
    fd = openSync(LOG_FILE_PATH, 'a');
    const timestamp = new Date().toISOString();
    const separator = `[${timestamp}] [INFO] --- Debug logging started (level: ${level}) ---\n`;
    writeSync(fd, separator);
  } catch (err) {
    fd = null;
  }
}

export function writeDebugLog(level: DebugLevel, message: string): void {
  if (fd === null) {
    return;
  }

  if (!shouldLog(level, currentLevel)) {
    return;
  }

  try {
    const timestamp = new Date().toISOString();
    const cleanMessage = message.replace(ANSI_REGEX, '');
    const formatted = `[${timestamp}] [${level.toUpperCase()}] ${cleanMessage}\n`;
    writeSync(fd, formatted);
  } catch (err) {
    // Silent failure - don't crash the app
  }
}

export function closeDebugLog(): void {
  if (fd === null) {
    return;
  }

  try {
    const timestamp = new Date().toISOString();
    const separator = `[${timestamp}] [INFO] --- Debug logging ended ---\n`;
    writeSync(fd, separator);
    closeSync(fd);
  } catch (err) {
    // Silent failure
  }

  fd = null;
  currentLevel = 'warning';
}

export function isDebugActive(): boolean {
  return fd !== null;
}

export function __resetState(): void {
  fd = null;
  currentLevel = 'warning';
}
