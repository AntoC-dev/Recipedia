/**
 * OCRMeasurements - Serving counts and cooking times read from a recipe card
 *
 * Recipe cards print a small matrix pairing a serving count with the cooking
 * time it applies to. Recognizers disagree on how that matrix comes back: some
 * return one line per column (`"2 pers."` … then `"25 min"` …), others merge a
 * whole row into a single line (`"2 pers. 25 min"`). This module reads both
 * shapes from the same input by binding each vocabulary term to the number it
 * sits next to, then regrouping the results into rows.
 *
 * The vocabulary is supplied entirely by the caller (from i18n) — this module
 * carries zero natural-language terms of its own, so adding a language is a
 * translation-file change, never a parsing-code change.
 *
 * @example
 * ```typescript
 * const measurements = extractMeasurements(
 *   ['2 pers. 25 min'],
 *   { personsTerms: ['pers.'], timeTerms: ['min'] }
 * );
 * const rows = pairMeasurementsIntoRows(measurements); // [{ person: 2, time: 25 }]
 * ```
 *
 * @module OCRMeasurements
 */

import { numberAtFirstIndex } from '@utils/TextParsing';

/** What a number found on a recipe card measures. */
export type MeasurementKind = 'persons' | 'time';

/** A number bound to the vocabulary term that qualifies it. */
export type Measurement = {
  /** Whether the number is a serving count or a duration */
  kind: MeasurementKind;
  /** Numeric value carried by the measurement */
  value: number;
  /** Index of the source line in the array passed to {@link extractMeasurements} */
  line: number;
};

/** A serving count paired with the cooking time printed alongside it. */
export type PersonsTimeRow = {
  /** Number of servings the row applies to */
  person: number;
  /** Cooking time in minutes for that serving count */
  time: number;
};

/** Localized words qualifying a number as a serving count or a duration. */
export type MeasurementVocabulary = {
  /** Words marking a serving count, e.g. `pers.`, `servings` */
  personsTerms: string[];
  /** Words marking a duration, e.g. `min`, `minutes` */
  timeTerms: string[];
};

const NUMBER_OR_WORD = /\d+(?:[.,]\d+)?|[^\s\d]+/g;

const NON_LETTER = /[^\p{L}]+/gu;

function normalizeTermToken(token: string): string {
  return token.toLowerCase().replace(NON_LETTER, '');
}

function normalizedTermSet(terms: string[]): Set<string> {
  return new Set(terms.map(normalizeTermToken).filter(term => term.length > 0));
}

function parseNumberToken(token: string): number {
  return Number(token.replace(',', '.'));
}

function classifyToken(
  token: string,
  personsTerms: Set<string>,
  timeTerms: Set<string>
): MeasurementKind | undefined {
  const normalized = normalizeTermToken(token);
  if (!normalized) return undefined;
  if (personsTerms.has(normalized)) return 'persons';
  if (timeTerms.has(normalized)) return 'time';
  return undefined;
}

function nearestNumberIndex(
  numbers: (number | undefined)[],
  consumed: Set<number>,
  termIndex: number
): number | undefined {
  for (let index = termIndex - 1; index >= 0; index--) {
    if (numbers[index] !== undefined && !consumed.has(index)) return index;
  }
  for (let index = termIndex + 1; index < numbers.length; index++) {
    if (numbers[index] !== undefined && !consumed.has(index)) return index;
  }
  return undefined;
}

/**
 * Reads every serving count and duration printed on the given OCR lines.
 *
 * Each line is split into number and word tokens. A word whose letters match a
 * vocabulary term — punctuation and case are stripped from both sides, so
 * `pers.`, `Pers` and `pers,` all match `pers` — takes the nearest free number
 * on its own line, preferring the one before it (`4 pers`) and falling back to
 * the one after it (`Serves 4`). A number is claimed by at most one term, so a
 * merged line such as `"5 pers. > 30 min"` yields both its serving count and
 * its time, and stray tokens between them are ignored.
 *
 * @param lines - OCR line texts to read, in the order they should be reported
 * @param vocabulary - Localized words qualifying a number
 * @returns One measurement per bound term, in line then reading order
 */
export function extractMeasurements(
  lines: string[],
  vocabulary: MeasurementVocabulary
): Measurement[] {
  const personsTerms = normalizedTermSet(vocabulary.personsTerms);
  const timeTerms = normalizedTermSet(vocabulary.timeTerms);
  const measurements: Measurement[] = [];

  lines.forEach((line, lineIndex) => {
    const tokens = line.match(NUMBER_OR_WORD) ?? [];
    const numbers = tokens.map(token =>
      numberAtFirstIndex.test(token) ? parseNumberToken(token) : undefined
    );
    const consumed = new Set<number>();

    tokens.forEach((token, tokenIndex) => {
      if (numbers[tokenIndex] !== undefined) return;
      const kind = classifyToken(token, personsTerms, timeTerms);
      if (!kind) return;
      const numberIndex = nearestNumberIndex(numbers, consumed, tokenIndex);
      if (numberIndex === undefined) return;
      consumed.add(numberIndex);
      measurements.push({ kind, value: numbers[numberIndex]!, line: lineIndex });
    });
  });

  return measurements;
}

function rowFromGroup(group: Measurement[]): PersonsTimeRow | undefined {
  const person = group.find(measurement => measurement.kind === 'persons');
  const time = group.find(measurement => measurement.kind === 'time');
  if (!person || !time) return undefined;
  return { person: person.value, time: time.value };
}

function pairByLine(measurements: Measurement[]): PersonsTimeRow[] {
  const groups = new Map<number, Measurement[]>();
  for (const measurement of measurements) {
    const group = groups.get(measurement.line);
    if (group) {
      group.push(measurement);
    } else {
      groups.set(measurement.line, [measurement]);
    }
  }

  return [...groups.entries()]
    .sort(([leftLine], [rightLine]) => leftLine - rightLine)
    .map(([, group]) => rowFromGroup(group))
    .filter((row): row is PersonsTimeRow => row !== undefined);
}

function pairByPosition(measurements: Measurement[]): PersonsTimeRow[] {
  const persons = measurements.filter(measurement => measurement.kind === 'persons');
  const times = measurements.filter(measurement => measurement.kind === 'time');
  if (persons.length === 0 || persons.length !== times.length) return [];
  return persons.map((person, index) => ({ person: person.value, time: times[index]!.value }));
}

/**
 * Regroups measurements into one row per serving count / cooking time pair.
 *
 * Two strategies are tried in order of trustworthiness: grouping by source line,
 * which is what merged lines need, and failing that a positional zip of the two
 * lists, the only option left when a recognizer returns each column as its own
 * block. Rows come out in source order.
 *
 * @param measurements - Measurements as returned by {@link extractMeasurements}
 * @returns One row per pair found, empty when the measurements cannot be paired
 */
export function pairMeasurementsIntoRows(measurements: Measurement[]): PersonsTimeRow[] {
  if (measurements.length === 0) return [];

  const byLine = pairByLine(measurements);
  if (byLine.length > 0) return byLine;

  return pairByPosition(measurements);
}
