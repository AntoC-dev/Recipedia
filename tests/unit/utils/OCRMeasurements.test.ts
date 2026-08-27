import {
  extractMeasurements,
  Measurement,
  MeasurementVocabulary,
  pairMeasurementsIntoRows,
} from '@utils/OCRMeasurements';

const frenchVocabulary: MeasurementVocabulary = {
  personsTerms: ['pers.', 'pers', 'personne', 'personnes'],
  timeTerms: ['min', 'mn', 'minute', 'minutes'],
};

const englishVocabulary: MeasurementVocabulary = {
  personsTerms: ['pers.', 'pers', 'persons', 'person', 'servings', 'serving', 'serves'],
  timeTerms: ['min', 'mins', 'minute', 'minutes'],
};

const persons = (value: number, line: number): Measurement => ({ kind: 'persons', value, line });

const time = (value: number, line: number): Measurement => ({ kind: 'time', value, line });

describe('extractMeasurements', () => {
  test('returns nothing for no lines', () => {
    expect(extractMeasurements([], frenchVocabulary)).toEqual([]);
  });

  test('returns nothing when the vocabulary has no terms', () => {
    expect(extractMeasurements(['2 pers. 25 min'], { personsTerms: [], timeTerms: [] })).toEqual(
      []
    );
  });

  test('binds the number printed before the term', () => {
    expect(extractMeasurements(['4 pers.'], frenchVocabulary)).toEqual([persons(4, 0)]);
    expect(extractMeasurements(['25 min'], frenchVocabulary)).toEqual([time(25, 0)]);
  });

  test('binds the number printed after the term when none precedes it', () => {
    expect(extractMeasurements(['Serves 4'], englishVocabulary)).toEqual([persons(4, 0)]);
  });

  test('reads both measurements from a merged line', () => {
    expect(extractMeasurements(['2 pers. 25 min'], frenchVocabulary)).toEqual([
      persons(2, 0),
      time(25, 0),
    ]);
  });

  test('ignores stray tokens printed between the two measurements', () => {
    expect(extractMeasurements(['5 pers. > 30 min'], frenchVocabulary)).toEqual([
      persons(5, 0),
      time(30, 0),
    ]);
  });

  test('reads a number glued to its term', () => {
    expect(extractMeasurements(['25min'], frenchVocabulary)).toEqual([time(25, 0)]);
  });

  test('matches a term whatever punctuation the recognizer glued to it', () => {
    expect(extractMeasurements(['2 pers.', '3 pers,', '4 pers'], frenchVocabulary)).toEqual([
      persons(2, 0),
      persons(3, 1),
      persons(4, 2),
    ]);
  });

  test('matches terms whatever their case', () => {
    expect(extractMeasurements(['4 PERS. 30 MIN', '5 Pers. 35 Min'], frenchVocabulary)).toEqual([
      persons(4, 0),
      time(30, 0),
      persons(5, 1),
      time(35, 1),
    ]);
  });

  test('matches the plural time terms', () => {
    expect(extractMeasurements(['30 mins', '45 minutes'], englishVocabulary)).toEqual([
      time(30, 0),
      time(45, 1),
    ]);
  });

  test('ignores a term with no number on its line', () => {
    expect(extractMeasurements(['pers.', 'min'], frenchVocabulary)).toEqual([]);
  });

  test('lets a number serve a single term', () => {
    expect(extractMeasurements(['25 min min'], frenchVocabulary)).toEqual([time(25, 0)]);
  });

  test('keeps the index of the line each measurement comes from', () => {
    expect(extractMeasurements(['2 pers.', '3 pers.', '25 min'], frenchVocabulary)).toEqual([
      persons(2, 0),
      persons(3, 1),
      time(25, 2),
    ]);
  });

  test('binds a comma-decimal number to its term', () => {
    expect(extractMeasurements(['2,5 pers'], frenchVocabulary)).toEqual([persons(2.5, 0)]);
  });

  test('ignores a number with no matching term on its line', () => {
    expect(extractMeasurements(['42'], frenchVocabulary)).toEqual([]);
  });

  test('binds a term with no number before it and a term with a number before it on the same line', () => {
    expect(extractMeasurements(['Serves 4 25 min'], englishVocabulary)).toEqual([
      persons(4, 0),
      time(25, 0),
    ]);
  });

  test('skips a stray word before finding the number further ahead of the term', () => {
    expect(extractMeasurements(['Serves for 4'], englishVocabulary)).toEqual([persons(4, 0)]);
  });

  test('lets only one of two competing terms claim the single number between them', () => {
    expect(extractMeasurements(['pers. 4 min'], frenchVocabulary)).toEqual([persons(4, 0)]);
  });

  test('tolerates vocabularies with duplicate, empty, and single-character terms', () => {
    const noisyVocabulary: MeasurementVocabulary = {
      personsTerms: ['pers', 'pers', '', 'p'],
      timeTerms: ['min', 'min', '', 'm'],
    };
    expect(extractMeasurements(['4 pers. 25 min'], noisyVocabulary)).toEqual([
      persons(4, 0),
      time(25, 0),
    ]);
  });

  test('does not classify common recipe words as persons or time', () => {
    expect(extractMeasurements(['poireau', 'pommes', 'sel'], englishVocabulary)).toEqual([]);
  });

  test('does not classify common recipe words carrying a number', () => {
    expect(
      extractMeasurements(['2 poireaux', '500 pommes de terre', '1 sel'], englishVocabulary)
    ).toEqual([]);
  });

  test('does not classify a word merely starting with a vocabulary term', () => {
    expect(extractMeasurements(['4 persil', '25 mineral'], frenchVocabulary)).toEqual([]);
  });

  test('matches the singular time term', () => {
    expect(extractMeasurements(['10 minute'], englishVocabulary)).toEqual([time(10, 0)]);
  });

  test('returns nothing for a line with empty text', () => {
    expect(extractMeasurements([''], frenchVocabulary)).toEqual([]);
  });

  test('returns nothing for a line with only whitespace', () => {
    expect(extractMeasurements(['   '], frenchVocabulary)).toEqual([]);
  });
});

describe('pairMeasurementsIntoRows', () => {
  test('returns nothing for no measurements', () => {
    expect(pairMeasurementsIntoRows([])).toEqual([]);
  });

  test('groups measurements sharing a source line', () => {
    expect(
      pairMeasurementsIntoRows([
        persons(2, 0),
        time(25, 0),
        persons(3, 1),
        time(25, 1),
        persons(4, 2),
        time(30, 2),
      ])
    ).toEqual([
      { person: 2, time: 25 },
      { person: 3, time: 25 },
      { person: 4, time: 30 },
    ]);
  });

  test('zips the two lists when each column comes as its own line', () => {
    expect(
      pairMeasurementsIntoRows([
        persons(2, 0),
        persons(3, 1),
        persons(4, 2),
        time(25, 3),
        time(25, 4),
        time(30, 5),
      ])
    ).toEqual([
      { person: 2, time: 25 },
      { person: 3, time: 25 },
      { person: 4, time: 30 },
    ]);
  });

  test('returns nothing when the two lists have different lengths', () => {
    expect(
      pairMeasurementsIntoRows([
        persons(2, 0),
        persons(3, 1),
        time(25, 2),
        time(25, 3),
        time(30, 4),
      ])
    ).toEqual([]);
  });

  test('returns nothing when only one kind of measurement was read', () => {
    expect(pairMeasurementsIntoRows([persons(2, 0), persons(3, 1)])).toEqual([]);
    expect(pairMeasurementsIntoRows([time(25, 0), time(30, 1)])).toEqual([]);
  });

  test('drops a line holding two persons and no time, and keeps only the first time of a line with two', () => {
    expect(
      pairMeasurementsIntoRows([
        persons(2, 0),
        persons(3, 0),
        persons(4, 1),
        time(30, 1),
        time(35, 1),
      ])
    ).toEqual([{ person: 4, time: 30 }]);
  });

  test('orders rows by source line regardless of input order', () => {
    expect(
      pairMeasurementsIntoRows([
        persons(4, 2),
        time(30, 2),
        persons(2, 0),
        time(25, 0),
        persons(3, 1),
        time(25, 1),
      ])
    ).toEqual([
      { person: 2, time: 25 },
      { person: 3, time: 25 },
      { person: 4, time: 30 },
    ]);
  });
});

describe('extractMeasurements paired into rows', () => {
  test('reads the servings matrix merged into one line per row', () => {
    const measurements = extractMeasurements(
      ['2 pers. 25 min', '3 pers. 25 min', '4 pers. 30 min', '5 pers. > 30 min'],
      frenchVocabulary
    );

    expect(pairMeasurementsIntoRows(measurements)).toEqual([
      { person: 2, time: 25 },
      { person: 3, time: 25 },
      { person: 4, time: 30 },
      { person: 5, time: 30 },
    ]);
  });

  test('reads the servings matrix split into two columns', () => {
    const measurements = extractMeasurements(
      ['2 pers.', '3 pers.', '4 pers.', '5 pers.', '>', '25 min', '25 min', '30 min', '30 min'],
      frenchVocabulary
    );

    expect(pairMeasurementsIntoRows(measurements)).toEqual([
      { person: 2, time: 25 },
      { person: 3, time: 25 },
      { person: 4, time: 30 },
      { person: 5, time: 30 },
    ]);
  });
});
