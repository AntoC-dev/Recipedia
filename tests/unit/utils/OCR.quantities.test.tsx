import { recognizeIngredientQuantities } from '@utils/OCR';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import {
  quantitiesOcrResult,
  iosQuantitiesOcrResult,
  expectedIosQuantities,
} from '@data/ocrMocks/hellofresh';
import {
  quantitiesOcrResult as quitoqueV1QuantitiesOcrResult,
  iosQuantitiesOcrResult as quitoqueV1IosQuantitiesOcrResult,
  expectedQuantities as quitoqueV1ExpectedQuantities,
  expectedIosQuantities as quitoqueV1ExpectedIosQuantities,
} from '@data/ocrMocks/quitoque-v1';
import {
  quantitiesOcrResult as quitoqueV2QuantitiesOcrResult,
  iosQuantitiesOcrResult as quitoqueV2IosQuantitiesOcrResult,
  expectedQuantities as quitoqueV2ExpectedQuantities,
  expectedIosQuantities as quitoqueV2ExpectedIosQuantities,
} from '@data/ocrMocks/quitoque-v2';
import {
  quantitiesOcrResult as quitoqueV3QuantitiesOcrResult,
  iosQuantitiesOcrResult as quitoqueV3IosQuantitiesOcrResult,
  expectedQuantities as quitoqueV3ExpectedQuantities,
  expectedIosQuantities as quitoqueV3ExpectedIosQuantities,
} from '@data/ocrMocks/quitoque-v3';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const mockRecognize = TextRecognition.recognize as jest.Mock;

describe('recognizeIngredientQuantities', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('parses a quantities column with plain numbers', async () => {
    mockRecognize.mockResolvedValue({
      text: '1\n2\n3\n400',
      blocks: [
        {
          recognizedLanguages: [],
          text: '1\n2\n3\n400',
          frame: { top: 0, left: 0, width: 50, height: 100 },
          lines: [
            {
              elements: [],
              recognizedLanguages: [],
              text: '1',
              frame: { top: 0, left: 0, width: 20, height: 20 },
            },
            {
              elements: [],
              recognizedLanguages: [],
              text: '2',
              frame: { top: 25, left: 0, width: 20, height: 20 },
            },
            {
              elements: [],
              recognizedLanguages: [],
              text: '3',
              frame: { top: 50, left: 0, width: 20, height: 20 },
            },
            {
              elements: [],
              recognizedLanguages: [],
              text: '400',
              frame: { top: 75, left: 0, width: 40, height: 20 },
            },
          ],
        },
      ],
    });

    const result = await recognizeIngredientQuantities('file://test.jpg');

    expect(result).toEqual(['1', '2', '3', '400']);
  });

  test('normalizes URI without file:// prefix', async () => {
    mockRecognize.mockResolvedValue({
      text: '100',
      blocks: [
        {
          recognizedLanguages: [],
          text: '100',
          lines: [
            {
              elements: [],
              recognizedLanguages: [],
              text: '100',
              frame: { top: 0, left: 0, width: 30, height: 20 },
            },
          ],
        },
      ],
    });

    await recognizeIngredientQuantities('/path/to/image.jpg');

    expect(mockRecognize).toHaveBeenCalledWith('file:///path/to/image.jpg');
  });

  describe('hellofresh real device data', () => {
    test('parses quantities with units using Android OCR result', async () => {
      mockRecognize.mockResolvedValue(quantitiesOcrResult);

      const result = await recognizeIngredientQuantities('file://quantities.jpg');

      expect(result).toEqual([
        '140 g',
        '1 pièce',
        '1 pièce',
        '1 pièce',
        '3g',
        '1 pièce',
        '2 cm',
        '40 ml',
        '10 ml',
        '2 pièce',
        '2 cc',
      ]);
    });

    test('sorts out-of-order lines from multi-row iOS blocks', async () => {
      mockRecognize.mockResolvedValue(iosQuantitiesOcrResult);

      const result = await recognizeIngredientQuantities('file://ios-quantities.jpg');

      expect(result).toEqual(expectedIosQuantities);
    });
  });

  describe('quitoque-v1 real device data', () => {
    test('parses single Android quantity', async () => {
      mockRecognize.mockResolvedValue(quitoqueV1QuantitiesOcrResult);

      const result = await recognizeIngredientQuantities('file://quitoque-v1-quantities.jpg');

      expect(result).toEqual(quitoqueV1ExpectedQuantities);
    });

    test('sorts iOS quantity blocks by vertical position', async () => {
      mockRecognize.mockResolvedValue(quitoqueV1IosQuantitiesOcrResult);

      const result = await recognizeIngredientQuantities('file://quitoque-v1-ios-quantities.jpg');

      expect(result).toEqual(quitoqueV1ExpectedIosQuantities);
    });
  });

  describe('quitoque-v2 real device data', () => {
    test('parses single Android quantity', async () => {
      mockRecognize.mockResolvedValue(quitoqueV2QuantitiesOcrResult);

      const result = await recognizeIngredientQuantities('file://quitoque-v2-quantities.jpg');

      expect(result).toEqual(quitoqueV2ExpectedQuantities);
    });

    test('returns same quantity values as iOS data (order determined by frame.top)', async () => {
      mockRecognize.mockResolvedValue(quitoqueV2IosQuantitiesOcrResult);

      const result = await recognizeIngredientQuantities('file://quitoque-v2-ios-quantities.jpg');

      expect(result).toHaveLength(quitoqueV2ExpectedIosQuantities.length);
      expect([...result].sort()).toEqual([...quitoqueV2ExpectedIosQuantities].sort());
    });
  });

  describe('quitoque-v3 real device data', () => {
    test('parses multiple Android quantities', async () => {
      mockRecognize.mockResolvedValue(quitoqueV3QuantitiesOcrResult);

      const result = await recognizeIngredientQuantities('file://quitoque-v3-quantities.jpg');

      expect(result).toEqual(quitoqueV3ExpectedQuantities);
    });

    test('returns same quantity values as iOS data (order determined by frame.top)', async () => {
      mockRecognize.mockResolvedValue(quitoqueV3IosQuantitiesOcrResult);

      const result = await recognizeIngredientQuantities('file://quitoque-v3-ios-quantities.jpg');

      expect(result).toHaveLength(quitoqueV3ExpectedIosQuantities.length);
      expect([...result].sort()).toEqual([...quitoqueV3ExpectedIosQuantities].sort());
    });
  });

  test('returns empty array when OCR returns no blocks', async () => {
    mockRecognize.mockResolvedValue({ text: '', blocks: [] });

    const result = await recognizeIngredientQuantities('file://test.jpg');

    expect(result).toEqual([]);
  });

  test('returns empty array when OCR fails', async () => {
    mockRecognize.mockRejectedValue(new Error('OCR failed'));

    const result = await recognizeIngredientQuantities('file://test.jpg');

    expect(result).toEqual([]);
  });

  test('filters empty lines from OCR result', async () => {
    mockRecognize.mockResolvedValue({
      text: '100\n\n200',
      blocks: [
        {
          recognizedLanguages: [],
          text: '',
          lines: [
            { elements: [], recognizedLanguages: [], text: '100' },
            { elements: [], recognizedLanguages: [], text: '' },
            { elements: [], recognizedLanguages: [], text: '200' },
          ],
        },
      ],
    });

    const result = await recognizeIngredientQuantities('file://test.jpg');

    expect(result).toEqual(['100', '200']);
  });

  test('filters whitespace-only lines', async () => {
    mockRecognize.mockResolvedValue({
      text: '50 g\n   \n1',
      blocks: [
        {
          recognizedLanguages: [],
          text: '',
          lines: [
            {
              elements: [],
              recognizedLanguages: [],
              text: '50 g',
              frame: { top: 0, left: 0, width: 30, height: 20 },
            },
            {
              elements: [],
              recognizedLanguages: [],
              text: '   ',
              frame: { top: 25, left: 0, width: 20, height: 20 },
            },
            {
              elements: [],
              recognizedLanguages: [],
              text: '1',
              frame: { top: 50, left: 0, width: 10, height: 20 },
            },
          ],
        },
      ],
    });

    const result = await recognizeIngredientQuantities('file://test.jpg');

    expect(result).toEqual(['50 g', '1']);
  });

  test('returns one string per non-empty line', async () => {
    mockRecognize.mockResolvedValue({
      text: '100\n200\n1.5',
      blocks: [
        {
          recognizedLanguages: [],
          text: '',
          lines: [
            { elements: [], recognizedLanguages: [], text: '100' },
            { elements: [], recognizedLanguages: [], text: '200' },
            { elements: [], recognizedLanguages: [], text: '1.5' },
          ],
        },
      ],
    });

    const result = await recognizeIngredientQuantities('file://test.jpg');

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    result.forEach(q => expect(typeof q).toBe('string'));
  });

  test('merges lines across multiple blocks', async () => {
    mockRecognize.mockResolvedValue({
      text: '100\n200',
      blocks: [
        {
          recognizedLanguages: [],
          text: '100',
          lines: [
            {
              elements: [],
              recognizedLanguages: [],
              text: '100',
              frame: { top: 0, left: 0, width: 30, height: 20 },
            },
          ],
        },
        {
          recognizedLanguages: [],
          text: '200',
          lines: [
            {
              elements: [],
              recognizedLanguages: [],
              text: '200',
              frame: { top: 30, left: 0, width: 30, height: 20 },
            },
          ],
        },
      ],
    });

    const result = await recognizeIngredientQuantities('file://test.jpg');

    expect(result).toEqual(['100', '200']);
  });

  test('trims surrounding whitespace from each line', async () => {
    mockRecognize.mockResolvedValue({
      text: ' 100 g \n 200 ',
      blocks: [
        {
          recognizedLanguages: [],
          text: '',
          lines: [
            {
              elements: [],
              recognizedLanguages: [],
              text: ' 100 g ',
              frame: { top: 0, left: 0, width: 50, height: 20 },
            },
            {
              elements: [],
              recognizedLanguages: [],
              text: ' 200 ',
              frame: { top: 25, left: 0, width: 30, height: 20 },
            },
          ],
        },
      ],
    });

    const result = await recognizeIngredientQuantities('file://test.jpg');

    expect(result).toEqual(['100 g', '200']);
  });

  test('sorts lines from multiple blocks by vertical position', async () => {
    mockRecognize.mockResolvedValue({
      text: '200\n100',
      blocks: [
        {
          recognizedLanguages: [],
          text: '200',
          lines: [
            {
              elements: [],
              recognizedLanguages: [],
              text: '200',
              frame: { top: 50, left: 0, width: 30, height: 20 },
            },
          ],
        },
        {
          recognizedLanguages: [],
          text: '100',
          lines: [
            {
              elements: [],
              recognizedLanguages: [],
              text: '100',
              frame: { top: 10, left: 0, width: 30, height: 20 },
            },
          ],
        },
      ],
    });

    const result = await recognizeIngredientQuantities('file://test.jpg');

    expect(result).toEqual(['100', '200']);
  });

  test('handles lines without frame (defaults top to 0)', async () => {
    mockRecognize.mockResolvedValue({
      text: 'A\nB',
      blocks: [
        {
          recognizedLanguages: [],
          text: '',
          lines: [
            { elements: [], recognizedLanguages: [], text: 'A' },
            { elements: [], recognizedLanguages: [], text: 'B' },
          ],
        },
      ],
    });

    const result = await recognizeIngredientQuantities('file://test.jpg');

    expect(result).toHaveLength(2);
  });
});
