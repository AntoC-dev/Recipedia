import { recognizeText } from '@utils/OCR';
import { recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { iosPersonsAndTimeOcrResult, expectedIosPersonsAndTime } from '@data/ocrMocks/quitoque-v1';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const mockRecognize = TextRecognition.recognize as jest.Mock;

describe('persons and time on iOS real device data', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('pairs each serving count with the time printed on its own line', async () => {
    mockRecognize.mockResolvedValue(iosPersonsAndTimeOcrResult);

    expect(
      await recognizeText('file://quitoque-v1-ios-persons-time.jpg', recipeColumnsNames.time)
    ).toEqual(expectedIosPersonsAndTime);
  });

  test('reports the same pairing whether asked for persons or time', async () => {
    mockRecognize.mockResolvedValue(iosPersonsAndTimeOcrResult);

    const asPersons = await recognizeText(
      'file://quitoque-v1-ios-persons-time.jpg',
      recipeColumnsNames.persons
    );
    const asTime = await recognizeText(
      'file://quitoque-v1-ios-persons-time.jpg',
      recipeColumnsNames.time
    );

    expect(asPersons).toEqual(expectedIosPersonsAndTime);
    expect(asTime).toEqual(expectedIosPersonsAndTime);
  });
});
