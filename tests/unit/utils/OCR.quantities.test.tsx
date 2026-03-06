import { recognizeIngredientQuantities } from '@utils/OCR';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import {
  quantitiesOcrResult,
  iosQuantitiesOcrResult,
  expectedIosQuantities,
} from '@data/ocrMocks/hellofresh';

jest.mock('@react-native-ml-kit/text-recognition', () => ({
  __esModule: true,
  default: {
    recognize: jest.fn(),
  },
}));

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
});
