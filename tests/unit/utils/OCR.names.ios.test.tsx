import { recognizeIngredientNames } from '@utils/OCR';
import TextRecognition, { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import {
  iosNamesOcrResult as hellofreshIosNames,
  expectedIosIngredientNames as hellofreshExpectedIosNames,
} from '@data/ocrMocks/hellofresh';
import {
  iosNamesOcrResult as quitoqueV1IosNames,
  expectedIosIngredientNames as quitoqueV1ExpectedIosNames,
} from '@data/ocrMocks/quitoque-v1';
import {
  iosNamesOcrResult as quitoqueV2IosNames,
  expectedIosIngredientNames as quitoqueV2ExpectedIosNames,
} from '@data/ocrMocks/quitoque-v2';
import {
  iosNamesOcrResult as quitoqueV3IosNames,
  expectedIosIngredientNames as quitoqueV3ExpectedIosNames,
} from '@data/ocrMocks/quitoque-v3';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const mockRecognize = TextRecognition.recognize as jest.Mock;

const makeBlock = (text: string) => ({
  recognizedLanguages: [],
  text,
  lines: [{ elements: [], recognizedLanguages: [], text }],
});

describe('recognizeIngredientNames on iOS', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hellofresh real device data', () => {
    test('parses ingredient names from iOS OCR result', async () => {
      mockRecognize.mockResolvedValue(hellofreshIosNames);

      const result = await recognizeIngredientNames('file://hellofresh-ios-names.jpg');

      expect(result).toHaveLength(hellofreshExpectedIosNames.length);
      hellofreshExpectedIosNames.forEach(({ name, unit }, i) => {
        expect(result[i].name).toBe(name);
        expect(result[i].unit).toBe(unit);
      });
    });
  });

  describe('quitoque-v1 real device data', () => {
    test('parses ingredient names from iOS OCR result with iOS-specific block structure', async () => {
      mockRecognize.mockResolvedValue(quitoqueV1IosNames);

      const result = await recognizeIngredientNames('file://quitoque-v1-ios-names.jpg');

      expect(result).toHaveLength(quitoqueV1ExpectedIosNames.length);
      quitoqueV1ExpectedIosNames.forEach(({ name, unit }, i) => {
        expect(result[i].name).toBe(name);
        expect(result[i].unit).toBe(unit);
      });
    });

    test('extracts unit "sachet" from "cumin (sachet)" on iOS', async () => {
      mockRecognize.mockResolvedValue(quitoqueV1IosNames);

      const result = await recognizeIngredientNames('file://quitoque-v1-ios-names.jpg');

      const cumin = result.find(r => r.name === 'cumin');
      expect(cumin).toBeDefined();
      expect(cumin?.unit).toBe('sachet');
    });
  });

  describe('quitoque-v2 real device data', () => {
    test('parses ingredient names with units from iOS OCR result', async () => {
      mockRecognize.mockResolvedValue(quitoqueV2IosNames);

      const result = await recognizeIngredientNames('file://quitoque-v2-ios-names.jpg');

      expect(result).toHaveLength(quitoqueV2ExpectedIosNames.length);
      quitoqueV2ExpectedIosNames.forEach(({ name, unit }, i) => {
        expect(result[i].name).toBe(name);
        expect(result[i].unit).toBe(unit);
      });
    });

    test('parses multi-line iOS blocks correctly for ingredient names', async () => {
      mockRecognize.mockResolvedValue(quitoqueV2IosNames);

      const result = await recognizeIngredientNames('file://quitoque-v2-ios-names.jpg');

      expect(result.every(r => typeof r.name === 'string' && r.name.length > 0)).toBe(true);
      expect(result.every(r => typeof r.unit === 'string')).toBe(true);
    });
  });

  describe('quitoque-v3 real device data', () => {
    test('parses ingredient names with compound units from iOS OCR result', async () => {
      mockRecognize.mockResolvedValue(quitoqueV3IosNames);

      const result = await recognizeIngredientNames('file://quitoque-v3-ios-names.jpg');

      expect(result).toHaveLength(quitoqueV3ExpectedIosNames.length);
      quitoqueV3ExpectedIosNames.forEach(({ name, unit }, i) => {
        expect(result[i].name).toBe(name);
        expect(result[i].unit).toBe(unit);
      });
    });
  });

  describe('box header stripping', () => {
    test('strips "Dans votre box" from first line on iOS', async () => {
      const withBoxHeader: TextRecognitionResult = {
        text: 'Dans votre box\nSugar (g)\nFlour',
        blocks: [makeBlock('Dans votre box'), makeBlock('Sugar (g)'), makeBlock('Flour')],
      };

      mockRecognize.mockResolvedValue(withBoxHeader);

      const result = await recognizeIngredientNames('file://ios-with-header.jpg');

      expect(result.map(r => r.name)).not.toContain('Dans votre box');
      expect(result.find(r => r.name === 'Sugar')).toBeDefined();
      expect(result.find(r => r.name === 'Sugar')?.unit).toBe('g');
    });

    test('strips box header from multi-line block when first line contains header', async () => {
      const withBoxHeaderInMultiLineBlock: TextRecognitionResult = {
        text: 'Dans votre box\nOignon (g)\nPoivron',
        blocks: [
          {
            recognizedLanguages: [],
            text: 'Dans votre box\nOignon (g)',
            lines: [
              { elements: [], recognizedLanguages: [], text: 'Dans votre box' },
              { elements: [], recognizedLanguages: [], text: 'Oignon (g)' },
            ],
          },
          makeBlock('Poivron'),
        ],
      };

      mockRecognize.mockResolvedValue(withBoxHeaderInMultiLineBlock);

      const result = await recognizeIngredientNames('file://ios-header-multiline.jpg');

      expect(result.map(r => r.name)).not.toContain('Dans votre box');
    });

    test('does not strip header when first line is a real ingredient', async () => {
      const withoutBoxHeader: TextRecognitionResult = {
        text: 'Tomato\nPepper',
        blocks: [makeBlock('Tomato'), makeBlock('Pepper')],
      };

      mockRecognize.mockResolvedValue(withoutBoxHeader);

      const result = await recognizeIngredientNames('file://ios-no-header.jpg');

      expect(result.some(r => r.name === 'Tomato')).toBe(true);
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
      text: 'Flour (g)',
      blocks: [makeBlock('Flour (g)')],
    });

    const result = await recognizeIngredientNames('file://test.jpg');

    expect(result.length).toBeGreaterThan(0);
    result.forEach(item => {
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('unit');
    });
  });

  test('normalizes URI without file:// prefix on iOS', async () => {
    mockRecognize.mockResolvedValue({ text: '', blocks: [] });

    await recognizeIngredientNames('/ios/path/to/image.jpg');

    expect(mockRecognize).toHaveBeenCalledWith('file:///ios/path/to/image.jpg');
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

  test('handles iOS multi-line blocks with ingredient names across lines', async () => {
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

  test('handles ingredient with multiple parenthetical notes', async () => {
    mockRecognize.mockResolvedValue({
      text: 'conserve (g égoutté) Bio',
      blocks: [makeBlock('conserve (g égoutté) Bio')],
    });

    const result = await recognizeIngredientNames('file://test.jpg');

    expect(result).toHaveLength(1);
    expect(result[0].unit).toBe('g égoutté');
    expect(result[0].name).toContain('conserve');
    expect(result[0].name).toContain('Bio');
  });
});
