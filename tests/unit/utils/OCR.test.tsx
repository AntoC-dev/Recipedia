import {
  extractFieldFromImage,
  parseIngredientsNoHeader,
  personAndTimeObject,
  recognizeText,
  WarningHandler,
} from '@utils/OCR';
import { nutritionObject } from '@customTypes/OCRTypes';
import { recipeColumnsNames, tagTableElement } from '@customTypes/DatabaseElementTypes';
import TextRecognition, {
  TextBlock,
  TextLine,
  TextRecognitionResult,
} from '@react-native-ml-kit/text-recognition';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const mockRecognize = TextRecognition.recognize as jest.Mock;
const mockWarn: WarningHandler = jest.fn();

describe('OCR Utility Functions', () => {
  const uriForOCR = 'not used';
  const baseState = {
    recipePreparation: [],
    recipePersons: 4,
    recipeTags: [],
    recipeIngredients: [],
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

  describe('on ingredientNames field', () => {
    test('returns ingredientNames from recognizeIngredientNames', async () => {
      mockRecognize.mockResolvedValue({
        text: 'Flour (g)\nSugar (cups)',
        blocks: [createBlock('Flour (g)'), createBlock('Sugar (cups)')],
      });

      const result = await extractFieldFromImage(uriForOCR, 'ingredientNames', baseState, mockWarn);

      expect(result.ingredientNames).toEqual([
        { name: 'Flour', unit: 'g' },
        { name: 'Sugar', unit: 'cups' },
      ]);
    });

    test('returns empty ingredientNames when OCR finds nothing', async () => {
      mockRecognize.mockResolvedValue({ text: '', blocks: [] });

      const result = await extractFieldFromImage(uriForOCR, 'ingredientNames', baseState, mockWarn);

      expect(result.ingredientNames).toEqual([]);
    });
  });

  describe('on ingredientQuantities field', () => {
    test('returns ingredientQuantities from recognizeIngredientQuantities', async () => {
      mockRecognize.mockResolvedValue({
        text: '200\n1.5',
        blocks: [createBlock('200'), createBlock('1.5')],
      });

      const result = await extractFieldFromImage(
        uriForOCR,
        'ingredientQuantities',
        baseState,
        mockWarn
      );

      expect(result.ingredientQuantities).toEqual(['200', '1.5']);
    });

    test('returns empty ingredientQuantities when OCR finds nothing', async () => {
      mockRecognize.mockResolvedValue({ text: '', blocks: [] });

      const result = await extractFieldFromImage(
        uriForOCR,
        'ingredientQuantities',
        baseState,
        mockWarn
      );

      expect(result.ingredientQuantities).toEqual([]);
    });
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

  describe('parseIngredientsNoHeader', () => {
    test('Android format: names first half, quantities second half — no swap', () => {
      const lines = ['Flour', 'Sugar', 'Salt', '200 g', '100 g', '5 g'];
      const result = parseIngredientsNoHeader(lines);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Flour');
      expect(result[0].quantityPerPersons[0].quantity).toBe('200');
      expect(result[0].unit).toBe('g');
      expect(result[1].name).toBe('Sugar');
      expect(result[1].quantityPerPersons[0].quantity).toBe('100');
      expect(result[2].name).toBe('Salt');
      expect(result[2].quantityPerPersons[0].quantity).toBe('5');
    });

    test('iOS format: quantities first half start with digit — halves swapped', () => {
      const lines = ['200 g', '100 ml', 'Flour', 'Water'];
      const result = parseIngredientsNoHeader(lines);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Flour');
      expect(result[0].quantityPerPersons[0].quantity).toBe('200');
      expect(result[0].unit).toBe('g');
      expect(result[1].name).toBe('Water');
      expect(result[1].quantityPerPersons[0].quantity).toBe('100');
      expect(result[1].unit).toBe('ml');
    });

    test('odd number of lines: mid=1 produces 1 paired ingredient without crashing', () => {
      const lines = ['Butter', '50 g', 'Extra line'];
      const result = parseIngredientsNoHeader(lines);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Butter');
      expect(result[0].quantityPerPersons[0].quantity).toBe('50');
      expect(result[0].unit).toBe('g');
    });
  });
});
