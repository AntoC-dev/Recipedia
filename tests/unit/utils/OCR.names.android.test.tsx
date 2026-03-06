import { recognizeIngredientNames } from '@utils/OCR';
import TextRecognition, { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import {
  androidNamesOcrResult as hellofreshAndroidNames,
  expectedIngredientNames as hellofreshExpectedNames,
} from '@data/ocrMocks/hellofresh';
import {
  androidNamesOcrResult as quitoqueV1AndroidNames,
  expectedIngredientNames as quitoqueV1ExpectedNames,
} from '@data/ocrMocks/quitoque-v1';
import {
  androidNamesOcrResult as quitoqueV2AndroidNames,
  expectedIngredientNames as quitoqueV2ExpectedNames,
} from '@data/ocrMocks/quitoque-v2';
import {
  androidNamesOcrResult as quitoqueV3AndroidNames,
  expectedIngredientNames as quitoqueV3ExpectedNames,
} from '@data/ocrMocks/quitoque-v3';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const mockRecognize = TextRecognition.recognize as jest.Mock;

const makeBlock = (text: string) => ({
  recognizedLanguages: [],
  text,
  lines: [{ elements: [], recognizedLanguages: [], text }],
});

describe('recognizeIngredientNames on Android', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hellofresh real device data', () => {
    test('parses ingredient names without units from Android OCR result', async () => {
      mockRecognize.mockResolvedValue(hellofreshAndroidNames);

      const result = await recognizeIngredientNames('file://hellofresh-names.jpg');

      expect(result).toHaveLength(hellofreshExpectedNames.length);
      hellofreshExpectedNames.forEach(({ name, unit }, i) => {
        expect(result[i].name).toBe(name);
        expect(result[i].unit).toBe(unit);
      });
    });
  });

  describe('quitoque-v1 real device data', () => {
    test('parses ingredient names and extracts units from parentheses', async () => {
      mockRecognize.mockResolvedValue(quitoqueV1AndroidNames);

      const result = await recognizeIngredientNames('file://quitoque-v1-names.jpg');

      expect(result).toHaveLength(quitoqueV1ExpectedNames.length);
      quitoqueV1ExpectedNames.forEach(({ name, unit }, i) => {
        expect(result[i].name).toBe(name);
        expect(result[i].unit).toBe(unit);
      });
    });

    test('extracts unit "sachet" from "cumin (sachet)"', async () => {
      mockRecognize.mockResolvedValue(quitoqueV1AndroidNames);

      const result = await recognizeIngredientNames('file://quitoque-v1-names.jpg');

      const cumin = result.find(r => r.name === 'cumin');
      expect(cumin).toBeDefined();
      expect(cumin?.unit).toBe('sachet');
    });
  });

  describe('quitoque-v2 real device data', () => {
    test('parses ingredient names with mixed units from Android OCR result', async () => {
      mockRecognize.mockResolvedValue(quitoqueV2AndroidNames);

      const result = await recognizeIngredientNames('file://quitoque-v2-names.jpg');

      expect(result).toHaveLength(quitoqueV2ExpectedNames.length);
      quitoqueV2ExpectedNames.forEach(({ name, unit }, i) => {
        expect(result[i].name).toBe(name);
        expect(result[i].unit).toBe(unit);
      });
    });
  });

  describe('quitoque-v3 real device data', () => {
    test('parses ingredient names with compound units from Android OCR result', async () => {
      mockRecognize.mockResolvedValue(quitoqueV3AndroidNames);

      const result = await recognizeIngredientNames('file://quitoque-v3-names.jpg');

      expect(result).toHaveLength(quitoqueV3ExpectedNames.length);
      quitoqueV3ExpectedNames.forEach(({ name, unit }, i) => {
        expect(result[i].name).toBe(name);
        expect(result[i].unit).toBe(unit);
      });
    });

    test('extracts compound unit "g égoutté" from "conserve (g égoutté) Bio"', async () => {
      mockRecognize.mockResolvedValue(quitoqueV3AndroidNames);

      const result = await recognizeIngredientNames('file://quitoque-v3-names.jpg');

      const conserve = result.find(r => r.name.startsWith('conserve'));
      expect(conserve).toBeDefined();
      expect(conserve?.unit).toBe('g égoutté');
    });
  });

  describe('box header stripping', () => {
    test('strips "Dans votre box" header from first line', async () => {
      const withBoxHeader: TextRecognitionResult = {
        text: 'Dans votre box\nSugar (g)\nFlour',
        blocks: [makeBlock('Dans votre box'), makeBlock('Sugar (g)'), makeBlock('Flour')],
      };

      mockRecognize.mockResolvedValue(withBoxHeader);

      const result = await recognizeIngredientNames('file://with-header.jpg');

      expect(result.map(r => r.name)).not.toContain('Dans votre box');
      expect(result.find(r => r.name === 'Sugar')).toBeDefined();
      expect(result.find(r => r.name === 'Sugar')?.unit).toBe('g');
      expect(result.find(r => r.name === 'Flour')).toBeDefined();
    });

    test('strips "box" header (case-insensitive) from first line', async () => {
      const withBoxHeader: TextRecognitionResult = {
        text: 'In your box\nCarrot\nPotato (g)',
        blocks: [makeBlock('In your box'), makeBlock('Carrot'), makeBlock('Potato (g)')],
      };

      mockRecognize.mockResolvedValue(withBoxHeader);

      const result = await recognizeIngredientNames('file://with-box-header.jpg');

      expect(result.map(r => r.name)).not.toContain('In your box');
      expect(result.some(r => r.name === 'Carrot')).toBe(true);
    });

    test('does not strip header when it does not match box patterns', async () => {
      const withoutBoxHeader: TextRecognitionResult = {
        text: 'Tomato\nPepper',
        blocks: [makeBlock('Tomato'), makeBlock('Pepper')],
      };

      mockRecognize.mockResolvedValue(withoutBoxHeader);

      const result = await recognizeIngredientNames('file://no-header.jpg');

      expect(result.some(r => r.name === 'Tomato')).toBe(true);
      expect(result.some(r => r.name === 'Pepper')).toBe(true);
    });
  });

  test('returns empty array when OCR returns no blocks', async () => {
    mockRecognize.mockResolvedValue({ text: '', blocks: [] });

    const result = await recognizeIngredientNames('file://test.jpg');

    expect(result).toEqual([]);
  });

  test('returns empty array when OCR fails', async () => {
    mockRecognize.mockRejectedValue(new Error('OCR failed'));

    const result = await recognizeIngredientNames('file://test.jpg');

    expect(result).toEqual([]);
  });

  test('result elements have name and unit properties', async () => {
    mockRecognize.mockResolvedValue({
      text: 'Sugar (g)',
      blocks: [makeBlock('Sugar (g)')],
    });

    const result = await recognizeIngredientNames('file://test.jpg');

    expect(result.length).toBeGreaterThan(0);
    result.forEach(item => {
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('unit');
    });
  });

  test('normalizes URI without file:// prefix', async () => {
    mockRecognize.mockResolvedValue({ text: '', blocks: [] });

    await recognizeIngredientNames('/path/to/image.jpg');

    expect(mockRecognize).toHaveBeenCalledWith('file:///path/to/image.jpg');
  });

  test('ingredient with no parentheses has empty unit', async () => {
    mockRecognize.mockResolvedValue({
      text: 'Carrot',
      blocks: [makeBlock('Carrot')],
    });

    const result = await recognizeIngredientNames('file://test.jpg');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Carrot');
    expect(result[0].unit).toBe('');
  });

  test('ingredient with unit in parentheses has name and unit separated', async () => {
    mockRecognize.mockResolvedValue({
      text: 'Flour (g)',
      blocks: [makeBlock('Flour (g)')],
    });

    const result = await recognizeIngredientNames('file://test.jpg');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Flour');
    expect(result[0].unit).toBe('g');
  });

  test('handles single block with multiple ingredient lines', async () => {
    mockRecognize.mockResolvedValue({
      text: 'Carrot\nPotato (g)',
      blocks: [
        {
          recognizedLanguages: [],
          text: 'Carrot\nPotato (g)',
          lines: [
            { elements: [], recognizedLanguages: [], text: 'Carrot' },
            { elements: [], recognizedLanguages: [], text: 'Potato (g)' },
          ],
        },
      ],
    });

    const result = await recognizeIngredientNames('file://test.jpg');

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Carrot');
    expect(result[1].name).toBe('Potato');
    expect(result[1].unit).toBe('g');
  });
});
