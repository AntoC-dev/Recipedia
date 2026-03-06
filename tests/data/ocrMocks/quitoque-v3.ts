/* eslint-disable no-loss-of-precision */
import { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { FormIngredientElement } from '@customTypes/DatabaseElementTypes';

export const iosNamesOcrResult: TextRecognitionResult = {
  text: "carotte\ncitronnelle\ncébette\ngousse d'ail\nlait de coco (ml)\noignon jaune\npoireau\npois chiches\nconserve (g égoutté) Bio\npurée de tomates (e)\nriz basmati (g) Bio\népices Cachemire (sachet)",
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'it' }],
      frame: { top: 9, width: 181, height: 45, left: 6 },
      cornerPoints: [
        { x: 6, y: 12 },
        { x: 185.98841857910156, y: 9.95849323272705 },
        { x: 186.4647674560547, y: 51.95579147338867 },
        { x: 6.476351737976074, y: 53.99729919433594 },
      ],
      text: 'carotte',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'it' }],
          frame: { top: 9, width: 181, height: 45, left: 6 },
          cornerPoints: [
            { x: 6, y: 12 },
            { x: 185.98841857910156, y: 9.95849323272705 },
            { x: 186.4647674560547, y: 51.95579147338867 },
            { x: 6.476351737976074, y: 53.99729919433594 },
          ],
          text: 'carotte',
          elements: [
            {
              frame: { top: 9, width: 181, height: 45, left: 6 },
              cornerPoints: [
                { x: 6, y: 12 },
                { x: 185.98841857910156, y: 9.95849323272705 },
                { x: 186.4647674560547, y: 51.95579147338867 },
                { x: 6.476351737976074, y: 53.99729919433594 },
              ],
              text: 'carotte',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 80, width: 274, height: 50, left: 6 },
      cornerPoints: [
        { x: 6, y: 83 },
        { x: 278.98388671875, y: 80.03228759765625 },
        { x: 279.49481201171875, y: 127.02951049804688 },
        { x: 6.510924339294434, y: 129.99722290039062 },
      ],
      text: 'citronnelle',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 80, width: 274, height: 50, left: 6 },
          cornerPoints: [
            { x: 6, y: 83 },
            { x: 278.98388671875, y: 80.03228759765625 },
            { x: 279.49481201171875, y: 127.02951049804688 },
            { x: 6.510924339294434, y: 129.99722290039062 },
          ],
          text: 'citronnelle',
          elements: [
            {
              frame: { top: 80, width: 274, height: 50, left: 6 },
              cornerPoints: [
                { x: 6, y: 83 },
                { x: 278.98388671875, y: 80.03228759765625 },
                { x: 279.49481201171875, y: 127.02951049804688 },
                { x: 6.510924339294434, y: 129.99722290039062 },
              ],
              text: 'citronnelle',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 159, width: 184, height: 45, left: 15 },
      cornerPoints: [
        { x: 15, y: 159 },
        { x: 199, y: 159 },
        { x: 199, y: 204 },
        { x: 15, y: 204 },
      ],
      text: 'cébette',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 159, width: 184, height: 45, left: 15 },
          cornerPoints: [
            { x: 15, y: 159 },
            { x: 199, y: 159 },
            { x: 199, y: 204 },
            { x: 15, y: 204 },
          ],
          text: 'cébette',
          elements: [
            {
              frame: { top: 159, width: 184, height: 45, left: 15 },
              cornerPoints: [
                { x: 15, y: 159 },
                { x: 199, y: 159 },
                { x: 199, y: 204 },
                { x: 15, y: 204 },
              ],
              text: 'cébette',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 230, width: 297, height: 62, left: 6 },
      cornerPoints: [
        { x: 6, y: 245 },
        { x: 300.63818359375, y: 230.3934326171875 },
        { x: 302.96533203125, y: 277.3357849121094 },
        { x: 8.327147483825684, y: 291.9423522949219 },
      ],
      text: "gousse d'ail",
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 230, width: 297, height: 62, left: 6 },
          cornerPoints: [
            { x: 6, y: 245 },
            { x: 300.63818359375, y: 230.3934326171875 },
            { x: 302.96533203125, y: 277.3357849121094 },
            { x: 8.327147483825684, y: 291.9423522949219 },
          ],
          text: "gousse d'ail",
          elements: [
            {
              frame: { top: 240, width: 178, height: 50, left: 6 },
              cornerPoints: [
                { x: 6, y: 249 },
                { x: 181.7841339111328, y: 240.28558349609375 },
                { x: 183.81419372558594, y: 281.23529052734375 },
                { x: 8.030064582824707, y: 289.94970703125 },
              ],
              text: 'gousse',
            },
            {
              frame: { top: 230, width: 102, height: 53, left: 202 },
              cornerPoints: [
                { x: 202, y: 235 },
                { x: 300.8785705566406, y: 230.09812927246094 },
                { x: 303.2552185058594, y: 278.03924560546875 },
                { x: 204.3766632080078, y: 282.9411315917969 },
              ],
              text: "d'ail",
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'es' }],
      frame: { top: 306, width: 391, height: 55, left: 22 },
      cornerPoints: [
        { x: 22, y: 306 },
        { x: 413, y: 306 },
        { x: 413, y: 361 },
        { x: 22, y: 361 },
      ],
      text: 'lait de coco (ml)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'es' }],
          frame: { top: 306, width: 391, height: 55, left: 22 },
          cornerPoints: [
            { x: 22, y: 306 },
            { x: 413, y: 306 },
            { x: 413, y: 361 },
            { x: 22, y: 361 },
          ],
          text: 'lait de coco (ml)',
          elements: [
            {
              frame: { top: 310, width: 61, height: 45, left: 22 },
              cornerPoints: [
                { x: 22, y: 310 },
                { x: 83, y: 310 },
                { x: 83, y: 355 },
                { x: 22, y: 355 },
              ],
              text: 'lait',
            },
            {
              frame: { top: 310, width: 61, height: 45, left: 102 },
              cornerPoints: [
                { x: 102, y: 310 },
                { x: 163, y: 310 },
                { x: 163, y: 355 },
                { x: 102, y: 355 },
              ],
              text: 'de',
            },
            {
              frame: { top: 322, width: 119, height: 33, left: 182 },
              cornerPoints: [
                { x: 182, y: 322 },
                { x: 301, y: 322 },
                { x: 301, y: 355 },
                { x: 182, y: 355 },
              ],
              text: 'coco',
            },
            {
              frame: { top: 306, width: 91, height: 55, left: 322 },
              cornerPoints: [
                { x: 322, y: 306 },
                { x: 413, y: 306 },
                { x: 413, y: 361 },
                { x: 322, y: 361 },
              ],
              text: '(ml)',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 389, width: 325, height: 52, left: 15 },
      cornerPoints: [
        { x: 15, y: 389 },
        { x: 340, y: 389 },
        { x: 340, y: 441 },
        { x: 15, y: 441 },
      ],
      text: 'oignon jaune',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 389, width: 325, height: 52, left: 15 },
          cornerPoints: [
            { x: 15, y: 389 },
            { x: 340, y: 389 },
            { x: 340, y: 441 },
            { x: 15, y: 441 },
          ],
          text: 'oignon jaune',
          elements: [
            {
              frame: { top: 389, width: 166, height: 51, left: 15 },
              cornerPoints: [
                { x: 15, y: 389 },
                { x: 181, y: 389 },
                { x: 181, y: 440 },
                { x: 15, y: 440 },
              ],
              text: 'oignon',
            },
            {
              frame: { top: 389, width: 142, height: 52, left: 198 },
              cornerPoints: [
                { x: 198, y: 389 },
                { x: 340, y: 389 },
                { x: 340, y: 441 },
                { x: 198, y: 441 },
              ],
              text: 'jaune',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 462, width: 183, height: 53, left: 15 },
      cornerPoints: [
        { x: 15, y: 462 },
        { x: 198, y: 462 },
        { x: 198, y: 515 },
        { x: 15, y: 515 },
      ],
      text: 'poireau',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 462, width: 183, height: 53, left: 15 },
          cornerPoints: [
            { x: 15, y: 462 },
            { x: 198, y: 462 },
            { x: 198, y: 515 },
            { x: 15, y: 515 },
          ],
          text: 'poireau',
          elements: [
            {
              frame: { top: 462, width: 183, height: 53, left: 15 },
              cornerPoints: [
                { x: 15, y: 462 },
                { x: 198, y: 462 },
                { x: 198, y: 515 },
                { x: 15, y: 515 },
              ],
              text: 'poireau',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 531, width: 310, height: 60, left: 12 },
      cornerPoints: [
        { x: 12, y: 537 },
        { x: 320.9570007324219, y: 531.845703125 },
        { x: 321.8577575683594, y: 585.8381958007812 },
        { x: 12.90074634552002, y: 590.9924926757812 },
      ],
      text: 'pois chiches',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 531, width: 310, height: 60, left: 12 },
          cornerPoints: [
            { x: 12, y: 537 },
            { x: 320.9570007324219, y: 531.845703125 },
            { x: 321.8577575683594, y: 585.8381958007812 },
            { x: 12.90074634552002, y: 590.9924926757812 },
          ],
          text: 'pois chiches',
          elements: [
            {
              frame: { top: 535, width: 100, height: 56, left: 12 },
              cornerPoints: [
                { x: 12, y: 537 },
                { x: 110.9862289428711, y: 535.3486328125 },
                { x: 111.88697814941406, y: 589.3411254882812 },
                { x: 12.90074634552002, y: 590.9924926757812 },
              ],
              text: 'pois',
            },
            {
              frame: { top: 533, width: 190, height: 52, left: 132 },
              cornerPoints: [
                { x: 132, y: 537 },
                { x: 320.97369384765625, y: 533.847412109375 },
                { x: 321.77435302734375, y: 581.8407592773438 },
                { x: 132.8006591796875, y: 584.9933471679688 },
              ],
              text: 'chiches',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'pt' }],
      frame: { top: 612, width: 625, height: 59, left: 14 },
      cornerPoints: [
        { x: 14, y: 612 },
        { x: 639, y: 612 },
        { x: 639, y: 671 },
        { x: 14, y: 671 },
      ],
      text: 'conserve (g égoutté) Bio',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'pt' }],
          frame: { top: 612, width: 625, height: 59, left: 14 },
          cornerPoints: [
            { x: 14, y: 612 },
            { x: 639, y: 612 },
            { x: 639, y: 671 },
            { x: 14, y: 671 },
          ],
          text: 'conserve (g égoutté) Bio',
          elements: [
            {
              frame: { top: 626, width: 225, height: 33, left: 14 },
              cornerPoints: [
                { x: 14, y: 626 },
                { x: 239, y: 626 },
                { x: 239, y: 659 },
                { x: 14, y: 659 },
              ],
              text: 'conserve',
            },
            {
              frame: { top: 612, width: 43, height: 59, left: 260 },
              cornerPoints: [
                { x: 260, y: 612 },
                { x: 303, y: 612 },
                { x: 303, y: 671 },
                { x: 260, y: 671 },
              ],
              text: '(g',
            },
            {
              frame: { top: 612, width: 215, height: 59, left: 322 },
              cornerPoints: [
                { x: 322, y: 612 },
                { x: 537, y: 612 },
                { x: 537, y: 671 },
                { x: 322, y: 671 },
              ],
              text: 'égoutté)',
            },
            {
              frame: { top: 614, width: 79, height: 45, left: 560 },
              cornerPoints: [
                { x: 560, y: 614 },
                { x: 639, y: 614 },
                { x: 639, y: 659 },
                { x: 560, y: 659 },
              ],
              text: 'Bio',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 688, width: 527, height: 137, left: 14 },
      cornerPoints: [
        { x: 14, y: 688 },
        { x: 541, y: 688 },
        { x: 541, y: 825 },
        { x: 14, y: 825 },
      ],
      text: 'purée de tomates (e)\nriz basmati (g) Bio',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 688, width: 525, height: 59, left: 16 },
          cornerPoints: [
            { x: 16, y: 688 },
            { x: 541, y: 688 },
            { x: 541, y: 747 },
            { x: 16, y: 747 },
          ],
          text: 'purée de tomates (e)',
          elements: [
            {
              frame: { top: 690, width: 139, height: 53, left: 16 },
              cornerPoints: [
                { x: 16, y: 690 },
                { x: 155, y: 690 },
                { x: 155, y: 743 },
                { x: 16, y: 743 },
              ],
              text: 'purée',
            },
            {
              frame: { top: 690, width: 59, height: 45, left: 176 },
              cornerPoints: [
                { x: 176, y: 690 },
                { x: 235, y: 690 },
                { x: 235, y: 735 },
                { x: 176, y: 735 },
              ],
              text: 'de',
            },
            {
              frame: { top: 694, width: 211, height: 43, left: 254 },
              cornerPoints: [
                { x: 254, y: 694 },
                { x: 465, y: 694 },
                { x: 465, y: 737 },
                { x: 254, y: 737 },
              ],
              text: 'tomates',
            },
            {
              frame: { top: 688, width: 55, height: 59, left: 486 },
              cornerPoints: [
                { x: 486, y: 688 },
                { x: 541, y: 688 },
                { x: 541, y: 747 },
                { x: 486, y: 747 },
              ],
              text: '(e)',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'tr' }],
          frame: { top: 761, width: 455, height: 64, left: 13 },
          cornerPoints: [
            { x: 14, y: 761 },
            { x: 467.9729309082031, y: 765.9559326171875 },
            { x: 467.3288879394531, y: 824.952392578125 },
            { x: 13.355945587158203, y: 819.9964599609375 },
          ],
          text: 'riz basmati (g) Bio',
          elements: [
            {
              frame: { top: 764, width: 57, height: 46, left: 13 },
              cornerPoints: [
                { x: 14, y: 764 },
                { x: 69.99665832519531, y: 764.611328125 },
                { x: 69.50543212890625, y: 809.608642578125 },
                { x: 13.508772850036621, y: 808.997314453125 },
              ],
              text: 'riz',
            },
            {
              frame: { top: 763, width: 196, height: 51, left: 90 },
              cornerPoints: [
                { x: 91, y: 763 },
                { x: 285.9883728027344, y: 765.128662109375 },
                { x: 285.4643859863281, y: 813.1257934570312 },
                { x: 90.47602081298828, y: 810.9971313476562 },
              ],
              text: 'basmati',
            },
            {
              frame: { top: 764, width: 59, height: 60, left: 307 },
              cornerPoints: [
                { x: 308, y: 764 },
                { x: 365.9965515136719, y: 764.6331176757812 },
                { x: 365.3525085449219, y: 823.6295776367188 },
                { x: 307.35595703125, y: 822.9964599609375 },
              ],
              text: '(g)',
            },
            {
              frame: { top: 767, width: 80, height: 46, left: 388 },
              cornerPoints: [
                { x: 389, y: 767 },
                { x: 467.99530029296875, y: 767.8623657226562 },
                { x: 467.5040588378906, y: 812.8596801757812 },
                { x: 388.5087585449219, y: 811.997314453125 },
              ],
              text: 'Bio',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 839, width: 624, height: 56, left: 17 },
      cornerPoints: [
        { x: 17, y: 839 },
        { x: 641, y: 839 },
        { x: 641, y: 895 },
        { x: 17, y: 895 },
      ],
      text: 'épices Cachemire (sachet)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 839, width: 624, height: 56, left: 17 },
          cornerPoints: [
            { x: 17, y: 839 },
            { x: 641, y: 839 },
            { x: 641, y: 895 },
            { x: 17, y: 895 },
          ],
          text: 'épices Cachemire (sachet)',
          elements: [
            {
              frame: { top: 839, width: 148, height: 55, left: 17 },
              cornerPoints: [
                { x: 17, y: 839 },
                { x: 165, y: 839 },
                { x: 165, y: 894 },
                { x: 17, y: 894 },
              ],
              text: 'épices',
            },
            {
              frame: { top: 842, width: 264, height: 46, left: 183 },
              cornerPoints: [
                { x: 183, y: 842 },
                { x: 447, y: 842 },
                { x: 447, y: 888 },
                { x: 183, y: 888 },
              ],
              text: 'Cachemire',
            },
            {
              frame: { top: 840, width: 175, height: 55, left: 466 },
              cornerPoints: [
                { x: 466, y: 840 },
                { x: 641, y: 840 },
                { x: 641, y: 895 },
                { x: 466, y: 895 },
              ],
              text: '(sachet)',
            },
          ],
        },
      ],
    },
  ],
};

export const androidNamesOcrResult: TextRecognitionResult = {
  text: "carotte\ncitronnelle\ncébette\ngousse d'ail\nlait de coco (ml)\noignon jaune\npoireau\npois chiches\nconserve (g égoutté) Bio\npurée de tomates (g)\nriz basmati (g) Bio\népices Cachemire (sachet)",
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 12, height: 42, left: 14, width: 174 },
      cornerPoints: [
        { y: 12, x: 14 },
        { y: 12, x: 188 },
        { y: 54, x: 188 },
        { y: 54, x: 14 },
      ],
      text: 'carotte',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'it' }],
          frame: { top: 12, height: 42, left: 14, width: 174 },
          cornerPoints: [
            { y: 12, x: 14 },
            { y: 12, x: 188 },
            { y: 54, x: 188 },
            { y: 54, x: 14 },
          ],
          text: 'carotte',
          elements: [
            {
              frame: { top: 12, height: 42, left: 14, width: 174 },
              cornerPoints: [
                { y: 12, x: 14 },
                { y: 12, x: 188 },
                { y: 54, x: 188 },
                { y: 54, x: 14 },
              ],
              text: 'carotte',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 76, height: 129, left: 6, width: 273 },
      cornerPoints: [
        { y: 79, x: 6 },
        { y: 76, x: 278 },
        { y: 202, x: 279 },
        { y: 205, x: 7 },
      ],
      text: 'citronnelle\ncébette',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 76, height: 57, left: 6, width: 272 },
          cornerPoints: [
            { y: 82, x: 6 },
            { y: 76, x: 278 },
            { y: 127, x: 278 },
            { y: 133, x: 6 },
          ],
          text: 'citronnelle',
          elements: [
            {
              frame: { top: 76, height: 57, left: 6, width: 272 },
              cornerPoints: [
                { y: 82, x: 6 },
                { y: 76, x: 278 },
                { y: 127, x: 278 },
                { y: 133, x: 6 },
              ],
              text: 'citronnelle',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 158, height: 46, left: 14, width: 186 },
          cornerPoints: [
            { y: 158, x: 14 },
            { y: 158, x: 200 },
            { y: 204, x: 200 },
            { y: 204, x: 14 },
          ],
          text: 'cébette',
          elements: [
            {
              frame: { top: 158, height: 46, left: 14, width: 186 },
              cornerPoints: [
                { y: 158, x: 14 },
                { y: 158, x: 200 },
                { y: 204, x: 200 },
                { y: 204, x: 14 },
              ],
              text: 'cébette',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 229, height: 63, left: 6, width: 294 },
      cornerPoints: [
        { y: 243, x: 6 },
        { y: 229, x: 298 },
        { y: 278, x: 300 },
        { y: 292, x: 8 },
      ],
      text: "gousse d'ail",
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 229, height: 63, left: 6, width: 294 },
          cornerPoints: [
            { y: 243, x: 6 },
            { y: 229, x: 298 },
            { y: 278, x: 300 },
            { y: 292, x: 8 },
          ],
          text: "gousse d'ail",
          elements: [
            {
              frame: { top: 234, height: 58, left: 6, width: 177 },
              cornerPoints: [
                { y: 243, x: 6 },
                { y: 234, x: 181 },
                { y: 283, x: 183 },
                { y: 292, x: 8 },
              ],
              text: 'gousse',
            },
            {
              frame: { top: 229, height: 54, left: 201, width: 99 },
              cornerPoints: [
                { y: 234, x: 201 },
                { y: 229, x: 298 },
                { y: 278, x: 300 },
                { y: 283, x: 203 },
              ],
              text: "d'ail",
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 306, height: 283, left: 11, width: 402 },
      cornerPoints: [
        { y: 308, x: 11 },
        { y: 306, x: 413 },
        { y: 587, x: 413 },
        { y: 589, x: 11 },
      ],
      text: 'lait de coco (ml)\noignon jaune\npoireau\npois chiches',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'es' }],
          frame: { top: 308, height: 54, left: 14, width: 400 },
          cornerPoints: [
            { y: 308, x: 14 },
            { y: 308, x: 414 },
            { y: 362, x: 414 },
            { y: 362, x: 14 },
          ],
          text: 'lait de coco (ml)',
          elements: [
            {
              frame: { top: 308, height: 54, left: 14, width: 70 },
              cornerPoints: [
                { y: 308, x: 14 },
                { y: 308, x: 84 },
                { y: 362, x: 84 },
                { y: 362, x: 14 },
              ],
              text: 'lait',
            },
            {
              frame: { top: 308, height: 54, left: 102, width: 62 },
              cornerPoints: [
                { y: 308, x: 102 },
                { y: 308, x: 164 },
                { y: 362, x: 164 },
                { y: 362, x: 102 },
              ],
              text: 'de',
            },
            {
              frame: { top: 308, height: 54, left: 182, width: 120 },
              cornerPoints: [
                { y: 308, x: 182 },
                { y: 308, x: 302 },
                { y: 362, x: 302 },
                { y: 362, x: 182 },
              ],
              text: 'coco',
            },
            {
              frame: { top: 308, height: 54, left: 322, width: 92 },
              cornerPoints: [
                { y: 308, x: 322 },
                { y: 308, x: 414 },
                { y: 362, x: 414 },
                { y: 362, x: 322 },
              ],
              text: '(ml)',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 386, height: 56, left: 16, width: 326 },
          cornerPoints: [
            { y: 386, x: 16 },
            { y: 386, x: 342 },
            { y: 442, x: 342 },
            { y: 442, x: 16 },
          ],
          text: 'oignon jaune',
          elements: [
            {
              frame: { top: 386, height: 56, left: 16, width: 166 },
              cornerPoints: [
                { y: 386, x: 16 },
                { y: 386, x: 182 },
                { y: 442, x: 182 },
                { y: 442, x: 16 },
              ],
              text: 'oignon',
            },
            {
              frame: { top: 386, height: 56, left: 198, width: 144 },
              cornerPoints: [
                { y: 386, x: 198 },
                { y: 386, x: 342 },
                { y: 442, x: 342 },
                { y: 442, x: 198 },
              ],
              text: 'jaune',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 460, height: 54, left: 16, width: 184 },
          cornerPoints: [
            { y: 460, x: 16 },
            { y: 460, x: 200 },
            { y: 514, x: 200 },
            { y: 514, x: 16 },
          ],
          text: 'poireau',
          elements: [
            {
              frame: { top: 460, height: 54, left: 16, width: 184 },
              cornerPoints: [
                { y: 460, x: 16 },
                { y: 460, x: 200 },
                { y: 514, x: 200 },
                { y: 514, x: 16 },
              ],
              text: 'poireau',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 532, height: 57, left: 12, width: 308 },
          cornerPoints: [
            { y: 536, x: 12 },
            { y: 532, x: 320 },
            { y: 585, x: 320 },
            { y: 589, x: 12 },
          ],
          text: 'pois chiches',
          elements: [
            {
              frame: { top: 534, height: 55, left: 12, width: 98 },
              cornerPoints: [
                { y: 536, x: 12 },
                { y: 534, x: 110 },
                { y: 587, x: 110 },
                { y: 589, x: 12 },
              ],
              text: 'pois',
            },
            {
              frame: { top: 532, height: 56, left: 131, width: 189 },
              cornerPoints: [
                { y: 535, x: 131 },
                { y: 532, x: 320 },
                { y: 585, x: 320 },
                { y: 588, x: 131 },
              ],
              text: 'chiches',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 611, height: 289, left: 13, width: 649 },
      cornerPoints: [
        { y: 611, x: 14 },
        { y: 612, x: 662 },
        { y: 900, x: 661 },
        { y: 899, x: 13 },
      ],
      text: 'conserve (g égoutté) Bio\npurée de tomates (g)\nriz basmati (g) Bio\népices Cachemire (sachet)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'pt' }],
          frame: { top: 613, height: 58, left: 15, width: 624 },
          cornerPoints: [
            { y: 613, x: 15 },
            { y: 613, x: 639 },
            { y: 671, x: 639 },
            { y: 671, x: 15 },
          ],
          text: 'conserve (g égoutté) Bio',
          elements: [
            {
              frame: { top: 613, height: 58, left: 15, width: 226 },
              cornerPoints: [
                { y: 613, x: 15 },
                { y: 613, x: 241 },
                { y: 671, x: 241 },
                { y: 671, x: 15 },
              ],
              text: 'conserve',
            },
            {
              frame: { top: 613, height: 58, left: 260, width: 44 },
              cornerPoints: [
                { y: 613, x: 260 },
                { y: 613, x: 304 },
                { y: 671, x: 304 },
                { y: 671, x: 260 },
              ],
              text: '(g',
            },
            {
              frame: { top: 613, height: 58, left: 322, width: 214 },
              cornerPoints: [
                { y: 613, x: 322 },
                { y: 613, x: 536 },
                { y: 671, x: 536 },
                { y: 671, x: 322 },
              ],
              text: 'égoutté)',
            },
            {
              frame: { top: 613, height: 58, left: 559, width: 80 },
              cornerPoints: [
                { y: 613, x: 559 },
                { y: 613, x: 639 },
                { y: 671, x: 639 },
                { y: 671, x: 559 },
              ],
              text: 'Bio',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 688, height: 59, left: 15, width: 529 },
          cornerPoints: [
            { y: 688, x: 15 },
            { y: 688, x: 544 },
            { y: 747, x: 544 },
            { y: 747, x: 15 },
          ],
          text: 'purée de tomates (g)',
          elements: [
            {
              frame: { top: 688, height: 59, left: 15, width: 141 },
              cornerPoints: [
                { y: 688, x: 15 },
                { y: 688, x: 156 },
                { y: 747, x: 156 },
                { y: 747, x: 15 },
              ],
              text: 'purée',
            },
            {
              frame: { top: 688, height: 59, left: 176, width: 59 },
              cornerPoints: [
                { y: 688, x: 176 },
                { y: 688, x: 235 },
                { y: 747, x: 235 },
                { y: 747, x: 176 },
              ],
              text: 'de',
            },
            {
              frame: { top: 688, height: 59, left: 254, width: 210 },
              cornerPoints: [
                { y: 688, x: 254 },
                { y: 688, x: 464 },
                { y: 747, x: 464 },
                { y: 747, x: 254 },
              ],
              text: 'tomates',
            },
            {
              frame: { top: 688, height: 59, left: 484, width: 60 },
              cornerPoints: [
                { y: 688, x: 484 },
                { y: 688, x: 544 },
                { y: 747, x: 544 },
                { y: 747, x: 484 },
              ],
              text: '(g)',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'tr' }],
          frame: { top: 760, height: 61, left: 13, width: 455 },
          cornerPoints: [
            { y: 760, x: 14 },
            { y: 764, x: 468 },
            { y: 821, x: 467 },
            { y: 817, x: 13 },
          ],
          text: 'riz basmati (g) Bio',
          elements: [
            {
              frame: { top: 761, height: 56, left: 13, width: 57 },
              cornerPoints: [
                { y: 761, x: 14 },
                { y: 761, x: 70 },
                { y: 817, x: 69 },
                { y: 817, x: 13 },
              ],
              text: 'riz',
            },
            {
              frame: { top: 761, height: 58, left: 90, width: 197 },
              cornerPoints: [
                { y: 761, x: 91 },
                { y: 763, x: 287 },
                { y: 819, x: 286 },
                { y: 817, x: 90 },
              ],
              text: 'basmati',
            },
            {
              frame: { top: 764, height: 56, left: 306, width: 60 },
              cornerPoints: [
                { y: 764, x: 307 },
                { y: 764, x: 366 },
                { y: 820, x: 365 },
                { y: 820, x: 306 },
              ],
              text: '(g)',
            },
            {
              frame: { top: 764, height: 57, left: 388, width: 80 },
              cornerPoints: [
                { y: 764, x: 389 },
                { y: 764, x: 468 },
                { y: 821, x: 467 },
                { y: 821, x: 388 },
              ],
              text: 'Bio',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 837, height: 63, left: 16, width: 646 },
          cornerPoints: [
            { y: 837, x: 16 },
            { y: 837, x: 662 },
            { y: 900, x: 662 },
            { y: 900, x: 16 },
          ],
          text: 'épices Cachemire (sachet)',
          elements: [
            {
              frame: { top: 837, height: 63, left: 16, width: 150 },
              cornerPoints: [
                { y: 837, x: 16 },
                { y: 837, x: 166 },
                { y: 900, x: 166 },
                { y: 900, x: 16 },
              ],
              text: 'épices',
            },
            {
              frame: { top: 837, height: 63, left: 183, width: 265 },
              cornerPoints: [
                { y: 837, x: 183 },
                { y: 837, x: 448 },
                { y: 900, x: 448 },
                { y: 900, x: 183 },
              ],
              text: 'Cachemire',
            },
            {
              frame: { top: 837, height: 63, left: 467, width: 195 },
              cornerPoints: [
                { y: 837, x: 467 },
                { y: 837, x: 662 },
                { y: 900, x: 662 },
                { y: 900, x: 467 },
              ],
              text: '(sachet)',
            },
          ],
        },
      ],
    },
  ],
};

export const quantitiesOcrResult: TextRecognitionResult = {
  text: '1\n200\n1\n1',
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 247, height: 41, left: 91, width: 23 },
      cornerPoints: [
        { y: 247, x: 91 },
        { y: 247, x: 114 },
        { y: 288, x: 114 },
        { y: 288, x: 91 },
      ],
      text: '1',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 247, height: 41, left: 91, width: 23 },
          cornerPoints: [
            { y: 247, x: 91 },
            { y: 247, x: 114 },
            { y: 288, x: 114 },
            { y: 288, x: 91 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 247, height: 41, left: 91, width: 23 },
              cornerPoints: [
                { y: 247, x: 91 },
                { y: 247, x: 114 },
                { y: 288, x: 114 },
                { y: 288, x: 91 },
              ],
              text: '1',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 321, height: 46, left: 54, width: 100 },
      cornerPoints: [
        { y: 321, x: 54 },
        { y: 321, x: 154 },
        { y: 367, x: 154 },
        { y: 367, x: 54 },
      ],
      text: '200',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 321, height: 46, left: 54, width: 100 },
          cornerPoints: [
            { y: 321, x: 54 },
            { y: 321, x: 154 },
            { y: 367, x: 154 },
            { y: 367, x: 54 },
          ],
          text: '200',
          elements: [
            {
              frame: { top: 321, height: 46, left: 54, width: 100 },
              cornerPoints: [
                { y: 321, x: 54 },
                { y: 321, x: 154 },
                { y: 367, x: 154 },
                { y: 367, x: 54 },
              ],
              text: '200',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 398, height: 42, left: 93, width: 24 },
      cornerPoints: [
        { y: 398, x: 93 },
        { y: 398, x: 117 },
        { y: 440, x: 117 },
        { y: 440, x: 93 },
      ],
      text: '1',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 398, height: 42, left: 93, width: 24 },
          cornerPoints: [
            { y: 398, x: 93 },
            { y: 398, x: 117 },
            { y: 440, x: 117 },
            { y: 440, x: 93 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 398, height: 42, left: 93, width: 24 },
              cornerPoints: [
                { y: 398, x: 93 },
                { y: 398, x: 117 },
                { y: 440, x: 117 },
                { y: 440, x: 93 },
              ],
              text: '1',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 474, height: 44, left: 93, width: 19 },
      cornerPoints: [
        { y: 474, x: 93 },
        { y: 474, x: 112 },
        { y: 518, x: 112 },
        { y: 518, x: 93 },
      ],
      text: '1',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 474, height: 44, left: 93, width: 19 },
          cornerPoints: [
            { y: 474, x: 93 },
            { y: 474, x: 112 },
            { y: 518, x: 112 },
            { y: 518, x: 93 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 474, height: 44, left: 93, width: 19 },
              cornerPoints: [
                { y: 474, x: 93 },
                { y: 474, x: 112 },
                { y: 518, x: 112 },
                { y: 518, x: 93 },
              ],
              text: '1',
            },
          ],
        },
      ],
    },
  ],
};

export const expectedIngredientNames: FormIngredientElement[] = [
  { name: 'carotte', unit: '' },
  { name: 'citronnelle', unit: '' },
  { name: 'cébette', unit: '' },
  { name: "gousse d'ail", unit: '' },
  { name: 'lait de coco', unit: 'ml' },
  { name: 'oignon jaune', unit: '' },
  { name: 'poireau', unit: '' },
  { name: 'pois chiches', unit: '' },
  { name: 'conserve  Bio', unit: 'g égoutté' },
  { name: 'purée de tomates', unit: 'g' },
  { name: 'riz basmati  Bio', unit: 'g' },
  { name: 'épices Cachemire', unit: 'sachet' },
];

export const expectedQuantities: string[] = ['1', '200', '1', '1'];

export const expectedIosIngredientNames: FormIngredientElement[] = [
  { name: 'carotte', unit: '' },
  { name: 'citronnelle', unit: '' },
  { name: 'cébette', unit: '' },
  { name: "gousse d'ail", unit: '' },
  { name: 'lait de coco', unit: 'ml' },
  { name: 'oignon jaune', unit: '' },
  { name: 'poireau', unit: '' },
  { name: 'pois chiches', unit: '' },
  { name: 'conserve  Bio', unit: 'g égoutté' },
  { name: 'purée de tomates', unit: 'e' },
  { name: 'riz basmati  Bio', unit: 'g' },
  { name: 'épices Cachemire', unit: 'sachet' },
];

export const iosQuantitiesOcrResult: TextRecognitionResult = {
  text: '1\n1\n1\n1\n200\n100\n1\n1\n125\n150\n1',
  blocks: [
    {
      recognizedLanguages: [],
      frame: { top: 18, width: 26, height: 45, left: 90 },
      cornerPoints: [
        { x: 91, y: 18 },
        { x: 115.9974136352539, y: 18.359479904174805 },
        { x: 115.36473083496094, y: 62.35492706298828 },
        { x: 90.36731719970703, y: 61.99544906616211 },
      ],
      text: '1',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 18, width: 26, height: 45, left: 90 },
          cornerPoints: [
            { x: 91, y: 18 },
            { x: 115.9974136352539, y: 18.359479904174805 },
            { x: 115.36473083496094, y: 62.35492706298828 },
            { x: 90.36731719970703, y: 61.99544906616211 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 18, width: 26, height: 45, left: 90 },
              cornerPoints: [
                { x: 91, y: 18 },
                { x: 115.9974136352539, y: 18.359479904174805 },
                { x: 115.36473083496094, y: 62.35492706298828 },
                { x: 90.36731719970703, y: 61.99544906616211 },
              ],
              text: '1',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 93, width: 26, height: 45, left: 90 },
      cornerPoints: [
        { x: 90, y: 95 },
        { x: 113.9734115600586, y: 93.8705825805664 },
        { x: 115.99695587158203, y: 136.82293701171875 },
        { x: 92.02354431152344, y: 137.95236206054688 },
      ],
      text: '1',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 93, width: 26, height: 45, left: 90 },
          cornerPoints: [
            { x: 90, y: 95 },
            { x: 113.9734115600586, y: 93.8705825805664 },
            { x: 115.99695587158203, y: 136.82293701171875 },
            { x: 92.02354431152344, y: 137.95236206054688 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 93, width: 26, height: 45, left: 90 },
              cornerPoints: [
                { x: 90, y: 95 },
                { x: 113.9734115600586, y: 93.8705825805664 },
                { x: 115.99695587158203, y: 136.82293701171875 },
                { x: 92.02354431152344, y: 137.95236206054688 },
              ],
              text: '1',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 170, width: 26, height: 45, left: 90 },
      cornerPoints: [
        { x: 90, y: 172 },
        { x: 111.93883514404297, y: 170.36065673828125 },
        { x: 115.14299774169922, y: 213.24111938476562 },
        { x: 93.20416259765625, y: 214.88046264648438 },
      ],
      text: '1',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 170, width: 26, height: 45, left: 90 },
          cornerPoints: [
            { x: 90, y: 172 },
            { x: 111.93883514404297, y: 170.36065673828125 },
            { x: 115.14299774169922, y: 213.24111938476562 },
            { x: 93.20416259765625, y: 214.88046264648438 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 170, width: 26, height: 45, left: 90 },
              cornerPoints: [
                { x: 90, y: 172 },
                { x: 111.93883514404297, y: 170.36065673828125 },
                { x: 115.14299774169922, y: 213.24111938476562 },
                { x: 93.20416259765625, y: 214.88046264648438 },
              ],
              text: '1',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 245, width: 23, height: 45, left: 91 },
      cornerPoints: [
        { x: 91, y: 246 },
        { x: 111.98966217041016, y: 245.34117126464844 },
        { x: 113.37006378173828, y: 289.31951904296875 },
        { x: 92.38040161132812, y: 289.97833251953125 },
      ],
      text: '1',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 245, width: 23, height: 45, left: 91 },
          cornerPoints: [
            { x: 91, y: 246 },
            { x: 111.98966217041016, y: 245.34117126464844 },
            { x: 113.37006378173828, y: 289.31951904296875 },
            { x: 92.38040161132812, y: 289.97833251953125 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 245, width: 23, height: 45, left: 91 },
              cornerPoints: [
                { x: 91, y: 246 },
                { x: 111.98966217041016, y: 245.34117126464844 },
                { x: 113.37006378173828, y: 289.31951904296875 },
                { x: 92.38040161132812, y: 289.97833251953125 },
              ],
              text: '1',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 312, width: 187, height: 334, left: -14 },
      cornerPoints: [
        { x: 3, y: 312 },
        { x: 172.78073120117188, y: 320.6314697265625 },
        { x: 156.27940368652344, y: 645.2122802734375 },
        { x: -13.501325607299805, y: 636.580810546875 },
      ],
      text: '200\n100',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 312, width: 156, height: 66, left: 0 },
          cornerPoints: [
            { x: 3, y: 312 },
            { x: 155.8026580810547, y: 319.768310546875 },
            { x: 152.85780334472656, y: 377.6935119628906 },
            { x: 0.05514788627624512, y: 369.9252014160156 },
          ],
          text: '200',
          elements: [
            {
              frame: { top: 312, width: 156, height: 66, left: 0 },
              cornerPoints: [
                { x: 3, y: 312 },
                { x: 155.8026580810547, y: 319.768310546875 },
                { x: 152.85780334472656, y: 377.6935119628906 },
                { x: 0.05514788627624512, y: 369.9252014160156 },
              ],
              text: '200',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 582, width: 157, height: 59, left: 0 },
          cornerPoints: [
            { x: 2, y: 582 },
            { x: 156.9629669189453, y: 585.38818359375 },
            { x: 155.7606964111328, y: 640.3750610351562 },
            { x: 0.7977365255355835, y: 636.9868774414062 },
          ],
          text: '100',
          elements: [
            {
              frame: { top: 582, width: 157, height: 59, left: 0 },
              cornerPoints: [
                { x: 2, y: 582 },
                { x: 156.9629669189453, y: 585.38818359375 },
                { x: 155.7606964111328, y: 640.3750610351562 },
                { x: 0.7977365255355835, y: 636.9868774414062 },
              ],
              text: '100',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 397, width: 25, height: 46, left: 92 },
      cornerPoints: [
        { x: 92, y: 399 },
        { x: 113.9683837890625, y: 397.8208923339844 },
        { x: 116.32661437988281, y: 441.7576599121094 },
        { x: 94.35823059082031, y: 442.936767578125 },
      ],
      text: '1',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 397, width: 25, height: 46, left: 92 },
          cornerPoints: [
            { x: 92, y: 399 },
            { x: 113.9683837890625, y: 397.8208923339844 },
            { x: 116.32661437988281, y: 441.7576599121094 },
            { x: 94.35823059082031, y: 442.936767578125 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 397, width: 25, height: 46, left: 92 },
              cornerPoints: [
                { x: 92, y: 399 },
                { x: 113.9683837890625, y: 397.8208923339844 },
                { x: 116.32661437988281, y: 441.7576599121094 },
                { x: 94.35823059082031, y: 442.936767578125 },
              ],
              text: '1',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 473, width: 26, height: 45, left: 92 },
      cornerPoints: [
        { x: 92, y: 474 },
        { x: 115.98274993896484, y: 473.0901794433594 },
        { x: 117.6507339477539, y: 517.0585327148438 },
        { x: 93.66798400878906, y: 517.9683837890625 },
      ],
      text: '1',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 473, width: 26, height: 45, left: 92 },
          cornerPoints: [
            { x: 92, y: 474 },
            { x: 115.98274993896484, y: 473.0901794433594 },
            { x: 117.6507339477539, y: 517.0585327148438 },
            { x: 93.66798400878906, y: 517.9683837890625 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 473, width: 26, height: 45, left: 92 },
              cornerPoints: [
                { x: 92, y: 474 },
                { x: 115.98274993896484, y: 473.0901794433594 },
                { x: 117.6507339477539, y: 517.0585327148438 },
                { x: 93.66798400878906, y: 517.9683837890625 },
              ],
              text: '1',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 703, width: 103, height: 198, left: 58 },
      cornerPoints: [
        { x: 58, y: 705 },
        { x: 156.983154296875, y: 703.1739501953125 },
        { x: 160.59841918945312, y: 899.140625 },
        { x: 61.61526870727539, y: 900.9666748046875 },
      ],
      text: '125\n150\n1',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 703, width: 97, height: 47, left: 58 },
          cornerPoints: [
            { x: 58, y: 705 },
            { x: 153.98367309570312, y: 703.229248046875 },
            { x: 154.81370544433594, y: 748.2216186523438 },
            { x: 58.83003616333008, y: 749.9923706054688 },
          ],
          text: '125',
          elements: [
            {
              frame: { top: 703, width: 97, height: 47, left: 58 },
              cornerPoints: [
                { x: 58, y: 705 },
                { x: 153.98367309570312, y: 703.229248046875 },
                { x: 154.81370544433594, y: 748.2216186523438 },
                { x: 58.83003616333008, y: 749.9923706054688 },
              ],
              text: '125',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 780, width: 98, height: 45, left: 60 },
          cornerPoints: [
            { x: 60, y: 780 },
            { x: 158, y: 780 },
            { x: 158, y: 825 },
            { x: 60, y: 825 },
          ],
          text: '150',
          elements: [
            {
              frame: { top: 780, width: 98, height: 45, left: 60 },
              cornerPoints: [
                { x: 60, y: 780 },
                { x: 158, y: 780 },
                { x: 158, y: 825 },
                { x: 60, y: 825 },
              ],
              text: '150',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 856, width: 26, height: 44, left: 95 },
          cornerPoints: [
            { x: 95, y: 857 },
            { x: 118.98028564453125, y: 856.0274658203125 },
            { x: 120.7227783203125, y: 898.9921264648438 },
            { x: 96.74249267578125, y: 899.9646606445312 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 856, width: 26, height: 44, left: 95 },
              cornerPoints: [
                { x: 95, y: 857 },
                { x: 118.98028564453125, y: 856.0274658203125 },
                { x: 120.7227783203125, y: 898.9921264648438 },
                { x: 96.74249267578125, y: 899.9646606445312 },
              ],
              text: '1',
            },
          ],
        },
      ],
    },
  ],
};

export const expectedIosQuantities: string[] = [
  '1',
  '1',
  '1',
  '1',
  '200',
  '100',
  '1',
  '1',
  '125',
  '150',
  '1',
];
