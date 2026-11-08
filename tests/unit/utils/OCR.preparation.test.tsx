import { recognizeText } from '@utils/OCR';
import { preparationStepElement, recipeColumnsNames } from '@customTypes/DatabaseElementTypes';
import TextRecognition, { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { iosPreparationOcrResult, expectedIosPreparation } from '@data/ocrMocks/hellofresh';
import { buildResult } from '@data/ocrMocks/builders';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const mockRecognize = TextRecognition.recognize as jest.Mock;

const blockHeight = 20;

const makeResult = (texts: string[]): TextRecognitionResult =>
  buildResult(
    texts.map((text, index) => ({ text, top: index * blockHeight, height: blockHeight }))
  );

afterEach(() => {
  jest.clearAllMocks();
});

describe('preparation on iOS real device data', () => {
  test('keeps standalone time ranges and quantities inside their step', async () => {
    mockRecognize.mockResolvedValue(iosPreparationOcrResult);

    expect(
      await recognizeText('file://hellofresh-ios-preparation.jpg', recipeColumnsNames.preparation)
    ).toEqual(expectedIosPreparation);
  });
});

describe('preparation step number detection', () => {
  test.each([
    '12-14 min.',
    '12 - 14 min',
    '2–4 min',
    "30 ml d'eau.",
    '150 g de riz',
    '150g de riz',
    '2 cs de sucre',
    '1 cc de sel',
    '20 cl de crème',
    '1,5 l de bouillon',
    '1 kg de pommes de terre',
    '2 pièces de poulet',
    '3 gousses d’ail',
    '2 bouquets de coriandre',
    '1 sachet de levure',
    '4 oz. butter',
    '2 tbsp honey',
    '1:30 de cuisson',
    '1.5 l of stock',
    '30 Ml',
    '12 Min.',
  ])('appends standalone block "%s" to the current step', async standaloneText => {
    mockRecognize.mockResolvedValue(makeResult(['1', 'Cuire le riz', 'Portez', standaloneText]));

    expect(await recognizeText('file://prep.jpg', recipeColumnsNames.preparation)).toEqual([
      { title: 'Cuire le riz', description: `Portez\n${standaloneText}` },
    ]);
  });

  test.each([
    '2. Cuire les légumes',
    '2) Cuire les légumes',
    '2: Cuire les légumes',
    '2 Cuire les légumes',
    '2 Cuire les légumes\nCoupez',
  ])('starts a new step for numbered block "%s"', async numberedText => {
    mockRecognize.mockResolvedValue(makeResult(['1. Cuire le riz', 'Portez', numberedText]));

    const received = (await recognizeText(
      'file://prep.jpg',
      recipeColumnsNames.preparation
    )) as preparationStepElement[];

    expect(received).toHaveLength(2);
    expect(received[1]!.title).toBe('Cuire les légumes');
  });

  test('accepts step numbers out of order across columns', async () => {
    mockRecognize.mockResolvedValue(
      makeResult([
        '1. Cuire le riz',
        'Portez',
        '3. Faire la sauce',
        'Mélangez',
        '2. Cuire les légumes',
        'Coupez',
      ])
    );

    expect(await recognizeText('file://prep.jpg', recipeColumnsNames.preparation)).toEqual([
      { title: 'Cuire le riz', description: 'Portez' },
      { title: 'Cuire les légumes', description: 'Coupez' },
      { title: 'Faire la sauce', description: 'Mélangez' },
    ]);
  });

  test('accepts a scan that starts in the middle of the recipe', async () => {
    mockRecognize.mockResolvedValue(makeResult(['5. Dresser', 'Servez', '6 Déguster', 'Savourez']));

    expect(await recognizeText('file://prep.jpg', recipeColumnsNames.preparation)).toEqual([
      { title: 'Dresser', description: 'Servez' },
      { title: 'Déguster', description: 'Savourez' },
    ]);
  });

  test('keeps a step numbered zero', async () => {
    mockRecognize.mockResolvedValue(
      makeResult(['0. Préchauffer', 'Allumez le four', '1. Cuire le riz', 'Portez'])
    );

    expect(await recognizeText('file://prep.jpg', recipeColumnsNames.preparation)).toEqual([
      { title: 'Préchauffer', description: 'Allumez le four' },
      { title: 'Cuire le riz', description: 'Portez' },
    ]);
  });

  test.each(['30', '250'])(
    'does not pair out-of-sequence number block "%s" with a following title',
    async strayNumber => {
      mockRecognize.mockResolvedValue(
        makeResult(['1', 'Cuire le riz', 'Portez', strayNumber, 'Cuire les légumes'])
      );

      expect(await recognizeText('file://prep.jpg', recipeColumnsNames.preparation)).toEqual([
        { title: 'Cuire le riz', description: 'Portez\nCuire les légumes' },
      ]);
    }
  );

  test('uses a standalone step number for the numbered block that follows it', async () => {
    mockRecognize.mockResolvedValue(
      makeResult(['1. Cuire le riz', 'Portez', '2', '2. Cuire les légumes', 'Coupez'])
    );

    expect(await recognizeText('file://prep.jpg', recipeColumnsNames.preparation)).toEqual([
      { title: 'Cuire le riz', description: 'Portez' },
      { title: 'Cuire les légumes', description: 'Coupez' },
    ]);
  });

  test('pairs a standalone step number read twice with a single title', async () => {
    mockRecognize.mockResolvedValue(
      makeResult(['1', '1', 'Cuire le riz', 'Portez', 'Cuire les légumes'])
    );

    expect(await recognizeText('file://prep.jpg', recipeColumnsNames.preparation)).toEqual([
      { title: 'Cuire le riz', description: 'Portez\nCuire les légumes' },
    ]);
  });

  test.each(['123. Cuire les légumes', '100 Cuire les légumes'])(
    'treats three-digit leading number "%s" as text',
    async longNumberText => {
      mockRecognize.mockResolvedValue(makeResult(['1. Cuire le riz', 'Portez', longNumberText]));

      expect(await recognizeText('file://prep.jpg', recipeColumnsNames.preparation)).toEqual([
        { title: 'Cuire le riz', description: `Portez\n${longNumberText}` },
      ]);
    }
  );

  test('takes the title from the line after a step number alone on its line', async () => {
    mockRecognize.mockResolvedValue(
      makeResult(['1. Cuire le riz', 'Portez', '2.\nCuire les légumes\nCoupez les carottes'])
    );

    expect(await recognizeText('file://prep.jpg', recipeColumnsNames.preparation)).toEqual([
      { title: 'Cuire le riz', description: 'Portez' },
      { title: 'Cuire les légumes', description: 'coupez les carottes' },
    ]);
  });

  test('ignores a repeated step number', async () => {
    mockRecognize.mockResolvedValue(
      makeResult(['1. Cuire le riz', 'Portez', '1. Cuire le riz', 'Égouttez'])
    );

    expect(await recognizeText('file://prep.jpg', recipeColumnsNames.preparation)).toEqual([
      { title: 'Cuire le riz', description: 'Portez\n1. Cuire le riz\nÉgouttez' },
    ]);
  });
});
