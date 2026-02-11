import { describe, expect, it } from "vitest";
import {
  APP_NAME,
  APP_VERSION,
  MIN_TERMINAL_WIDTH,
  DEFAULT_CRAWL_OPTIONS,
  COLUMN_DEFINITIONS,
} from "./constants.js";

describe("constants", () => {
  describe("Application Metadata", () => {
    it("should have correct APP_NAME", () => {
      expect(APP_NAME).toBe("MumblingToad SEO Crawler");
    });

    it("should have correct APP_VERSION", () => {
      expect(APP_VERSION).toBe("1.0.0");
    });

    it("should have correct MIN_TERMINAL_WIDTH", () => {
      expect(MIN_TERMINAL_WIDTH).toBe(100);
    });
  });

  describe("COLUMN_DEFINITIONS", () => {
    it("should have exactly 9 column definitions", () => {
      expect(COLUMN_DEFINITIONS).toHaveLength(9);
    });

    it("should have priorities from 1 to 9 with no gaps", () => {
      const priorities = COLUMN_DEFINITIONS.map((col) => col.priority);
      const sortedPriorities = [...priorities].sort((a, b) => a - b);
      expect(sortedPriorities).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("should have no duplicate priorities", () => {
      const priorities = COLUMN_DEFINITIONS.map((col) => col.priority);
      const uniquePriorities = new Set(priorities);
      expect(uniquePriorities.size).toBe(9);
    });

    it("should have unique column keys", () => {
      const keys = COLUMN_DEFINITIONS.map((col) => col.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(9);
    });

    it("should have url as first priority column", () => {
      const priority1Column = COLUMN_DEFINITIONS.find(
        (col) => col.priority === 1,
      );
      expect(priority1Column).toBeDefined();
      expect(priority1Column?.key).toBe("url");
    });

    it("should have all required columns with expected structure", () => {
      const expectedKeys = [
        "url",
        "statusCode",
        "title",
        "isIndexable",
        "responseTimeMs",
        "h1",
        "wordCount",
        "metaDescription",
        "contentType",
      ];

      const actualKeys = COLUMN_DEFINITIONS.map((col) => col.key);
      expect(actualKeys.sort()).toEqual(expectedKeys.sort());

      for (const col of COLUMN_DEFINITIONS) {
        expect(col).toHaveProperty("key");
        expect(col).toHaveProperty("label");
        expect(col).toHaveProperty("minWidth");
        expect(col).toHaveProperty("priority");
        expect(typeof col.key).toBe("string");
        expect(typeof col.label).toBe("string");
        expect(typeof col.minWidth).toBe("number");
        expect(typeof col.priority).toBe("number");
        expect(col.minWidth).toBeGreaterThan(0);
      }
    });
  });
});
