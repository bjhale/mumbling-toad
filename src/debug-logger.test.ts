import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DEBUG_LEVEL_PRIORITY,
  parseDebugLevel,
  initDebugLog,
  writeDebugLog,
  closeDebugLog,
  isDebugActive,
  shouldLog,
  __resetState,
} from './debug-logger.js';
import fs from 'fs';

vi.mock('fs');

describe('debug-logger', () => {
  beforeEach(() => {
    __resetState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    __resetState();
    vi.clearAllMocks();
  });

  describe('parseDebugLevel', () => {
    it('should parse "debug" level', () => {
      expect(parseDebugLevel('debug')).toBe('debug');
    });

    it('should parse "info" level', () => {
      expect(parseDebugLevel('info')).toBe('info');
    });

    it('should parse "warning" level', () => {
      expect(parseDebugLevel('warning')).toBe('warning');
    });

    it('should parse "error" level', () => {
      expect(parseDebugLevel('error')).toBe('error');
    });

    it('should return null for invalid level', () => {
      expect(parseDebugLevel('banana')).toBeNull();
    });

    it('should handle uppercase input (case-insensitive)', () => {
      expect(parseDebugLevel('DEBUG')).toBe('debug');
      expect(parseDebugLevel('INFO')).toBe('info');
      expect(parseDebugLevel('WARNING')).toBe('warning');
      expect(parseDebugLevel('ERROR')).toBe('error');
    });

    it('should return null for empty string', () => {
      expect(parseDebugLevel('')).toBeNull();
    });

    it('should return null for mixed case invalid', () => {
      expect(parseDebugLevel('DeBuG123')).toBeNull();
    });
  });

  describe('shouldLog', () => {
    it('should return true when level >= threshold', () => {
      expect(shouldLog('error', 'warning')).toBe(true);
      expect(shouldLog('error', 'error')).toBe(true);
      expect(shouldLog('warning', 'info')).toBe(true);
    });

    it('should return false when level < threshold', () => {
      expect(shouldLog('debug', 'warning')).toBe(false);
      expect(shouldLog('info', 'error')).toBe(false);
      expect(shouldLog('warning', 'error')).toBe(false);
    });

    it('should return true when level equals threshold', () => {
      expect(shouldLog('info', 'info')).toBe(true);
      expect(shouldLog('debug', 'debug')).toBe(true);
    });

    it('should handle all level combinations correctly', () => {
      expect(shouldLog('error', 'debug')).toBe(true);
      expect(shouldLog('error', 'info')).toBe(true);
      expect(shouldLog('error', 'warning')).toBe(true);
      expect(shouldLog('warning', 'debug')).toBe(true);
      expect(shouldLog('warning', 'info')).toBe(true);
      expect(shouldLog('info', 'debug')).toBe(true);
      expect(shouldLog('debug', 'debug')).toBe(true);
      expect(shouldLog('debug', 'info')).toBe(false);
    });
  });

  describe('DEBUG_LEVEL_PRIORITY', () => {
    it('should have correct priority values', () => {
      expect(DEBUG_LEVEL_PRIORITY.debug).toBe(0);
      expect(DEBUG_LEVEL_PRIORITY.info).toBe(1);
      expect(DEBUG_LEVEL_PRIORITY.warning).toBe(2);
      expect(DEBUG_LEVEL_PRIORITY.error).toBe(3);
    });
  });

  describe('initDebugLog', () => {
    it('should call fs.openSync with correct parameters', () => {
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockReturnValue(0);

      initDebugLog('info');

      expect(fs.openSync).toHaveBeenCalledWith('./mumbling-toad-debug.log', 'a');
    });

    it('should write initial separator message', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-12T07:30:45.123Z'));
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockReturnValue(0);

      initDebugLog('warning');

      expect(fs.writeSync).toHaveBeenCalled();
      const call = vi.mocked(fs.writeSync).mock.calls[0];
      expect(call).toBeDefined();
      expect(call![1]).toContain('Debug logging started');
      expect(call![1]).toContain('warning');
      expect(call![1]).toContain('[INFO]');
      expect(call![1]).toContain('2026-02-12T07:30:45.123Z');

      vi.useRealTimers();
    });

    it('should not reinitialize if already initialized', () => {
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockReturnValue(0);

      initDebugLog('info');
      vi.clearAllMocks();
      initDebugLog('debug');

      expect(fs.openSync).not.toHaveBeenCalled();
    });

    it('should handle errors silently', () => {
      vi.mocked(fs.openSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => initDebugLog('info')).not.toThrow();
    });
  });

  describe('writeDebugLog', () => {
    it('should format message correctly with ISO timestamp and level', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-12T07:30:45.123Z'));
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockReturnValue(0);

      initDebugLog('debug');
      writeDebugLog('error', 'test message');

      expect(fs.writeSync).toHaveBeenCalledTimes(2);
      const messageCall = vi.mocked(fs.writeSync).mock.calls[1];
      expect(messageCall![1]).toBe('[2026-02-12T07:30:45.123Z] [ERROR] test message\n');

      vi.useRealTimers();
    });

    it('should not write messages below threshold', () => {
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockReturnValue(0);

      initDebugLog('warning');
      vi.clearAllMocks();

      writeDebugLog('debug', 'debug message');

      expect(fs.writeSync).not.toHaveBeenCalled();
    });

    it('should strip ANSI codes from message before writing', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-12T07:30:45.000Z'));
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockReturnValue(0);

      initDebugLog('debug');
      writeDebugLog('info', '\u001b[31mred text\u001b[0m');

      const messageCall = vi.mocked(fs.writeSync).mock.calls[1];
      expect(messageCall![1]).toBe('[2026-02-12T07:30:45.000Z] [INFO] red text\n');

      vi.useRealTimers();
    });

    it('should be no-op when not initialized', () => {
      vi.mocked(fs.writeSync).mockReturnValue(0);

      writeDebugLog('error', 'test');

      expect(fs.writeSync).not.toHaveBeenCalled();
    });

    it('should handle write errors silently', () => {
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockImplementation(() => {
        throw new Error('Write failed');
      });

      initDebugLog('info');
      expect(() => writeDebugLog('info', 'test')).not.toThrow();
    });

    it('should uppercase level in log output', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-12T07:30:45.000Z'));
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockReturnValue(0);

      initDebugLog('debug');
      writeDebugLog('warning', 'test');

      const messageCall = vi.mocked(fs.writeSync).mock.calls[1];
      expect(messageCall![1]).toContain('[WARNING]');

      vi.useRealTimers();
    });
  });

  describe('closeDebugLog', () => {
    it('should write closing separator message', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-12T07:30:45.123Z'));
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockReturnValue(0);
      vi.mocked(fs.closeSync).mockReturnValue(undefined);

      initDebugLog('info');
      closeDebugLog();

      const closingCall = vi.mocked(fs.writeSync).mock.calls[1];
      expect(closingCall![1]).toContain('Debug logging ended');
      expect(closingCall![1]).toContain('2026-02-12T07:30:45.123Z');

      vi.useRealTimers();
    });

    it('should call fs.closeSync with correct fd', () => {
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockReturnValue(0);
      vi.mocked(fs.closeSync).mockReturnValue(undefined);

      initDebugLog('info');
      closeDebugLog();

      expect(fs.closeSync).toHaveBeenCalledWith(10);
    });

    it('should be safe to call when not initialized', () => {
      vi.mocked(fs.closeSync).mockReturnValue(undefined);

      expect(() => closeDebugLog()).not.toThrow();
      expect(fs.closeSync).not.toHaveBeenCalled();
    });

    it('should be safe to call multiple times', () => {
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockReturnValue(0);
      vi.mocked(fs.closeSync).mockReturnValue(undefined);

      initDebugLog('info');
      closeDebugLog();
      vi.clearAllMocks();

      expect(() => closeDebugLog()).not.toThrow();
      expect(fs.closeSync).not.toHaveBeenCalled();
    });

    it('should handle errors silently', () => {
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockImplementation((_fd, data) => {
        if (String(data).includes('ended')) {
          throw new Error('Write failed');
        }
        return 0;
      });
      vi.mocked(fs.closeSync).mockReturnValue(undefined);

      initDebugLog('info');
      expect(() => closeDebugLog()).not.toThrow();
    });
  });

  describe('isDebugActive', () => {
    it('should return false initially', () => {
      expect(isDebugActive()).toBe(false);
    });

    it('should return true after initDebugLog', () => {
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockReturnValue(0);

      initDebugLog('info');

      expect(isDebugActive()).toBe(true);
    });

    it('should return false after closeDebugLog', () => {
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockReturnValue(0);
      vi.mocked(fs.closeSync).mockReturnValue(undefined);

      initDebugLog('info');
      closeDebugLog();

      expect(isDebugActive()).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should handle full lifecycle', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-12T07:30:45.000Z'));
      vi.mocked(fs.openSync).mockReturnValue(10);
      vi.mocked(fs.writeSync).mockReturnValue(0);
      vi.mocked(fs.closeSync).mockReturnValue(undefined);

      expect(isDebugActive()).toBe(false);

      initDebugLog('info');
      expect(isDebugActive()).toBe(true);

      writeDebugLog('debug', 'debug msg');
      writeDebugLog('info', 'info msg');
      writeDebugLog('warning', 'warning msg');

      closeDebugLog();
      expect(isDebugActive()).toBe(false);

      expect(fs.openSync).toHaveBeenCalledWith('./mumbling-toad-debug.log', 'a');
      const mockClose = vi.mocked(fs.closeSync);
      expect(mockClose).toHaveBeenCalledWith(10);

      vi.useRealTimers();
    });
  });
});
