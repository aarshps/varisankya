/**
 * Parity guard: runs the shared, language-neutral vectors in
 * shared/domain/golden-vectors.json through the web implementations. The same
 * vectors should be loaded by the Android and iOS unit tests so all three
 * platforms provably agree. See shared/domain/SPEC.md.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { decodeRecurrence, encodeRecurrence, nextDueDate } from "../recurrence";
import { compactFormat, formatCurrency } from "../currency";

interface Vectors {
  recurrence: {
    encode: { unit: string; frequency: number; expected: string }[];
    decode: { input: string; expected: { unit: string; frequency: number } }[];
    nextDueDate: { base: string; recurrence: string; expected: string | null }[];
  };
  currency: {
    format: { amount: number; code: string; expected: string }[];
    compact: { amount: number; expected: string }[];
  };
}

const vectors: Vectors = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL("../../../shared/domain/golden-vectors.json", import.meta.url),
    ),
    "utf8",
  ),
);

const utcDate = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const toISO = (d: Date) => d.toISOString().slice(0, 10);

describe("golden vectors — recurrence", () => {
  it.each(vectors.recurrence.encode)(
    "encode($unit, $frequency) → $expected",
    ({ unit, frequency, expected }) => {
      expect(encodeRecurrence(unit, frequency)).toBe(expected);
    },
  );

  it.each(vectors.recurrence.decode)("decode($input)", ({ input, expected }) => {
    expect(decodeRecurrence(input)).toEqual(expected);
  });

  it.each(vectors.recurrence.nextDueDate)(
    "nextDueDate($base, $recurrence) → $expected",
    ({ base, recurrence, expected }) => {
      const result = nextDueDate(utcDate(base), recurrence);
      if (expected === null) {
        expect(result).toBeNull();
      } else {
        expect(result).not.toBeNull();
        expect(toISO(result as Date)).toBe(expected);
      }
    },
  );
});

describe("golden vectors — currency", () => {
  it.each(vectors.currency.format)(
    "format($amount, $code) → $expected",
    ({ amount, code, expected }) => {
      expect(formatCurrency(amount, code)).toBe(expected);
    },
  );

  it.each(vectors.currency.compact)(
    "compact($amount) → $expected",
    ({ amount, expected }) => {
      expect(compactFormat(amount)).toBe(expected);
    },
  );
});
