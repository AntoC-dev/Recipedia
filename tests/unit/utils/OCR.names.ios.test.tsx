import { recognizeIngredientNames } from '@utils/OCR';
import TextRecognition from '@react-native-ml-kit/text-recognition';

jest.mock('@react-native-ml-kit/text-recognition', () => ({
  __esModule: true,
  default: {
    recognize: jest.fn(),
  },
}));

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const mockRecognize = TextRecognition.recognize as jest.Mock;

describe('recognizeIngredientNames on iOS', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test.todo('parses ingredient names and units from iOS OCR result');

  test.todo('strips box header line from iOS OCR result');

  test.todo('returns empty array when OCR fails');

  test('returns empty array when OCR returns no blocks', async () => {
    mockRecognize.mockResolvedValue({ text: '', blocks: [] });

    const result = await recognizeIngredientNames('file://test.jpg');

    expect(result).toEqual([]);
  });

  test('result elements have name and unit properties', async () => {
    mockRecognize.mockResolvedValue({
      text: 'Flour (g)',
      blocks: [
        {
          recognizedLanguages: [],
          text: '',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Flour (g)' }],
        },
      ],
    });

    const result = await recognizeIngredientNames('file://test.jpg');

    expect(result.length).toBeGreaterThan(0);
    result.forEach(item => {
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('unit');
    });
  });
});
