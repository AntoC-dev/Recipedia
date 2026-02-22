import {
  extractFieldFromImage,
  ingredientObject,
  ingredientQuantityPerPersons,
  personAndTimeObject,
  recognizeText,
  WarningHandler,
} from '@utils/OCR';
import { nutritionObject } from '@customTypes/OCRTypes';
import {
  FormIngredientElement,
  recipeColumnsNames,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import TextRecognition, {
  TextBlock,
  TextLine,
  TextRecognitionResult,
} from '@react-native-ml-kit/text-recognition';

jest.mock('@react-native-ml-kit/text-recognition', () => ({
  __esModule: true,
  default: {
    recognize: jest.fn(),
  },
}));

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const mockRecognize = TextRecognition.recognize as jest.Mock;
const mockWarn: WarningHandler = jest.fn();

describe('OCR Utility Functions', () => {
  const uriForOCR = 'not used';
  const baseState = {
    recipePreparation: [],
    recipePersons: 4,
    recipeIngredients: [],
    recipeTags: [],
  };

  const createBlock = (text: string): TextBlock => ({
    recognizedLanguages: [],
    text: '',
    lines: [{ elements: [], recognizedLanguages: [], text }],
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('on title field', () => {
    const mockResultTitle: TextRecognitionResult = {
      text: 'POULET SAUCE\nSATAY (CACAHUETES\nET LAIT DE COCO)',
      blocks: new Array<TextBlock>(
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'POULET SAUCE',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'SATAY (CACAHUETES',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: ' ET LAIT DE COCO)',
          }),
        }
      ),
    };

    test('on recognizeText returns the correct value', async () => {
      mockRecognize.mockResolvedValue(mockResultTitle);

      expect(await recognizeText(uriForOCR, recipeColumnsNames.title)).toEqual(
        'POULET SAUCE SATAY (CACAHUETES ET LAIT DE COCO)'
      );
    });
    test('on extractFieldFromImage return recipeTitle when OCR gives valid string', async () => {
      mockRecognize.mockResolvedValue(mockResultTitle);

      const result = await extractFieldFromImage(
        uriForOCR,
        recipeColumnsNames.title,
        baseState,
        mockWarn
      );
      expect(result).toEqual({ recipeTitle: 'POULET SAUCE SATAY (CACAHUETES ET LAIT DE COCO)' });
      expect(mockWarn).not.toHaveBeenCalled();
    });
  });

  describe('on description field', () => {
    const mockResultDescription: TextRecognitionResult = {
      text: "La sauce satay est une sauce d'Asie du Sud-Est\nà base de cacahuètes, ail et gingembre !\nReproduisez-la pour accompagner\nnotre poulet français!",
      blocks: new Array<TextBlock>(
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: "La sauce satay est une sauce d'Asie du Sud-Est",
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'à base de cacahuètes, ail et gingembre !',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'Reproduisez-la pour accompagner',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'notre poulet français!',
          }),
        }
      ),
    };
    const expectedDescription =
      "La sauce satay est une sauce d'Asie du Sud-Est à base de cacahuètes, ail et gingembre ! Reproduisez-la pour accompagner notre poulet français!";
    test('on recognizeText returns the correct value', async () => {
      mockRecognize.mockResolvedValue(mockResultDescription);

      expect(await recognizeText(uriForOCR, recipeColumnsNames.description)).toEqual(
        expectedDescription
      );
    });
    test('on extractFieldFromImage return recipeTitle when OCR gives valid string', async () => {
      mockRecognize.mockResolvedValue(mockResultDescription);

      const result = await extractFieldFromImage(
        uriForOCR,
        recipeColumnsNames.description,
        baseState,
        mockWarn
      );
      expect(result).toEqual({ recipeDescription: expectedDescription });
      expect(mockWarn).not.toHaveBeenCalled();
    });
  });

  describe('on preparation field', () => {
    const mockResultPreparationQuitoqueIOS: TextRecognitionResult = {
      text: "1. LA PRÉPARATION\n•Émincez l'oignon.\n•Épluchez et coupez la carotte en demi-rondelles.\n•Coupez et retirez la base du poireau.\nIncisez-le en deux dans la longueur et rincez-le soigneusement. Emincez-le.\n•Retirez la partie racine de la citronnelle (5 cm environ). Emincez finement le reste.\n•Pressez ou hachez l'ail.\n•Egouttez et rincez les pois chiches.\n2. LE CURRY\n•Dans une sauteuse, faites chauffer un filet d'huile de cuisson à feu moyen à vif.\nFaites revenir l'oignon, le poireau, la carotte, l'ail, la citronnelle et les épices cachemire\n10 min environ. Salez, poivrez.\nAstuce: Ne remuez pas les légumes immédiatement après les avoir déposés dans la sauteuse,\nlaissez-les caraméliser quelques minutes pour obtenir une belle couleur dorée.\n• Au bout des 10 min, ajoutez le lait de coco et laissez mijoter 10 min à couvert.\n•Ajoutez la purée de tomates et les pois chiches égouttés et poursuivez la cuisson 10 min.\nSalez, poivrez.\n•Goûtez et rectifiez l'assaisonnement si nécessaire.\n•En parallèle, faites cuire le riz.\n3. LE RIZ\n•Portez à ébullition une casserole d'eau salée.\nFaites cuire le riz selon les indications du paquet.\n•Pendant ce temps, retirez la base de la cébette et émincez-la.\nParsemez-la sur le curry au moment de servir.",
      blocks: new Array<TextBlock>(
        {
          recognizedLanguages: [],
          text: '1. LA PRÉPARATION',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "•Émincez l'oignon.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '•Épluchez et coupez la carotte en demi-rondelles.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '•Coupez et retirez la base du poireau.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Incisez-le en deux dans la longueur et rincez-le soigneusement. Emincez-le.\n•Retirez la partie racine de la citronnelle (5 cm environ). Emincez finement le reste.\n• Pressez ou hachez l'ail.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '•Egouttez et rincez les pois chiches.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '2. LE CURRY',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "•Dans une sauteuse, faites chauffer un filet d'huile de cuisson à feu moyen à vif.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Faites revenir l'oignon, le poireau, la carotte, l'ail, la citronnelle et les épices cachemire",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '10 min environ. Salez, poivrez.\nAstuce: Ne remuez pas les légumes immédiatement après les avoir déposés dans la sauteuse, laissez-les caraméliser quelques minutes pour obtenir une belle couleur dorée.\n• Au bout des 10 min, ajoutez le lait de coco et laissez mijoter 10 min à couvert.\n•Ajoutez la purée de tomates et les pois chiches égouttés et poursuivez la cuisson 10 min.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Salez, poivrez.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "•Goûtez et rectifiez l'assaisonnement si nécessaire.\n•En parallèle, faites cuire le riz.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '3. LE RIZ',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "•Portez à ébullition une casserole d'eau salée.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Faites cuire le riz selon les indications du paquet.\n•Pendant ce temps, retirez la base de la cébette et émincez-la.\nParsemez-la sur le curry au moment de servir.',
          lines: new Array<TextLine>(),
        }
      ),
    };

    const mockResultPreparationQuitoque: TextRecognitionResult = {
      text: "1. LA PRÉPARATION\n•Émincez l'oignon.\n•Épluchez et coupez la carotte en demi-rondelles.\n•Coupez et retirez la base du poireau.\nIncisez-le en deux dans la longueur et rincez-le soigneusement. Émincez-le.\n•Retirez la partie racine de la citronnelle (5 cm environ). Émincez finement le reste.\n•Pressez ou hachez I'ail.\n•Egouttez et rincez les pois chiches.\n2. LE CURRY\n•Dans une sauteuse, faites chauffer un filet d'huile de cuisson à feu moyen à vif.\nFaites revenir l'oignon, le poireau, la carotte, I'ail, la citronnelle et les épices cachemire\n10 min environ. Salez, poivrez.\nAstuce: Ne remuez pas les légumes immédiatement après les avoir déposés dans la sauteuse,\nlaissez-les caraméliser quelques minutes pour obtenir une belle couleur dorée.\n• Au bout des 10 min, ajoutez le lait de coco et laissez mijoter 10 min à couvert.\n• Ajoutez la purée de tomates et les pois chiches égouttés et poursuivez la cuisson 10 min.\nSalez, poivrez.\n•Goûtez et rectifiez l'assaisonnement si nécessaire.\n•En parallèle, faites cuire le riz.\n3. LE RIZ\n•Portezà ébullition une casserole d'eau salée.\nFaites cuire le riz selon les indications du paquet.\n•Pendant ce temps, retirez la base de la cébette et émincez-la.\nParsemez-la sur le curry au moment de servir.",
      blocks: new Array<TextBlock>(
        {
          recognizedLanguages: [],
          text: "1. LA PRÉPARATION\n•Émincez l'oignon.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '•Epluchez et coupez la carotte en demi-rondelles.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '•Coupez et retirez la base du poireau.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Incisez-le en deux dans la longueur et rincez-le soigneusement. Émincez-le.\n•Retirez la partie racine de la citronnelle (5 cm environ). Émincez finement le reste.\n• Pressez ou hachez l'ail.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '•Egouttez et rincez les pois chiches.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '2. LE CURRY',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "•Dans une sauteuse, faites chauffer un filet d'huile de cuisson à feu moyen à vif.\nFaites revenir l'oignon, le poireau, la carotte, Il'ail, la citronnelle et les épices cachemire\n10 min environ. Salez, poivrez.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Astuce: Ne remuez pas les légumes immédiatement après les avoir déposés dans la sauteuse, laissez-les caraméliser quelques minutes pour obtenir une belle couleur dorée.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '• Au bout des 10 min, ajoutez le lait de coco et laissez mijoter 10 min à couvert.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '• Ajoutez la purée de tomates et les pois chiches égouttés et poursuivez la cuisson 10 min.\nSalez, poivrez.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "• Goûtez et rectifiez l'assaisonnement si nécessaire.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '•En parallèle, faites cuire le riz.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '3. LE RIZ',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "•Portez à ébullition une casserole d'eau salée.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Faites cuire le riz selon les indications du paquet.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '•Pendant ce temps, retirez la base de la cébette et émincez-la.\nParsemez-la sur le curry au moment de servir.',
          lines: new Array<TextLine>(),
        }
      ),
    };
    const expectedPreparationQuitoque = [
      {
        title: 'La préparation',
        description:
          "•émincez l'oignon.\n•Epluchez et coupez la carotte en demi-rondelles.\n•Coupez et retirez la base du poireau.\nIncisez-le en deux dans la longueur et rincez-le soigneusement. Émincez-le.\n•Retirez la partie racine de la citronnelle (5 cm environ). Émincez finement le reste.\n• Pressez ou hachez l'ail.\n•Egouttez et rincez les pois chiches.",
      },
      {
        title: 'Le curry',
        description:
          "•Dans une sauteuse, faites chauffer un filet d'huile de cuisson à feu moyen à vif.\nFaites revenir l'oignon, le poireau, la carotte, Il'ail, la citronnelle et les épices cachemire\n10 min environ. Salez, poivrez.\nAstuce: Ne remuez pas les légumes immédiatement après les avoir déposés dans la sauteuse, laissez-les caraméliser quelques minutes pour obtenir une belle couleur dorée.\n• Au bout des 10 min, ajoutez le lait de coco et laissez mijoter 10 min à couvert.\n• Ajoutez la purée de tomates et les pois chiches égouttés et poursuivez la cuisson 10 min.\nSalez, poivrez.\n• Goûtez et rectifiez l'assaisonnement si nécessaire.\n•En parallèle, faites cuire le riz.",
      },
      {
        title: 'Le riz',
        description:
          "•Portez à ébullition une casserole d'eau salée.\nFaites cuire le riz selon les indications du paquet.\n•Pendant ce temps, retirez la base de la cébette et émincez-la.\nParsemez-la sur le curry au moment de servir.",
      },
    ];
    const expectedPreparationQuitoqueIOS = [
      {
        title: 'La préparation',
        description:
          "•Émincez l'oignon.\n•Épluchez et coupez la carotte en demi-rondelles.\n•Coupez et retirez la base du poireau.\nIncisez-le en deux dans la longueur et rincez-le soigneusement. Emincez-le.\n•Retirez la partie racine de la citronnelle (5 cm environ). Emincez finement le reste.\n• Pressez ou hachez l'ail.\n•Egouttez et rincez les pois chiches.",
      },
      {
        title: 'Le curry',
        description:
          "•Dans une sauteuse, faites chauffer un filet d'huile de cuisson à feu moyen à vif.\nFaites revenir l'oignon, le poireau, la carotte, l'ail, la citronnelle et les épices cachemire\n10 min environ. Salez, poivrez.\nAstuce: Ne remuez pas les légumes immédiatement après les avoir déposés dans la sauteuse, laissez-les caraméliser quelques minutes pour obtenir une belle couleur dorée.\n• Au bout des 10 min, ajoutez le lait de coco et laissez mijoter 10 min à couvert.\n•Ajoutez la purée de tomates et les pois chiches égouttés et poursuivez la cuisson 10 min.\nSalez, poivrez.\n•Goûtez et rectifiez l'assaisonnement si nécessaire.\n•En parallèle, faites cuire le riz.",
      },
      {
        title: 'Le riz',
        description:
          "•Portez à ébullition une casserole d'eau salée.\nFaites cuire le riz selon les indications du paquet.\n•Pendant ce temps, retirez la base de la cébette et émincez-la.\nParsemez-la sur le curry au moment de servir.",
      },
    ];
    const expectedPreparationHelloFresh = [
      {
        title: 'Cuire le riz',
        description:
          "Veillez à bien respecter les quantités indiquées à gauche pour\npréparer votre recette!\nPortez une casserole d'eau salée à ébullition et faites-y cuire le riz\n12-14 min.\nÉgouttez-le et réservez-le à couvert.",
      },
      {
        title: 'Cuire les légumes',
        description:
          "Pendant ce temps, coupez l'oignon en fines demi-lunes. Épluchez\net râpez la carotte. Coupez le poireau en quatre dans l'épaisseur,\nlavez-le bien, puis ciselez-le finement.\nFaites chauffer un filet d'huile d'olive à feu moyen-vif dans un wok\nou une sauteuse. Faites-y revenir les légumes 4-6 min à couvert.\nRemuez régulièrement.\nCONSEIL: Vous pouvez faire cuire les légumes plus longtemps si vous\nles préférez fondants",
      },
      {
        title: 'Faire la sauce',
        description:
          "Pendant ce temps, ciselez la ciboulette et l'ail séparément.\nRâpez le gingembre (si vous le souhaitez avec la peau).\nDans un bol, mélangez I'ail et le gingembre avec la sauce soja\n(voir CONSEIL), l'huile de sésame et, par personne:1 cs de sucre et\n30 ml d'eau.\nCoupez le poulet en 3 aiguillettes.\nCONSEIL:Si vous faites attention à votre consommation de sel ou\nn'aimez pas manger trop salé, réduisez la quantité de sauce soja et de\ngomasio et ne salez pas le plat par la suite.",
      },
      {
        title: 'Finir et servir',
        description:
          "Faites chauffer un filet d'huile d'olive dans une poêle à feu moyen-vif et faites-y cuire le poulet 2-4 min.\nAjoutez la sauce et laissez-la réduire 1-2 min à feu vif, ou jusqu'à ce\nqu'elle soit légèrement nappante (ajoutez un peu d'eau si besoin).\nServez le riz dans des assiettes creuses et disposez les légumes et le\npoulet par-dessus avec la sauce.\nSaupoudrez de ciboulette et de gomasio.\nA vos fourchettes!",
      },
    ];

    const mockResultPreparationHelloFreshIOS: TextRecognitionResult = {
      text: '1\n2\nCuire le riz\nVeillez à bien respecter les quantités indiquées à gauche pour\npréparer votre recette!\n...',
      blocks: new Array<TextBlock>(
        {
          recognizedLanguages: [],
          text: '1',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '2',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Cuire le riz',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Veillez à bien respecter les quantités indiquées à gauche pour\npréparer votre recette!',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Portez une casserole d'eau salée à ébullition et faites-y cuire le riz\n12-14 min.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Égouttez-le et réservez-le à couvert.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Cuire les légumes',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Pendant ce temps, coupez l'oignon en fines demi-lunes. Épluchez\net râpez la carotte. Coupez le poireau en quatre dans l'épaisseur,\nlavez-le bien, puis ciselez-le finement.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Faites chauffer un filet d'huile d'olive à feu moyen-vif dans un wok\nou une sauteuse. Faites-y revenir les légumes 4-6 min à couvert.\nRemuez régulièrement.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'CONSEIL: Vous pouvez faire cuire les légumes plus longtemps si vous\nles préférez fondants',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '3',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '4',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Faire la sauce',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Pendant ce temps, ciselez la ciboulette et l'ail séparément.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Râpez le gingembre (si vous le souhaitez avec la peau).',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Dans un bol, mélangez I'ail et le gingembre avec la sauce soja\n(voir CONSEIL), l'huile de sésame et, par personne:1 cs de sucre et\n30 ml d'eau.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Coupez le poulet en 3 aiguillettes.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "CONSEIL:Si vous faites attention à votre consommation de sel ou\nn'aimez pas manger trop salé, réduisez la quantité de sauce soja et de\ngomasio et ne salez pas le plat par la suite.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Finir et servir',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Faites chauffer un filet d'huile d'olive dans une poêle à feu moyen-vif et faites-y cuire le poulet 2-4 min.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Ajoutez la sauce et laissez-la réduire 1-2 min à feu vif, ou jusqu'à ce\nqu'elle soit légèrement nappante (ajoutez un peu d'eau si besoin).",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Servez le riz dans des assiettes creuses et disposez les légumes et le\npoulet par-dessus avec la sauce.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Saupoudrez de ciboulette et de gomasio.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'A vos fourchettes!',
          lines: new Array<TextLine>(),
        }
      ),
    };

    const mockResultPreparationHelloFresh: TextRecognitionResult = {
      text: "1\nCuire le riz\nVeillez à bien respecter les quantités indiquées à gauche pour\npréparer votre recette!\nPortez une casserole d'eau salée à ébullition et faites-y cuire le riz\n12-14 min.\nÉgouttez-le et réservez-le à couvert.\n3\nFaire la sauce\nPendant ce temps, ciselez la ciboulette et l'ail séparément.\nRâpez le gingembre (si vous le souhaitez avec la peau).\nDans un bol, mélangez l'ail et le gingembre avec la sauce soja\n(voir CONSEIL), l'huile de sésame et, par personne:1 cs de sucre et\n30 ml d'eau.\nCoupez le poulet en 3 aiguillettes.\nCONSEIL:Si vous faites attention à votre consommation de sel ou\nn'aimez pas manger trop salé, réduisez la quantité de sauce soja et de\ngomasio et ne salez pas le plat par la suite.\n2\nCuire les légumes\nPendant ce temps, coupez l'oignon en fines demi-lunes. Épluchez\net râpez la carotte. Coupez le poireau en quatre dans l'épaisseur,\nlavez-le bien, puis ciselez-le finement.\nFaites chauffer un filet d'huile d'olive à feu moyen-if dans un wok\nou une sauteuse. Faites-y revenir les légumes 4-6 min à couvert.\nRemuez régulièrement.\nCONSEIL: Vous pouvez faire cuire les légumes plus longtemps si vous\nles préférez fondants.\nFinir et servir\nFaites chauffer un filet d'huile d'olive dans une poêle à feu moyen-\nvif et faites-y cuire le poulet 2-4 min.\nAjoutez la sauce et laissez-la réduire 12 min à feu vif, ou jusqư'à ce\nqu'elle soit légèrement nappante (ajoutez un peu d'eau si besoin).\nServez le riz dans des assiettes creuses et disposez les légumes et le\npoulet par-dessus avec la sauce.\nSaupoudrez de ciboulette et de gomasio.\nA vos fourchettes!",
      blocks: new Array<TextBlock>(
        {
          recognizedLanguages: [],
          text: '1',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Cuire le riz',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Veillez à bien respecter les quantités indiquées à gauche pour\npréparer votre recette!',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Portez une casserole d'eau salée à ébullition et faites-y cuire le riz\n12-14 min.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Égouttez-le et réservez-le à couvert.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '3',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Faire la sauce',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Pendant ce temps, ciselez la ciboulette et l'ail séparément.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Râpez le gingembre (si vous le souhaitez avec la peau).',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Dans un bol, mélangez I'ail et le gingembre avec la sauce soja\n(voir CONSEIL), l'huile de sésame et, par personne:1 cs de sucre et\n30 ml d'eau.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Coupez le poulet en 3 aiguillettes.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "CONSEIL:Si vous faites attention à votre consommation de sel ou\nn'aimez pas manger trop salé, réduisez la quantité de sauce soja et de\ngomasio et ne salez pas le plat par la suite.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '2',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Cuire les légumes',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Pendant ce temps, coupez l'oignon en fines demi-lunes. Épluchez\net râpez la carotte. Coupez le poireau en quatre dans l'épaisseur,\nlavez-le bien, puis ciselez-le finement.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Faites chauffer un filet d'huile d'olive à feu moyen-vif dans un wok\nou une sauteuse. Faites-y revenir les légumes 4-6 min à couvert.\nRemuez régulièrement.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'CONSEIL: Vous pouvez faire cuire les légumes plus longtemps si vous\nles préférez fondants',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: '4',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Finir et servir',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Faites chauffer un filet d'huile d'olive dans une poêle à feu moyen-vif et faites-y cuire le poulet 2-4 min.",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: "Ajoutez la sauce et laissez-la réduire 1-2 min à feu vif, ou jusqu'à ce\nqu'elle soit légèrement nappante (ajoutez un peu d'eau si besoin).",
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Servez le riz dans des assiettes creuses et disposez les légumes et le\npoulet par-dessus avec la sauce.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'Saupoudrez de ciboulette et de gomasio.',
          lines: new Array<TextLine>(),
        },
        {
          recognizedLanguages: [],
          text: 'A vos fourchettes!',
          lines: new Array<TextLine>(),
        }
      ),
    };

    describe('on recognizeText', () => {
      test('(quitoque) returns the correct value', async () => {
        mockRecognize.mockResolvedValue(mockResultPreparationQuitoque);

        const received = await recognizeText(uriForOCR, recipeColumnsNames.preparation);

        expect(received).toEqual(expectedPreparationQuitoque);
      });
      test('(quitoque iOS) returns correct value with time values not parsed as steps', async () => {
        mockRecognize.mockResolvedValue(mockResultPreparationQuitoqueIOS);

        const received = await recognizeText(uriForOCR, recipeColumnsNames.preparation);

        expect(received).toEqual(expectedPreparationQuitoqueIOS);
      });
      test('(hellofresh) returns the correct value', async () => {
        mockRecognize.mockResolvedValue(mockResultPreparationHelloFresh);

        const received = await recognizeText(uriForOCR, recipeColumnsNames.preparation);

        expect(received).toEqual(expectedPreparationHelloFresh);
      });
      test('(hellofresh iOS) returns the correct value with grouped numbers', async () => {
        mockRecognize.mockResolvedValue(mockResultPreparationHelloFreshIOS);

        const received = await recognizeText(uriForOCR, recipeColumnsNames.preparation);

        expect(received).toEqual(expectedPreparationHelloFresh);
      });
    });

    describe('on extractFieldFromImage', () => {
      test(' (quitoque) return recipePreparation with new steps', async () => {
        mockRecognize.mockResolvedValue(mockResultPreparationQuitoque);

        const result = await extractFieldFromImage(
          uriForOCR,
          recipeColumnsNames.preparation,
          {
            ...baseState,
            recipePreparation: [{ title: '', description: 'Existing step' }],
          },
          mockWarn
        );

        expect(result).toEqual({
          recipePreparation: [
            { title: '', description: 'Existing step' },
            ...expectedPreparationQuitoque,
          ],
        });
      });
      test(' (hellofresh) return recipePreparation with new steps', async () => {
        mockRecognize.mockResolvedValue(mockResultPreparationHelloFresh);

        const result = await extractFieldFromImage(
          uriForOCR,
          recipeColumnsNames.preparation,
          { ...baseState },
          mockWarn
        );

        expect(result).toEqual({ recipePreparation: expectedPreparationHelloFresh });
      });
    });
  });

  describe('on ingredient field', () => {
    const mockResultIngredientHeaderIsP: TextRecognitionResult = {
      text: "cacahuètes grillées (g)\nconcentré de tomates (g)\nfilet de poulet\ngingembre (cm)\ngoussed'ail\nlait de coco (mL)\noignon jaune\noignon nouveau\nriz basmati (g) Bio\n2p\n100\n35\n2\n1à3\n1\n200\n1\n0.5\n150\n3p\n150\n35\n3\n1à3\n1\n200\n1\n1\n225\n4p\n200\n70\n4\n1à3\n2\n400\n2\n1\n300\n5p\n250\n70\n5\n1à3\n2\n400\n2\n2\n375",
      blocks: new Array<TextBlock>(
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'cacahuètes grillées (g)',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'concentré de tomates (g)',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'filet de poulet',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'gingembre (cm)',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: "goussed'ail",
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'lait de coco (mL)',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'oignon jaune',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'oignon nouveau',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'riz basmati (g) Bio',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2p',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '100',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '35',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1à3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '200',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '0.5',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '150',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3p',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '150',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '35',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1à3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '200',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '225',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '4p',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '200',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '70',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '4',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1à3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '400',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '300',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '5p',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '250',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '70',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '5',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1à3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '400',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '375',
          }),
        }
      ),
    };

    const mockResultIngredientHeaderIsPersonInAnotherLine: TextRecognitionResult = {
      text: "Dans votre box\ncarotte\ncitronnelle\ncébette\ngousse d'ail\nlait de coco (ml)\noignon jaune\npoireau\npois chiches\nconserve (g égoutté) Bio\npurée de tomates (g)\nriz basmati (g) Bio\népices Cachemire (sachet)\n2 2\npers.\n1\n1\n1\n1\n200\n1\n1\n100\n125\n150\n1 1\n3\npers.\n2\n1\n1\n1\n200\n1\n1\n150\n125\n225\n1\n4\npers.\n2\n2\n2\n2\n400\n2\n2\n200\n250\n300\n2\n5\npers. pers.\n3\n2\n2\n2\n2\n400\n2\n2\n265\n250\n375\n6\n2\n3\n3\n2\n3\n600\n3\n3\n300\n375\n450\n3",
      blocks: new Array<TextBlock>(
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: "'Dans votre box'",
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'carotte',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'citronnelle',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'cébette',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: "gousse d'ail",
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'lait de coco (ml)',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>(
            {
              elements: [],
              recognizedLanguages: [],
              text: 'oignon jaune',
            },
            {
              elements: [],
              recognizedLanguages: [],
              text: 'poireau',
            }
          ),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'pois chiches',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'conserve (g égoutté) Bio',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>(
            {
              elements: [],
              recognizedLanguages: [],
              text: 'purée de tomates (g)',
            },
            {
              elements: [],
              recognizedLanguages: [],
              text: 'riz basmati (g) Bio',
            },
            {
              elements: [],
              recognizedLanguages: [],
              text: 'épices Cachemire (sachet)',
            }
          ),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2 2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '200',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '100',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '125',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '150',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1 1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '200',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '150',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '125',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '225',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '4',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '400',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '200',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '250',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '300',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '5',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'pers. pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '400',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '265',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '250',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '375',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '6',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '600',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '300',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '375',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '450',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        }
      ),
    };

    const mockResultIngredientShiftedAndIngredientBadlyRecognized: TextRecognitionResult = {
      text: "Dans votre box\ncarotte\ncitronnelle\ncébette\ngousse d'ail\nlait de coco (ml)\noignon jaune\npoireau\npois chiches\nconserve (g égoutté) Bio\npurée de tomates (g)\nriz basmati (g) Bio\népices Cachemire (sachet)\n2 2\npers.\n1\n1\n1\n1\n200\n1\n1\n100\n125\n150\n1 1\n3\npers.\n2\n1\n1\n1\n200\n1\n1\n150\n125\n225\n1\n4\npers.\n2\n2\n2\n2\n400\n2\n2\n200\n250\n300\n2\n5\npers. pers.\n3\n2\n2\n2\n2\n400\n2\n2\n265\n250\n375\n6\n2\n3\n3\n2\n3\n600\n3\n3\n300\n375\n450\n3",
      blocks: new Array<TextBlock>(
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: "'Dans votre box'",
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'carotte',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'citronnelle',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'cébette',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: "gousse d'ail",
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'lait de coco (ml)',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>(
            {
              elements: [],
              recognizedLanguages: [],
              text: 'oignon jaune',
            },
            {
              elements: [],
              recognizedLanguages: [],
              text: 'poireau',
            }
          ),
        },
        // {
        //     recognizedLanguages: [], text: "", lines: new Array<TextLine>({
        //         elements: [],
        //         recognizedLanguages: [],
        //         text: "pois chiches conserve  Bio"
        //     })
        // },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'pois chiches',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'conserve (g égoutté) Bio',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>(
            {
              elements: [],
              recognizedLanguages: [],
              text: 'purée de tomates (g)',
            },
            {
              elements: [],
              recognizedLanguages: [],
              text: 'riz basmati (g) Bio',
            },
            {
              elements: [],
              recognizedLanguages: [],
              text: 'épices Cachemire (sachet)',
            }
          ),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2 2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '200',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '100',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '125',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '150',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '200',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '150',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '125',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '225',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '4',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '400',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '200',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '250',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '300',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '5',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'pers. pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '400',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '265',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '250',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '375',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '6',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '600',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '300',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '375',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '450',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3',
          }),
        }
      ),
    };

    const mockIncompleteGroup: TextRecognitionResult = {
      text: 'ingredient1 (g)\ningredient2 (ml)\n2p\n100',
      blocks: [
        {
          recognizedLanguages: [],
          text: '',
          lines: [
            { elements: [], recognizedLanguages: [], text: 'ingredient1 (g)' },
            { elements: [], recognizedLanguages: [], text: 'ingredient2 (ml)' },
            { elements: [], recognizedLanguages: [], text: '2p' },
            { elements: [], recognizedLanguages: [], text: '100' },
          ],
        },
      ],
    };
    const mockExtraWhitespace: TextRecognitionResult = {
      text: '  ingredient1 (g)  \n   ingredient2   \n  2p   \n  100   \n   200  ',
      blocks: [
        {
          recognizedLanguages: [],
          text: '',
          lines: [
            { elements: [], recognizedLanguages: [], text: '  ingredient1 (g)  ' },
            { elements: [], recognizedLanguages: [], text: '   ingredient2   ' },
            { elements: [], recognizedLanguages: [], text: '  2p   ' },
            { elements: [], recognizedLanguages: [], text: '  100   ' },
            { elements: [], recognizedLanguages: [], text: '   200  ' },
          ],
        },
      ],
    };
    const mockEmptyOcr: TextRecognitionResult = { text: '', blocks: [] };

    const mockResultIngredientPouletSatayIOS: TextRecognitionResult = {
      text: "2p\n100\n35\n2\n1à3\n1\n200\n1\n0.5\n150\n3p\n150\n35\n3\n1à3\n1\n200\n1\n1\n225\n4p\n200\n70\n4\n1à3\n2\n400\n2\n1\n300\n5p\n250\n70\n5\n1à3\n2\n400\n2\n2\n375\ncacahuètes grillées (g)\nconcentré de tomates (g)\nfilet de poulet\ngingembre (cm)\ngoussed'ail\nlait de coco (mL)\noignon jaune\noignon nouveau\nriz basmati (g) Bio",
      blocks: [
        createBlock('2p'),
        createBlock('100'),
        createBlock('35'),
        createBlock('2'),
        createBlock('1à3'),
        createBlock('1'),
        createBlock('200'),
        createBlock('1'),
        createBlock('0.5'),
        createBlock('150'),
        createBlock('3p'),
        createBlock('150'),
        createBlock('35'),
        createBlock('3'),
        createBlock('1à3'),
        createBlock('1'),
        createBlock('200'),
        createBlock('1'),
        createBlock('1'),
        createBlock('225'),
        createBlock('4p'),
        createBlock('200'),
        createBlock('70'),
        createBlock('4'),
        createBlock('1à3'),
        createBlock('2'),
        createBlock('400'),
        createBlock('2'),
        createBlock('1'),
        createBlock('300'),
        createBlock('5p'),
        createBlock('250'),
        createBlock('70'),
        createBlock('5'),
        createBlock('1à3'),
        createBlock('2'),
        createBlock('400'),
        createBlock('2'),
        createBlock('2'),
        createBlock('375'),
        createBlock('cacahuètes grillées (g)'),
        createBlock('concentré de tomates (g)'),
        createBlock('filet de poulet'),
        createBlock('gingembre (cm)'),
        createBlock("goussed'ail"),
        createBlock('lait de coco (mL)'),
        createBlock('oignon jaune'),
        createBlock('oignon nouveau'),
        createBlock('riz basmati (g) Bio'),
      ],
    };

    const mockResultIngredientTajineMerguezIOS: TextRecognitionResult = {
      text: 'carotte\ncumin (sachet)\nmerguez\nnavet\npommes de terre jaunes (g)\n5p\n3\n1\n8\n2\n800\n3p\n2\n1\n6\n2\n600\n2p\n1\n1\n4\n1\n400\n4p\n3\n2\n10\n2\n1000',
      blocks: [
        createBlock('carotte'),
        createBlock('cumin (sachet)'),
        createBlock('merguez'),
        createBlock('navet'),
        createBlock('pommes de terre jaunes (g)'),
        createBlock('5p'),
        createBlock('3'),
        createBlock('1'),
        createBlock('8'),
        createBlock('2'),
        createBlock('800'),
        createBlock('3p'),
        createBlock('2'),
        createBlock('1'),
        createBlock('6'),
        createBlock('2'),
        createBlock('600'),
        createBlock('2p'),
        createBlock('1'),
        createBlock('1'),
        createBlock('4'),
        createBlock('1'),
        createBlock('400'),
        createBlock('4p'),
        createBlock('3'),
        createBlock('2'),
        createBlock('10'),
        createBlock('2'),
        createBlock('1000'),
      ],
    };

    const expectedTajineMerguez = new Array<ingredientObject>(
      {
        name: 'carotte',
        unit: '',
        quantityPerPersons: [
          { persons: 2, quantity: '1' },
          { persons: 3, quantity: '2' },
          { persons: 4, quantity: '3' },
          { persons: 5, quantity: '3' },
        ],
      },
      {
        name: 'cumin',
        unit: 'sachet',
        quantityPerPersons: [
          { persons: 2, quantity: '1' },
          { persons: 3, quantity: '1' },
          { persons: 4, quantity: '2' },
          { persons: 5, quantity: '1' },
        ],
      },
      {
        name: 'merguez',
        unit: '',
        quantityPerPersons: [
          { persons: 2, quantity: '4' },
          { persons: 3, quantity: '6' },
          { persons: 4, quantity: '10' },
          { persons: 5, quantity: '8' },
        ],
      },
      {
        name: 'navet',
        unit: '',
        quantityPerPersons: [
          { persons: 2, quantity: '1' },
          { persons: 3, quantity: '2' },
          { persons: 4, quantity: '2' },
          { persons: 5, quantity: '2' },
        ],
      },
      {
        name: 'pommes de terre jaunes',
        unit: 'g',
        quantityPerPersons: [
          { persons: 2, quantity: '400' },
          { persons: 3, quantity: '600' },
          { persons: 4, quantity: '1000' },
          { persons: 5, quantity: '800' },
        ],
      }
    );

    const expectedPouletSatay = new Array<ingredientObject>(
      {
        name: 'cacahuètes grillées',
        unit: 'g',
        quantityPerPersons: [
          { persons: 2, quantity: '100' },
          { persons: 3, quantity: '150' },
          { persons: 4, quantity: '200' },
          { persons: 5, quantity: '250' },
        ],
      },
      {
        name: 'concentré de tomates',
        unit: 'g',
        quantityPerPersons: [
          { persons: 2, quantity: '35' },
          { persons: 3, quantity: '35' },
          { persons: 4, quantity: '70' },
          { persons: 5, quantity: '70' },
        ],
      },
      {
        name: 'filet de poulet',
        unit: '',
        quantityPerPersons: [
          { persons: 2, quantity: '2' },
          { persons: 3, quantity: '3' },
          { persons: 4, quantity: '4' },
          { persons: 5, quantity: '5' },
        ],
      },
      {
        name: 'gingembre',
        unit: 'cm',
        quantityPerPersons: [
          { persons: 2, quantity: '1à3' },
          { persons: 3, quantity: '1à3' },
          { persons: 4, quantity: '1à3' },
          { persons: 5, quantity: '1à3' },
        ],
      },
      {
        name: "goussed'ail",
        unit: '',
        quantityPerPersons: [
          { persons: 2, quantity: '1' },
          { persons: 3, quantity: '1' },
          { persons: 4, quantity: '2' },
          { persons: 5, quantity: '2' },
        ],
      },
      {
        name: 'lait de coco',
        unit: 'mL',
        quantityPerPersons: [
          { persons: 2, quantity: '200' },
          { persons: 3, quantity: '200' },
          { persons: 4, quantity: '400' },
          { persons: 5, quantity: '400' },
        ],
      },
      {
        name: 'oignon jaune',
        unit: '',
        quantityPerPersons: [
          { persons: 2, quantity: '1' },
          { persons: 3, quantity: '1' },
          { persons: 4, quantity: '2' },
          { persons: 5, quantity: '2' },
        ],
      },
      {
        name: 'oignon nouveau',
        unit: '',
        quantityPerPersons: [
          { persons: 2, quantity: '0.5' },
          { persons: 3, quantity: '1' },
          { persons: 4, quantity: '1' },
          { persons: 5, quantity: '2' },
        ],
      },
      {
        name: 'riz basmati  Bio',
        unit: 'g',
        quantityPerPersons: [
          { persons: 2, quantity: '150' },
          { persons: 3, quantity: '225' },
          { persons: 4, quantity: '300' },
          { persons: 5, quantity: '375' },
        ],
      }
    );

    const mockIngredientHelloFresh: TextRecognitionResult = {
      text: 'Riz basmati\nOignon jaune\nCarotte"\nPoireau*\nCiboulette\nGousse d\'ail\nGingembre frais\nSauce soja 11) 13) 15)\nHuile de sésame 3)\nFilet de poulet\nGomasio 3)\n140 g\n1 pièce\n1 pièce\n1 pièce\n3g\n1 pièce\n2 cm\n40 ml\n10 ml\n2 pièce\n2 cC',
      blocks: new Array<TextBlock>(
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>(
            {
              elements: [],
              recognizedLanguages: [],
              text: 'Riz basmati',
            },
            {
              elements: [],
              recognizedLanguages: [],
              text: 'Oignon jaune',
            }
          ),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'Carotte"',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'Poireau*',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'Ciboulette',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: "Gousse d'ail",
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>(
            {
              elements: [],
              recognizedLanguages: [],
              text: 'Gingembre frais',
            },
            {
              elements: [],
              recognizedLanguages: [],
              text: 'Sauce soja 11) 13) 15)',
            }
          ),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'Huile de sésame 3)',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'Filet de poulet',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: 'Gomasio 3)',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '140 g',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1 pièce',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1 pièce',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1 pièce',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3g',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '1 pièce',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2 cm',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '40 ml',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '10 ml',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2 pièce',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2 cC',
          }),
        }
      ),
    };

    describe('on recognizeText', () => {
      test('returns the correct value on nominal cases where header is "p"', async () => {
        mockRecognize.mockResolvedValue(mockResultIngredientHeaderIsP);

        const expected = new Array<ingredientObject>(
          {
            name: 'cacahuètes grillées',
            unit: 'g',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '100' },
              {
                persons: 3,
                quantity: '150',
              },
              { persons: 4, quantity: '200' },
              { persons: 5, quantity: '250' }
            ),
          },
          {
            name: 'concentré de tomates',
            unit: 'g',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '35' },
              {
                persons: 3,
                quantity: '35',
              },
              { persons: 4, quantity: '70' },
              { persons: 5, quantity: '70' }
            ),
          },
          {
            name: 'filet de poulet',
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '2' },
              {
                persons: 3,
                quantity: '3',
              },
              { persons: 4, quantity: '4' },
              { persons: 5, quantity: '5' }
            ),
          },
          {
            name: 'gingembre',
            unit: 'cm',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '1à3' },
              {
                persons: 3,
                quantity: '1à3',
              },
              { persons: 4, quantity: '1à3' },
              { persons: 5, quantity: '1à3' }
            ),
          },
          {
            name: "goussed'ail",
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '1' },
              {
                persons: 3,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '2' }
            ),
          },
          {
            name: 'lait de coco',
            unit: 'mL',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '200' },
              {
                persons: 3,
                quantity: '200',
              },
              { persons: 4, quantity: '400' },
              { persons: 5, quantity: '400' }
            ),
          },
          {
            name: 'oignon jaune',
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '1' },
              {
                persons: 3,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '2' }
            ),
          },
          {
            name: 'oignon nouveau',
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '0.5' },
              {
                persons: 3,
                quantity: '1',
              },
              { persons: 4, quantity: '1' },
              { persons: 5, quantity: '2' }
            ),
          },
          {
            name: 'riz basmati  Bio',
            unit: 'g',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '150' },
              {
                persons: 3,
                quantity: '225',
              },
              { persons: 4, quantity: '300' },
              { persons: 5, quantity: '375' }
            ),
          }
        );

        const received = await recognizeText(uriForOCR, recipeColumnsNames.ingredients);

        expect(received).toEqual(expected);
      });
      test('returns the correct value on nominal cases where header is "persons" in another line', async () => {
        mockRecognize.mockResolvedValue(mockResultIngredientHeaderIsPersonInAnotherLine);

        const expected = new Array<ingredientObject>(
          {
            name: 'carotte',
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '1' },
              {
                persons: 3,
                quantity: '2',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '3' }
            ),
          },
          {
            name: 'citronnelle',
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '1' },
              {
                persons: 3,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '2' }
            ),
          },
          {
            name: 'cébette',
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '1' },
              {
                persons: 3,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '2' }
            ),
          },
          {
            name: "gousse d'ail",
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '1' },
              {
                persons: 3,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '2' }
            ),
          },
          {
            name: 'lait de coco',
            unit: 'ml',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '200' },
              {
                persons: 3,
                quantity: '200',
              },
              { persons: 4, quantity: '400' },
              { persons: 5, quantity: '400' }
            ),
          },
          {
            name: 'oignon jaune',
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '1' },
              {
                persons: 3,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '2' }
            ),
          },
          {
            name: 'poireau',
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '1' },
              {
                persons: 3,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '2' }
            ),
          },
          {
            name: 'pois chiches conserve  Bio',
            unit: 'g égoutté',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '100' },
              {
                persons: 3,
                quantity: '150',
              },
              { persons: 4, quantity: '200' },
              { persons: 5, quantity: '265' }
            ),
          },
          {
            name: 'purée de tomates',
            unit: 'g',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '125' },
              {
                persons: 3,
                quantity: '125',
              },
              { persons: 4, quantity: '250' },
              { persons: 5, quantity: '250' }
            ),
          },
          {
            name: 'riz basmati  Bio',
            unit: 'g',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '150' },
              {
                persons: 3,
                quantity: '225',
              },
              { persons: 4, quantity: '300' },
              { persons: 5, quantity: '375' }
            ),
          },
          {
            name: 'épices Cachemire',
            unit: 'sachet',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              { persons: 2, quantity: '1' },
              {
                persons: 3,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '2' }
            ),
          }
        );

        const received = await recognizeText(uriForOCR, recipeColumnsNames.ingredients);

        expect(expected).toEqual(received);
      });
      test('returns the correct value even if there are some shift in OCR result', async () => {
        mockRecognize.mockResolvedValue(mockResultIngredientShiftedAndIngredientBadlyRecognized);

        const expected = new Array<ingredientObject>(
          {
            name: 'carotte',
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              {
                persons: 2,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '3' }
            ),
          },
          {
            name: 'citronnelle',
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              {
                persons: 2,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '2' }
            ),
          },
          {
            name: 'cébette',
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              {
                persons: 2,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '2' }
            ),
          },
          {
            name: "gousse d'ail",
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              {
                persons: 2,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '2' }
            ),
          },
          {
            name: 'lait de coco',
            unit: 'ml',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              {
                persons: 2,
                quantity: '200',
              },
              { persons: 4, quantity: '400' },
              { persons: 5, quantity: '400' }
            ),
          },
          {
            name: 'oignon jaune',
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              {
                persons: 2,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '2' }
            ),
          },
          {
            name: 'poireau',
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              {
                persons: 2,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '2' }
            ),
          },
          {
            name: 'pois chiches conserve  Bio',
            unit: 'g égoutté',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              {
                persons: 2,
                quantity: '100',
              },
              { persons: 4, quantity: '200' },
              { persons: 5, quantity: '265' }
            ),
          },
          {
            name: 'purée de tomates',
            unit: 'g',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              {
                persons: 2,
                quantity: '125',
              },
              { persons: 4, quantity: '250' },
              { persons: 5, quantity: '250' }
            ),
          },
          {
            name: 'riz basmati  Bio',
            unit: 'g',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              {
                persons: 2,
                quantity: '150',
              },
              { persons: 4, quantity: '300' },
              { persons: 5, quantity: '375' }
            ),
          },
          {
            name: 'épices Cachemire',
            unit: 'sachet',
            // Badly see 6 in OCR but we can't fix it
            quantityPerPersons: new Array<ingredientQuantityPerPersons>(
              {
                persons: 2,
                quantity: '1',
              },
              { persons: 4, quantity: '2' },
              { persons: 5, quantity: '6' }
            ),
          }
        );

        const result = await recognizeText(uriForOCR, recipeColumnsNames.ingredients);
        expect(result).toEqual(expected);
      });
      test('return empty array when OCR result is empty', async () => {
        mockRecognize.mockResolvedValue(mockEmptyOcr);

        const result = await recognizeText(uriForOCR, recipeColumnsNames.ingredients);
        expect(result).toEqual([]);
      });
      test('best effort on incomplete data rows', async () => {
        // With two ingredients, the group size should be 3 tokens (persons + 2 quantities).
        // Here we provide an incomplete group (only persons and one quantity).
        mockRecognize.mockResolvedValue(mockIncompleteGroup);

        // Expect header parsed but no quantities attached because the data group is incomplete.
        const expected = new Array<ingredientObject>(
          { name: 'ingredient1', unit: 'g', quantityPerPersons: [{ persons: 2, quantity: '100' }] },
          { name: 'ingredient2', unit: 'ml', quantityPerPersons: [{ persons: 2, quantity: '' }] }
        );

        const result = await recognizeText(uriForOCR, recipeColumnsNames.ingredients);
        expect(result).toEqual(expected);
      });
      test('trim extra whitespace from lines', async () => {
        mockRecognize.mockResolvedValue(mockExtraWhitespace);

        const expected = new Array<ingredientObject>(
          { name: 'ingredient1', unit: 'g', quantityPerPersons: [{ persons: 2, quantity: '100' }] },
          { name: 'ingredient2', unit: '', quantityPerPersons: [{ persons: 2, quantity: '200' }] }
        );

        const result = await recognizeText(uriForOCR, recipeColumnsNames.ingredients);
        expect(result).toEqual(expected);
      });
      test('returns the correct value on hellofresh recipe', async () => {
        mockRecognize.mockResolvedValue(mockIngredientHelloFresh);

        const expected = new Array<ingredientObject>(
          {
            name: 'Riz basmati',
            unit: 'g',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>({
              persons: -1,
              quantity: '140',
            }),
          },
          {
            name: 'Oignon jaune',
            unit: 'pièce',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>({
              persons: -1,
              quantity: '1',
            }),
          },
          {
            name: 'Carotte"',
            unit: 'pièce',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>({
              persons: -1,
              quantity: '1',
            }),
          },
          {
            name: 'Poireau*',
            unit: 'pièce',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>({
              persons: -1,
              quantity: '1',
            }),
          },
          {
            name: 'Ciboulette',
            unit: '',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>({
              persons: -1,
              quantity: '3g',
            }),
          },
          {
            name: "Gousse d'ail",
            unit: 'pièce',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>({
              persons: -1,
              quantity: '1',
            }),
          },
          {
            name: 'Gingembre frais',
            unit: 'cm',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>({
              persons: -1,
              quantity: '2',
            }),
          },
          {
            name: 'Sauce soja 11) 13) 15)',
            unit: 'ml',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>({
              persons: -1,
              quantity: '40',
            }),
          },
          {
            name: 'Huile de sésame 3)',
            unit: 'ml',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>({
              persons: -1,
              quantity: '10',
            }),
          },
          {
            name: 'Filet de poulet',
            unit: 'pièce',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>({
              persons: -1,
              quantity: '2',
            }),
          },
          {
            name: 'Gomasio 3)',
            unit: 'cC',
            quantityPerPersons: new Array<ingredientQuantityPerPersons>({
              persons: -1,
              quantity: '2',
            }),
          }
        );

        const received = await recognizeText(uriForOCR, recipeColumnsNames.ingredients);

        expect(received).toEqual(expected);
      });
      const mockIngredientHelloFreshIOS: TextRecognitionResult = {
        text: '140g\npice\n1pce\nipiéce\nI piece\ngron jaae\nCarome\nPorvau\nChalee\nGeuse dal\nGrgenbre fa\nSauce soja 13)25)\nHle de sesane 3)\nFlet de peet\nComais\n10l\n2pece',
        blocks: [
          createBlock('140g'),
          createBlock('pice'),
          createBlock('1pce'),
          createBlock('ipiéce'),
          createBlock('I piece'),
          createBlock('gron jaae'),
          createBlock('Carome'),
          createBlock('Porvau'),
          createBlock('Chalee'),
          createBlock('Geuse dal'),
          createBlock('Grgenbre fa'),
          createBlock('Sauce soja 13)25)'),
          createBlock('Hle de sesane 3)'),
          createBlock('Flet de peet'),
          createBlock('Comais'),
          createBlock('10l'),
          createBlock('2pece'),
        ],
      };
      const expectedHelloFreshIOS = new Array<ingredientObject>(
        { name: 'Chalee', unit: '', quantityPerPersons: [{ persons: -1, quantity: '140g' }] },
        { name: 'Geuse dal', unit: '', quantityPerPersons: [{ persons: -1, quantity: 'pice' }] },
        { name: 'Grgenbre fa', unit: '', quantityPerPersons: [{ persons: -1, quantity: '1pce' }] },
        {
          name: 'Sauce soja 13)25)',
          unit: '',
          quantityPerPersons: [{ persons: -1, quantity: 'ipiéce' }],
        },
        {
          name: 'Hle de sesane 3)',
          unit: 'piece',
          quantityPerPersons: [{ persons: -1, quantity: 'I' }],
        },
        {
          name: 'Flet de peet',
          unit: 'jaae',
          quantityPerPersons: [{ persons: -1, quantity: 'gron' }],
        },
        { name: 'Comais', unit: '', quantityPerPersons: [{ persons: -1, quantity: 'Carome' }] },
        { name: '10l', unit: '', quantityPerPersons: [{ persons: -1, quantity: 'Porvau' }] }
      );
      test('(hellofresh iOS) returns correct value when iOS returns quantity blocks before name blocks', async () => {
        mockRecognize.mockResolvedValue(mockIngredientHelloFreshIOS);
        const received = await recognizeText(uriForOCR, recipeColumnsNames.ingredients);
        expect(received).toEqual(expectedHelloFreshIOS);
      });
      test('(poulet satay iOS) returns correct value with reversed block order (quantities before names)', async () => {
        mockRecognize.mockResolvedValue(mockResultIngredientPouletSatayIOS);

        const received = await recognizeText(uriForOCR, recipeColumnsNames.ingredients);

        expect(received).toEqual(expectedPouletSatay);
      });
      test('(tajine merguez iOS) returns correct value with out-of-order markers (5p, 3p, 2p, 4p)', async () => {
        mockRecognize.mockResolvedValue(mockResultIngredientTajineMerguezIOS);

        const received = await recognizeText(uriForOCR, recipeColumnsNames.ingredients);

        expect(received).toEqual(expectedTajineMerguez);
      });
    });

    describe('on extractFieldFromImage', () => {
      test('parse ingredients with exact match for persons', async () => {
        mockRecognize.mockResolvedValue(mockResultIngredientHeaderIsP);

        const result = await extractFieldFromImage(
          'uri',
          recipeColumnsNames.ingredients,
          baseState,
          mockWarn
        );
        expect(result).toEqual({
          recipeIngredients: new Array<FormIngredientElement>(
            {
              name: 'cacahuètes grillées',
              unit: 'g',
              quantity: '200',
            },
            {
              name: 'concentré de tomates',
              unit: 'g',
              quantity: '70',
            },
            {
              name: 'filet de poulet',
              unit: '',
              quantity: '4',
            },
            {
              name: 'gingembre',
              unit: 'cm',
              quantity: '1à3',
            },
            {
              name: "goussed'ail",
              unit: '',
              quantity: '2',
            },
            {
              name: 'lait de coco',
              unit: 'mL',
              quantity: '400',
            },
            {
              name: 'oignon jaune',
              unit: '',
              quantity: '2',
            },
            {
              name: 'oignon nouveau',
              unit: '',
              quantity: '1',
            },
            {
              name: 'riz basmati  Bio',
              unit: 'g',
              quantity: '300',
            }
          ),
        });
      });

      test('parse ingredients with scaling up from 2 persons to 6 persons', async () => {
        mockRecognize.mockResolvedValue(mockResultIngredientHeaderIsP);

        const result = await extractFieldFromImage(
          'uri',
          recipeColumnsNames.ingredients,
          {
            ...baseState,
            recipePersons: 6,
          },
          mockWarn
        );

        expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining('Using 2 and scaling to 6'));

        expect(result).toEqual({
          recipeIngredients: new Array<FormIngredientElement>(
            {
              name: 'cacahuètes grillées',
              unit: 'g',
              quantity: '300',
            },
            {
              name: 'concentré de tomates',
              unit: 'g',
              quantity: '105',
            },
            {
              name: 'filet de poulet',
              unit: '',
              quantity: '6',
            },
            {
              name: 'gingembre',
              unit: 'cm',
              quantity: '1à3',
            },
            {
              name: "goussed'ail",
              unit: '',
              quantity: '3',
            },
            {
              name: 'lait de coco',
              unit: 'mL',
              quantity: '600',
            },
            {
              name: 'oignon jaune',
              unit: '',
              quantity: '3',
            },
            {
              name: 'oignon nouveau',
              unit: '',
              quantity: '1,5',
            },
            {
              name: 'riz basmati  Bio',
              unit: 'g',
              quantity: '450',
            }
          ),
        });
      });

      test('parse ingredients with scaling down from 2 persons to 1 person', async () => {
        mockRecognize.mockResolvedValue(mockResultIngredientHeaderIsP);

        const result = await extractFieldFromImage(
          'uri',
          recipeColumnsNames.ingredients,
          {
            ...baseState,
            recipePersons: 1,
          },
          mockWarn
        );

        expect(mockWarn).toHaveBeenCalledWith(expect.stringContaining('Using 2 and scaling to 1'));

        expect(result).toEqual({
          recipeIngredients: new Array<FormIngredientElement>(
            {
              name: 'cacahuètes grillées',
              unit: 'g',
              quantity: '50',
            },
            {
              name: 'concentré de tomates',
              unit: 'g',
              quantity: '17,5',
            },
            {
              name: 'filet de poulet',
              unit: '',
              quantity: '1',
            },
            {
              name: 'gingembre',
              unit: 'cm',
              quantity: '1à3',
            },
            {
              name: "goussed'ail",
              unit: '',
              quantity: '0,5',
            },
            {
              name: 'lait de coco',
              unit: 'mL',
              quantity: '100',
            },
            {
              name: 'oignon jaune',
              unit: '',
              quantity: '0,5',
            },
            {
              name: 'oignon nouveau',
              unit: '',
              quantity: '0,25',
            },
            {
              name: 'riz basmati  Bio',
              unit: 'g',
              quantity: '75',
            }
          ),
        });
      });

      test('extracts note from second parenthetical in ingredient header', async () => {
        const mockResultWithNotes: TextRecognitionResult = {
          text: 'Flour (g) (organic)\nSugar (g)\nMilk (mL) (fresh) (cold)\n4p\n200\n100\n250',
          blocks: [
            {
              recognizedLanguages: [],
              text: '',
              lines: [
                { elements: [], recognizedLanguages: [], text: 'Flour (g) (organic)' },
                { elements: [], recognizedLanguages: [], text: 'Sugar (g)' },
                { elements: [], recognizedLanguages: [], text: 'Milk (mL) (fresh) (cold)' },
                { elements: [], recognizedLanguages: [], text: '4p' },
                { elements: [], recognizedLanguages: [], text: '200' },
                { elements: [], recognizedLanguages: [], text: '100' },
                { elements: [], recognizedLanguages: [], text: '250' },
              ],
            },
          ],
        };

        mockRecognize.mockResolvedValue(mockResultWithNotes);

        const result = await extractFieldFromImage(
          'uri',
          recipeColumnsNames.ingredients,
          baseState,
          mockWarn
        );

        expect(result).toEqual({
          recipeIngredients: [
            { name: 'Flour', unit: 'g', quantity: '200', note: 'organic' },
            { name: 'Sugar', unit: 'g', quantity: '100' },
            { name: 'Milk', unit: 'mL', quantity: '250', note: 'fresh, cold' },
          ],
        });
      });

      test('does not include note when only one parenthetical exists', async () => {
        const mockResultNoNotes: TextRecognitionResult = {
          text: 'Flour (g)\n4p\n200',
          blocks: [
            {
              recognizedLanguages: [],
              text: '',
              lines: [
                { elements: [], recognizedLanguages: [], text: 'Flour (g)' },
                { elements: [], recognizedLanguages: [], text: '4p' },
                { elements: [], recognizedLanguages: [], text: '200' },
              ],
            },
          ],
        };

        mockRecognize.mockResolvedValue(mockResultNoNotes);

        const result = await extractFieldFromImage(
          'uri',
          recipeColumnsNames.ingredients,
          baseState,
          mockWarn
        );

        expect(result).toEqual({
          recipeIngredients: [{ name: 'Flour', unit: 'g', quantity: '200' }],
        });

        const ingredient = (result as { recipeIngredients: FormIngredientElement[] })
          .recipeIngredients[0];
        expect(ingredient.note).toBeUndefined();
      });

      test('handles empty additional parenthetical', async () => {
        const mockResultEmptyNote: TextRecognitionResult = {
          text: 'Flour (g) ()\n4p\n200',
          blocks: [
            {
              recognizedLanguages: [],
              text: '',
              lines: [
                { elements: [], recognizedLanguages: [], text: 'Flour (g) ()' },
                { elements: [], recognizedLanguages: [], text: '4p' },
                { elements: [], recognizedLanguages: [], text: '200' },
              ],
            },
          ],
        };

        mockRecognize.mockResolvedValue(mockResultEmptyNote);

        const result = await extractFieldFromImage(
          'uri',
          recipeColumnsNames.ingredients,
          baseState,
          mockWarn
        );

        expect(result).toEqual({
          recipeIngredients: [{ name: 'Flour', unit: 'g', quantity: '200' }],
        });

        const ingredient = (result as { recipeIngredients: FormIngredientElement[] })
          .recipeIngredients[0];
        expect(ingredient.note).toBeUndefined();
      });
    });
  });

  describe('on person and time field', () => {
    const mockResultTimes: TextRecognitionResult = {
      text: '2 pers.\n3 pers.\n4 pers.\n5 pers. \n>\n25 min\n25 min\n30 min\n30 min',
      blocks: new Array<TextBlock>(
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '25 min',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '25 min',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '30 min',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '30 min',
          }),
        }
      ),
    };
    const expectedTimes = new Array<number>(25, 25, 30, 30);

    const mockResultTime: TextRecognitionResult = {
      text: '2 pers.\n3 pers.\n4 pers.\n5 pers. \n>\n25 min\n25 min\n30 min\n30 min',
      blocks: new Array<TextBlock>({
        recognizedLanguages: [],
        text: '',
        lines: new Array<TextLine>({ elements: [], recognizedLanguages: [], text: '25 min' }),
      }),
    };
    const expectedTime = 25;

    const mockResultPersonsTimes: TextRecognitionResult = {
      text: '2 pers.\n3 pers.\n4 pers.\n5 pers. \n>\n25 min\n25 min\n30 min\n30 min',
      blocks: new Array<TextBlock>(
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2 pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3 pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '4 pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '5 pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '>',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '25 min',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '25 min',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '30 min',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '30 min',
          }),
        }
      ),
    };
    const expectedPersonsTimes = new Array<personAndTimeObject>(
      { person: 2, time: 25 },
      { person: 3, time: 25 },
      {
        person: 4,
        time: 30,
      },
      { person: 5, time: 30 }
    );

    const mockResultPersonTime: TextRecognitionResult = {
      text: '2 pers.\n3 pers.\n4 pers.\n5 pers. \n>\n25 min\n25 min\n30 min\n30 min',
      blocks: new Array<TextBlock>(
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2 pers.',
          }),
        },

        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '25 min',
          }),
        }
      ),
    };
    const expectedPersonTime = new Array<personAndTimeObject>({ person: 2, time: 25 });

    const mockResultPersons: TextRecognitionResult = {
      text: '2 pers.\n3 pers.\n4 pers.\n5 pers. \n>\n25 min\n25 min\n30 min\n30 min',
      blocks: new Array<TextBlock>(
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '2 pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '3 pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '4 pers.',
          }),
        },
        {
          recognizedLanguages: [],
          text: '',
          lines: new Array<TextLine>({
            elements: [],
            recognizedLanguages: [],
            text: '5 pers.',
          }),
        }
      ),
    };
    const expectedPersons = new Array<number>(2, 3, 4, 5);

    const mockResultPerson: TextRecognitionResult = {
      text: '2 pers.\n3 pers.\n4 pers.\n5 pers. \n>\n25 min\n25 min\n30 min\n30 min',
      blocks: new Array<TextBlock>({
        recognizedLanguages: [],
        text: '',
        lines: new Array<TextLine>({ elements: [], recognizedLanguages: [], text: '2 pers.' }),
      }),
    };
    const expectedPerson = 2;

    describe('on recognizeText', () => {
      test(' returns array of time if it is the only value available', async () => {
        mockRecognize.mockResolvedValue(mockResultTimes);

        expect(await recognizeText(uriForOCR, recipeColumnsNames.time)).toEqual(expectedTimes);
      });
      test('returns a single time if it is the only value available', async () => {
        mockRecognize.mockResolvedValue(mockResultTime);

        expect(await recognizeText(uriForOCR, recipeColumnsNames.time)).toEqual(expectedTime);
      });
      test('returns array of time and persons if the values are  availables', async () => {
        mockRecognize.mockResolvedValue(mockResultPersonsTimes);

        expect(await recognizeText(uriForOCR, recipeColumnsNames.persons)).toEqual(
          expectedPersonsTimes
        );
        expect(await recognizeText(uriForOCR, recipeColumnsNames.time)).toEqual(
          expectedPersonsTimes
        );
      });
      test('returns a single time and person if it is the only value available', async () => {
        mockRecognize.mockResolvedValue(mockResultPersonTime);

        expect(await recognizeText(uriForOCR, recipeColumnsNames.time)).toEqual(expectedPersonTime);
        expect(await recognizeText(uriForOCR, recipeColumnsNames.persons)).toEqual(
          expectedPersonTime
        );
      });
      test('returns array of persons if it is the only value available', async () => {
        mockRecognize.mockResolvedValue(mockResultPersons);

        expect(await recognizeText(uriForOCR, recipeColumnsNames.persons)).toEqual(expectedPersons);
      });
      test('returns a single value of person if it is the only value available', async () => {
        mockRecognize.mockResolvedValue(mockResultPerson);

        expect(await recognizeText(uriForOCR, recipeColumnsNames.persons)).toEqual(expectedPerson);
      });
    });

    describe('on extractFieldFromImage', () => {
      test('extractFieldFromImage returns time if it is the only value available (even with an array)', async () => {
        mockRecognize.mockResolvedValue(mockResultTimes);

        const result = await extractFieldFromImage(
          uriForOCR,
          recipeColumnsNames.time,
          baseState,
          mockWarn
        );
        expect(result).toEqual({ recipeTime: 25 });
      });
      test('extractFieldFromImage returns a time if it is the only value available', async () => {
        mockRecognize.mockResolvedValue(mockResultTime);

        const result = await extractFieldFromImage(
          uriForOCR,
          recipeColumnsNames.time,
          baseState,
          mockWarn
        );
        expect(result).toEqual({ recipeTime: 25 });
      });
      test('extractFieldFromImage returns time and persons if the values are  availables (even with an array)', async () => {
        mockRecognize.mockResolvedValue(mockResultPersonsTimes);

        let result = await extractFieldFromImage(
          uriForOCR,
          recipeColumnsNames.time,
          baseState,
          mockWarn
        );
        expect(result).toEqual({ recipeTime: 25, recipePersons: 2 });

        result = await extractFieldFromImage(
          uriForOCR,
          recipeColumnsNames.persons,
          baseState,
          mockWarn
        );
        expect(result).toEqual({ recipeTime: 25, recipePersons: 2 });
      });
      test('extractFieldFromImage returns time and person if it is the only value available', async () => {
        mockRecognize.mockResolvedValue(mockResultPersonTime);

        let result = await extractFieldFromImage(
          uriForOCR,
          recipeColumnsNames.time,
          baseState,
          mockWarn
        );
        expect(result).toEqual({ recipeTime: 25, recipePersons: 2 });

        result = await extractFieldFromImage(
          uriForOCR,
          recipeColumnsNames.persons,
          baseState,
          mockWarn
        );
        expect(result).toEqual({ recipeTime: 25, recipePersons: 2 });
      });
      test('extractFieldFromImage returns person if it is the only value available (even with an array)', async () => {
        mockRecognize.mockResolvedValue(mockResultPersons);

        const result = await extractFieldFromImage(
          uriForOCR,
          recipeColumnsNames.persons,
          baseState,
          mockWarn
        );
        expect(result).toEqual({ recipePersons: 2 });
      });
      test('extractFieldFromImage returns a person if it is the only value available', async () => {
        mockRecognize.mockResolvedValue(mockResultPerson);

        const result = await extractFieldFromImage(
          uriForOCR,
          recipeColumnsNames.persons,
          baseState,
          mockWarn
        );
        expect(result).toEqual({ recipePersons: 2 });
      });
    });
  });

  test('extractFieldFromImage should handle unrecognized field gracefully', async () => {
    const result = await extractFieldFromImage(
      uriForOCR,
      'not-a-field' as any,
      baseState,
      mockWarn
    );

    expect(result).toEqual({});
  });

  describe('on tags field', () => {
    const mockResultTags: TextRecognitionResult = {
      text: '<650kcal Familial Rapido ',
      blocks: new Array<TextBlock>({
        recognizedLanguages: [],
        text: '',
        lines: new Array<TextLine>({
          elements: [],
          recognizedLanguages: [],
          text: '<650kcal Familial Rapido ',
        }),
      }),
    };
    const expectedTags = new Array<tagTableElement>(
      { name: '<650kcal' },
      { name: 'Familial' },
      { name: 'Rapido' }
    );

    describe('on recognizeText', () => {
      test('returns the correct value', async () => {
        mockRecognize.mockResolvedValue(mockResultTags);

        expect(await recognizeText(uriForOCR, recipeColumnsNames.tags)).toEqual(expectedTags);
      });
    });
    describe('on extractFieldFromImage', () => {
      test('returns the correct value', async () => {
        mockRecognize.mockResolvedValue(mockResultTags);
        const tagAlreadyPresent: tagTableElement = { name: 'Existing tags' };

        const result = await extractFieldFromImage(
          uriForOCR,
          recipeColumnsNames.tags,
          {
            ...baseState,
            recipeTags: new Array<tagTableElement>(tagAlreadyPresent),
          },
          mockWarn
        );

        expect(result).toEqual({
          recipeTags: new Array<tagTableElement>(tagAlreadyPresent, ...expectedTags),
        });
      });
    });
  });

  describe('on nutrition field', () => {
    const mockResultNutrition1: TextRecognitionResult = {
      text: 'Énergie\nINFORMATIONS NUTRITIONNELLES\nMatières grasses\ndont acides gras saturés\nGlucides\ndont sucres\nFibres\nProtéines\nSel\nFer\nMagnésium\nPotassium\nPhosphore\nVitamine E\nPour\n100 g\n1937 kJ\n463 kcal\n219\n2,0 g\n54g\n149\n6,59\n11g\n0,149\n3,9 mg\n89,3 mg\n303 mg\n213 mg\n4,6 mg\n% des RNJ*\npour 100 g\n23%\n30%\n10%\n21%\n16%\n22%\n22%\n2,3%\n28%\n24%\n15%\n30%\n38%\n',
      blocks: [
        {
          recognizedLanguages: [],
          text: 'Énergie',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Énergie' }],
        },
        {
          recognizedLanguages: [],
          text: 'INFORMATIONS NUTRITIONNELLES',
          lines: [{ elements: [], recognizedLanguages: [], text: 'INFORMATIONS NUTRITIONNELLES' }],
        },
        {
          recognizedLanguages: [],
          text: 'Matières grasses\ndont acides gras saturés',
          lines: [
            { elements: [], recognizedLanguages: [], text: 'Matières grasses' },
            {
              elements: [],
              recognizedLanguages: [],
              text: 'dont acides gras saturés',
            },
          ],
        },
        {
          recognizedLanguages: [],
          text: 'Glucides\ndont sucres',
          lines: [
            { elements: [], recognizedLanguages: [], text: 'Glucides' },
            {
              elements: [],
              recognizedLanguages: [],
              text: 'dont sucres',
            },
          ],
        },
        {
          recognizedLanguages: [],
          text: 'Fibres',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Fibres' }],
        },
        {
          recognizedLanguages: [],
          text: 'Protéines',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Protéines' }],
        },
        {
          recognizedLanguages: [],
          text: 'Sel',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Sel' }],
        },
        {
          recognizedLanguages: [],
          text: 'Magnésium',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Magnésium' }],
        },
        {
          recognizedLanguages: [],
          text: 'Potassium',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Potassium' }],
        },
        {
          recognizedLanguages: [],
          text: 'Phosphore\nVitamine E',
          lines: [
            { elements: [], recognizedLanguages: [], text: 'Phosphore' },
            {
              elements: [],
              recognizedLanguages: [],
              text: 'Vitamine E',
            },
          ],
        },
        {
          recognizedLanguages: [],
          text: 'Pour',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Pour' }],
        },
        {
          recognizedLanguages: [],
          text: '100 g',
          lines: [{ elements: [], recognizedLanguages: [], text: '100 g' }],
        },
        {
          recognizedLanguages: [],
          text: '1937 kJ',
          lines: [{ elements: [], recognizedLanguages: [], text: '1937 kJ' }],
        },
        {
          recognizedLanguages: [],
          text: '463 kcal',
          lines: [{ elements: [], recognizedLanguages: [], text: '463 kcal' }],
        },
        {
          recognizedLanguages: [],
          text: '219',
          lines: [{ elements: [], recognizedLanguages: [], text: '219' }],
        },
        {
          recognizedLanguages: [],
          text: '2,0 g',
          lines: [{ elements: [], recognizedLanguages: [], text: '2,0 g' }],
        },
        {
          recognizedLanguages: [],
          text: '54g',
          lines: [{ elements: [], recognizedLanguages: [], text: '54g' }],
        },
        {
          recognizedLanguages: [],
          text: '149',
          lines: [{ elements: [], recognizedLanguages: [], text: '149' }],
        },
        {
          recognizedLanguages: [],
          text: '6,59',
          lines: [{ elements: [], recognizedLanguages: [], text: '6,59' }],
        },
        {
          recognizedLanguages: [],
          text: '11g',
          lines: [{ elements: [], recognizedLanguages: [], text: '11g' }],
        },
        {
          recognizedLanguages: [],
          text: '0,149',
          lines: [{ elements: [], recognizedLanguages: [], text: '0,149' }],
        },
        {
          recognizedLanguages: [],
          text: '3,9 mg',
          lines: [{ elements: [], recognizedLanguages: [], text: '3,9 mg' }],
        },
        {
          recognizedLanguages: [],
          text: '89,3 mg',
          lines: [{ elements: [], recognizedLanguages: [], text: '89,3 mg' }],
        },
        {
          recognizedLanguages: [],
          text: '303 mg',
          lines: [{ elements: [], recognizedLanguages: [], text: '303 mg' }],
        },
        {
          recognizedLanguages: [],
          text: '213 mg',
          lines: [{ elements: [], recognizedLanguages: [], text: '213 mg' }],
        },
        {
          recognizedLanguages: [],
          text: '4,6 mg',
          lines: [{ elements: [], recognizedLanguages: [], text: '4,6 mg' }],
        },
        {
          recognizedLanguages: [],
          text: '% des RNJ*',
          lines: [{ elements: [], recognizedLanguages: [], text: '% des RNJ*' }],
        },
        {
          recognizedLanguages: [],
          text: 'pour 100 g',
          lines: [{ elements: [], recognizedLanguages: [], text: 'pour 100 g' }],
        },
        {
          recognizedLanguages: [],
          text: '23%',
          lines: [{ elements: [], recognizedLanguages: [], text: '23%' }],
        },
        {
          recognizedLanguages: [],
          text: '30%',
          lines: [{ elements: [], recognizedLanguages: [], text: '30%' }],
        },
        {
          recognizedLanguages: [],
          text: '10%',
          lines: [{ elements: [], recognizedLanguages: [], text: '10%' }],
        },
        {
          recognizedLanguages: [],
          text: '21%',
          lines: [{ elements: [], recognizedLanguages: [], text: '21%' }],
        },
        {
          recognizedLanguages: [],
          text: '16%',
          lines: [{ elements: [], recognizedLanguages: [], text: '16%' }],
        },
        {
          recognizedLanguages: [],
          text: '22%',
          lines: [{ elements: [], recognizedLanguages: [], text: '22%' }],
        },
        {
          recognizedLanguages: [],
          text: '22%',
          lines: [{ elements: [], recognizedLanguages: [], text: '22%' }],
        },
        {
          recognizedLanguages: [],
          text: '2,3%',
          lines: [{ elements: [], recognizedLanguages: [], text: '2,3%' }],
        },
        {
          recognizedLanguages: [],
          text: '28%',
          lines: [{ elements: [], recognizedLanguages: [], text: '28%' }],
        },
        {
          recognizedLanguages: [],
          text: '24%',
          lines: [{ elements: [], recognizedLanguages: [], text: '24%' }],
        },
        {
          recognizedLanguages: [],
          text: '15%',
          lines: [{ elements: [], recognizedLanguages: [], text: '15%' }],
        },
        {
          recognizedLanguages: [],
          text: '30%',
          lines: [{ elements: [], recognizedLanguages: [], text: '30%' }],
        },
        {
          recognizedLanguages: [],
          text: '38%',
          lines: [{ elements: [], recognizedLanguages: [], text: '38%' }],
        },
      ],
    };

    const mockResultQuitoque: TextRecognitionResult = {
      text: 'Valeurs nutritionnelles\nPar portion\nÉnergie (kJ)\nÉnergie (kCal)\nMatières grasses\ndont acides gras saturés\nGlucides\ndont sucre\nFibres\nProtéines\nSel\nPour 10Og\n911 kJ\n218 kCal\n8,53 g\n0,46g\n24,37 g\n2,92 g\n0,81g\n9,93g\n0,65 g',
      blocks: [
        {
          recognizedLanguages: [],
          text: 'Valeurs nutritionnelles',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Valeurs nutritionnelles' }],
        },

        {
          recognizedLanguages: [],
          text: 'Par portion',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Par portion' }],
        },

        {
          recognizedLanguages: [],
          text: 'Énergie (kJ)',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Énergie (kJ)' }],
        },

        {
          recognizedLanguages: [],
          text: 'Énergie (kCal)',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Énergie (kCal)' }],
        },

        {
          recognizedLanguages: [],
          text: 'Matières grasses',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Matières grasses' }],
        },

        {
          recognizedLanguages: [],
          text: 'dont acides gras saturés',
          lines: [{ elements: [], recognizedLanguages: [], text: 'dont acides gras saturés' }],
        },

        {
          recognizedLanguages: [],
          text: 'Glucides',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Glucides' }],
        },

        {
          recognizedLanguages: [],
          text: 'dont sucre',
          lines: [{ elements: [], recognizedLanguages: [], text: 'dont sucre' }],
        },

        {
          recognizedLanguages: [],
          text: 'Fibres',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Fibres' }],
        },

        {
          recognizedLanguages: [],
          text: 'Protéines',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Protéines' }],
        },

        {
          recognizedLanguages: [],
          text: 'Sel',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Sel' }],
        },

        {
          recognizedLanguages: [],
          text: 'Pour 10Og',
          lines: [{ elements: [], recognizedLanguages: [], text: 'Pour 10Og' }],
        },

        {
          recognizedLanguages: [],
          text: '911 kJ',
          lines: [{ elements: [], recognizedLanguages: [], text: '911 kJ' }],
        },

        {
          recognizedLanguages: [],
          text: '218 kCal',
          lines: [{ elements: [], recognizedLanguages: [], text: '218 kCal' }],
        },

        {
          recognizedLanguages: [],
          text: '8,53 g',
          lines: [{ elements: [], recognizedLanguages: [], text: '8,53 g' }],
        },

        {
          recognizedLanguages: [],
          text: '0,46g',
          lines: [{ elements: [], recognizedLanguages: [], text: '0,46g' }],
        },

        {
          recognizedLanguages: [],
          text: '24,37 g',
          lines: [{ elements: [], recognizedLanguages: [], text: '24,37 g' }],
        },

        {
          recognizedLanguages: [],
          text: '2,92 g',
          lines: [{ elements: [], recognizedLanguages: [], text: '2,92 g' }],
        },

        {
          recognizedLanguages: [],
          text: '0,81g',
          lines: [{ elements: [], recognizedLanguages: [], text: '0,81g' }],
        },

        {
          recognizedLanguages: [],
          text: '9,93g',
          lines: [{ elements: [], recognizedLanguages: [], text: '9,93g' }],
        },

        {
          recognizedLanguages: [],
          text: '0,65 g',
          lines: [{ elements: [], recognizedLanguages: [], text: '0,65 g' }],
        },
      ],
    };

    const expectedNutrition1: nutritionObject = {
      energyKcal: 463,
      energyKj: 1937,
      protein: 11,
      fat: 21,
      saturatedFat: 2,
      carbohydrates: 54,
      sugars: 14,
      fiber: 6.5,
      salt: 0.14,
    };

    const expectedNutritionQuitoque: nutritionObject = {
      energyKcal: 218,
      energyKj: 911,
      fat: 8.53,
      saturatedFat: 0.46,
      carbohydrates: 24.37,
      sugars: 2.92,
      fiber: 0.81,
      protein: 9.93,
      salt: 0.65,
    };

    const mockResultQuitoqueIOS: TextRecognitionResult = {
      text: 'Valeurs nutritionnelles\nPar portion\nPour 10Og\nÉnergie (kJ)\nEnergie (kCal)\nMatières grasses\ndont acides gras saturés\nGlucides\ndont sucre\nFibres\nProtéines\nSel\n911 kJ\n218 kCal\n8,53 g\n0,46g\n24,37 g\n2,92 g\n0,81g\n9.93 g\n0,65 g',
      blocks: [
        createBlock('Valeurs nutritionnelles'),
        createBlock('Par portion'),
        createBlock('Pour 10Og'),
        createBlock('Énergie (kJ)'),
        createBlock('Energie (kCal)'),
        createBlock('Matières grasses'),
        createBlock('dont acides gras saturés'),
        createBlock('Glucides'),
        createBlock('dont sucre'),
        createBlock('Fibres'),
        createBlock('Protéines'),
        createBlock('Sel'),
        createBlock('911 kJ'),
        createBlock('218 kCal'),
        createBlock('8,53 g'),
        createBlock('0,46g'),
        createBlock('24,37 g'),
        createBlock('2,92 g'),
        createBlock('0,81g'),
        createBlock('9.93 g'),
        createBlock('0,65 g'),
      ],
    };

    describe('on recognizeText', () => {
      test('returns correct nutrition data from French label 1', async () => {
        mockRecognize.mockResolvedValue(mockResultNutrition1);

        const result = await recognizeText(uriForOCR, recipeColumnsNames.nutrition);
        expect(result).toEqual(expectedNutrition1);
      });

      test('returns correct nutrition data from quitoque', async () => {
        mockRecognize.mockResolvedValue(mockResultQuitoque);

        const result = await recognizeText(uriForOCR, recipeColumnsNames.nutrition);
        expect(result).toEqual(expectedNutritionQuitoque);
      });

      test('(quitoque iOS) returns correct nutrition with per100g before labels and typo 10Og', async () => {
        mockRecognize.mockResolvedValue(mockResultQuitoqueIOS);

        const result = await recognizeText(uriForOCR, recipeColumnsNames.nutrition);
        expect(result).toEqual(expectedNutritionQuitoque);
      });

      test('returns empty object when no nutrition values found', async () => {
        const mockResultEmpty: TextRecognitionResult = {
          text: 'Some random text without nutrition values',
          blocks: [
            {
              recognizedLanguages: [],
              text: 'Some random text',
              lines: [{ elements: [], recognizedLanguages: [], text: 'Some random text' }],
            },
          ],
        };

        mockRecognize.mockResolvedValue(mockResultEmpty);
        expect(await recognizeText(uriForOCR, recipeColumnsNames.nutrition)).toEqual({});
      });
    });

    describe('on extractFieldFromImage', () => {
      test('returns nutrition object when OCR gives valid nutrition data', async () => {
        mockRecognize.mockResolvedValue(mockResultQuitoque);

        const result = await extractFieldFromImage(
          uriForOCR,
          recipeColumnsNames.nutrition,
          baseState,
          mockWarn
        );

        expect(result.recipeNutrition).toEqual(expectedNutritionQuitoque);
        expect(mockWarn).not.toHaveBeenCalled();
      });

      test('handles empty nutrition data', async () => {
        const mockResultEmpty: TextRecognitionResult = {
          text: 'No nutrition data',
          blocks: [],
        };

        mockRecognize.mockResolvedValue(mockResultEmpty);

        const result = await extractFieldFromImage(
          uriForOCR,
          recipeColumnsNames.nutrition,
          baseState,
          mockWarn
        );

        expect(result.recipeNutrition).toEqual({});
        expect(mockWarn).not.toHaveBeenCalled();
      });

      test('extracts partial nutrition data from extractFieldFromImage', async () => {
        mockRecognize.mockResolvedValue(mockResultNutrition1);

        const result = await extractFieldFromImage(
          uriForOCR,
          recipeColumnsNames.nutrition,
          baseState,
          mockWarn
        );

        expect(result.recipeNutrition).toEqual(expectedNutrition1);
        expect(mockWarn).not.toHaveBeenCalled();
      });
    });

    describe('edge cases and error handling', () => {
      test('returns empty object when no per100g marker found', async () => {
        const mockResultNoMarker: TextRecognitionResult = {
          text: 'Some random text without nutrition markers',
          blocks: [
            {
              recognizedLanguages: [],
              text: 'Some random text',
              lines: [{ elements: [], recognizedLanguages: [], text: 'Some random text' }],
            },
          ],
        };

        mockRecognize.mockResolvedValue(mockResultNoMarker);
        expect(await recognizeText(uriForOCR, recipeColumnsNames.nutrition)).toEqual({});
      });
    });
  });
});
