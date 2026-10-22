/* eslint-disable no-loss-of-precision */
import { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { FormIngredientElement } from '@customTypes/DatabaseElementTypes';

export const iosNamesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      frame: { top: 9, width: 180, height: 45, left: 6 },
      cornerPoints: [
        { x: 6, y: 12 },
        { x: 184.9863739013672, y: 9.791730880737305 },
        { x: 185.5045166015625, y: 51.788536071777344 },
        { x: 6.518141269683838, y: 53.996803283691406 },
      ],
      recognizedLanguages: [{ languageCode: 'it' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 9, width: 180, height: 45, left: 6 },
              text: 'carotte',
              cornerPoints: [
                { x: 6, y: 12 },
                { x: 184.9863739013672, y: 9.791730880737305 },
                { x: 185.5045166015625, y: 51.788536071777344 },
                { x: 6.518141269683838, y: 53.996803283691406 },
              ],
            },
          ],
          frame: { top: 9, width: 180, height: 45, left: 6 },
          cornerPoints: [
            { x: 6, y: 12 },
            { x: 184.9863739013672, y: 9.791730880737305 },
            { x: 185.5045166015625, y: 51.788536071777344 },
            { x: 6.518141269683838, y: 53.996803283691406 },
          ],
          recognizedLanguages: [{ languageCode: 'it' }],
          text: 'carotte',
        },
      ],
      text: 'carotte',
    },
    {
      frame: { top: 79, width: 273, height: 51, left: 6 },
      cornerPoints: [
        { x: 6, y: 83 },
        { x: 277.9775390625, y: 79.50448608398438 },
        { x: 278.58154296875, y: 126.5006103515625 },
        { x: 6.60400390625, y: 129.99612426757812 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 79, width: 273, height: 51, left: 6 },
              text: 'citronnelle',
              cornerPoints: [
                { x: 6, y: 83 },
                { x: 277.9775390625, y: 79.50448608398438 },
                { x: 278.58154296875, y: 126.5006103515625 },
                { x: 6.60400390625, y: 129.99612426757812 },
              ],
            },
          ],
          frame: { top: 79, width: 273, height: 51, left: 6 },
          cornerPoints: [
            { x: 6, y: 83 },
            { x: 277.9775390625, y: 79.50448608398438 },
            { x: 278.58154296875, y: 126.5006103515625 },
            { x: 6.60400390625, y: 129.99612426757812 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'citronnelle',
        },
      ],
      text: 'citronnelle',
    },
    {
      frame: { top: 159, width: 184, height: 45, left: 15 },
      cornerPoints: [
        { x: 15, y: 159 },
        { x: 199, y: 159 },
        { x: 199, y: 204 },
        { x: 15, y: 204 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 159, width: 184, height: 45, left: 15 },
              text: 'cébette',
              cornerPoints: [
                { x: 15, y: 159 },
                { x: 199, y: 159 },
                { x: 199, y: 204 },
                { x: 15, y: 204 },
              ],
            },
          ],
          frame: { top: 159, width: 184, height: 45, left: 15 },
          cornerPoints: [
            { x: 15, y: 159 },
            { x: 199, y: 159 },
            { x: 199, y: 204 },
            { x: 15, y: 204 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'cébette',
        },
      ],
      text: 'cébette',
    },
    {
      frame: { top: 230, width: 295, height: 60, left: 6 },
      cornerPoints: [
        { x: 6, y: 243 },
        { x: 298.72662353515625, y: 230.34573364257812 },
        { x: 300.7565002441406, y: 277.3018798828125 },
        { x: 8.029865264892578, y: 289.9561462402344 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 240, width: 178, height: 50, left: 6 },
              text: 'gousse',
              cornerPoints: [
                { x: 6, y: 248 },
                { x: 181.83578491210938, y: 240.3988037109375 },
                { x: 183.6497039794922, y: 282.359619140625 },
                { x: 7.813921928405762, y: 289.9608154296875 },
              ],
            },
            {
              frame: { top: 230, width: 99, height: 52, left: 202 },
              text: "d'ail",
              cornerPoints: [
                { x: 202, y: 235 },
                { x: 298.90948486328125, y: 230.81069946289062 },
                { x: 300.9393615722656, y: 277.766845703125 },
                { x: 204.0298614501953, y: 281.9561462402344 },
              ],
            },
          ],
          frame: { top: 230, width: 295, height: 60, left: 6 },
          cornerPoints: [
            { x: 6, y: 243 },
            { x: 298.72662353515625, y: 230.34573364257812 },
            { x: 300.7565002441406, y: 277.3018798828125 },
            { x: 8.029865264892578, y: 289.9561462402344 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: "gousse d'ail",
        },
      ],
      text: "gousse d'ail",
    },
    {
      frame: { top: 304, width: 402, height: 59, left: 9 },
      cornerPoints: [
        { x: 10, y: 304 },
        { x: 410.98028564453125, y: 307.976318359375 },
        { x: 410.4349060058594, y: 362.9736022949219 },
        { x: 9.454618453979492, y: 358.9972839355469 },
      ],
      recognizedLanguages: [{ languageCode: 'es' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 310, width: 74, height: 46, left: 9 },
              text: 'lait',
              cornerPoints: [
                { x: 10, y: 310 },
                { x: 82.99640655517578, y: 310.723876953125 },
                { x: 82.55018615722656, y: 355.7216796875 },
                { x: 9.553778648376465, y: 354.997802734375 },
              ],
            },
            {
              frame: { top: 309, width: 60, height: 47, left: 101 },
              text: 'de',
              cornerPoints: [
                { x: 102, y: 309 },
                { x: 160.99710083007812, y: 309.5850524902344 },
                { x: 160.5409698486328, y: 355.5827941894531 },
                { x: 101.54386138916016, y: 354.99774169921875 },
              ],
            },
            {
              frame: { top: 322, width: 120, height: 35, left: 181 },
              text: 'coco',
              cornerPoints: [
                { x: 182, y: 322 },
                { x: 300.994140625, y: 323.1800231933594 },
                { x: 300.6669006347656, y: 356.17840576171875 },
                { x: 181.6727752685547, y: 354.9983825683594 },
              ],
            },
            {
              frame: { top: 307, width: 90, height: 56, left: 321 },
              text: '(ml)',
              cornerPoints: [
                { x: 322, y: 307 },
                { x: 410.99560546875, y: 307.8825378417969 },
                { x: 410.4502258300781, y: 362.87982177734375 },
                { x: 321.4546203613281, y: 361.9972839355469 },
              ],
            },
          ],
          frame: { top: 304, width: 402, height: 59, left: 9 },
          cornerPoints: [
            { x: 10, y: 304 },
            { x: 410.98028564453125, y: 307.976318359375 },
            { x: 410.4349060058594, y: 362.9736022949219 },
            { x: 9.454618453979492, y: 358.9972839355469 },
          ],
          recognizedLanguages: [{ languageCode: 'es' }],
          text: 'lait de coco (ml)',
        },
      ],
      text: 'lait de coco (ml)',
    },
    {
      frame: { top: 388, width: 325, height: 53, left: 15 },
      cornerPoints: [
        { x: 15, y: 388 },
        { x: 340, y: 388 },
        { x: 340, y: 441 },
        { x: 15, y: 441 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 388, width: 166, height: 52, left: 15 },
              text: 'oignon',
              cornerPoints: [
                { x: 15, y: 388 },
                { x: 181, y: 388 },
                { x: 181, y: 440 },
                { x: 15, y: 440 },
              ],
            },
            {
              frame: { top: 388, width: 142, height: 53, left: 198 },
              text: 'jaune',
              cornerPoints: [
                { x: 198, y: 388 },
                { x: 340, y: 388 },
                { x: 340, y: 441 },
                { x: 198, y: 441 },
              ],
            },
          ],
          frame: { top: 388, width: 325, height: 53, left: 15 },
          cornerPoints: [
            { x: 15, y: 388 },
            { x: 340, y: 388 },
            { x: 340, y: 441 },
            { x: 15, y: 441 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'oignon jaune',
        },
      ],
      text: 'oignon jaune',
    },
    {
      frame: { top: 461, width: 183, height: 53, left: 15 },
      cornerPoints: [
        { x: 15, y: 461 },
        { x: 198, y: 461 },
        { x: 198, y: 514 },
        { x: 15, y: 514 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 461, width: 183, height: 53, left: 15 },
              text: 'poireau',
              cornerPoints: [
                { x: 15, y: 461 },
                { x: 198, y: 461 },
                { x: 198, y: 514 },
                { x: 15, y: 514 },
              ],
            },
          ],
          frame: { top: 461, width: 183, height: 53, left: 15 },
          cornerPoints: [
            { x: 15, y: 461 },
            { x: 198, y: 461 },
            { x: 198, y: 514 },
            { x: 15, y: 514 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'poireau',
        },
      ],
      text: 'poireau',
    },
    {
      frame: { top: 534, width: 310, height: 55, left: 12 },
      cornerPoints: [
        { x: 12, y: 538 },
        { x: 320.97503662109375, y: 534.0732421875 },
        { x: 321.6231384277344, y: 585.069091796875 },
        { x: 12.648109436035156, y: 588.995849609375 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 536, width: 100, height: 53, left: 12 },
              text: 'pois',
              cornerPoints: [
                { x: 12, y: 538 },
                { x: 110.99200439453125, y: 536.7418823242188 },
                { x: 111.6401138305664, y: 587.73779296875 },
                { x: 12.648109436035156, y: 588.995849609375 },
              ],
            },
            {
              frame: { top: 533, width: 192, height: 52, left: 130 },
              text: 'chiches',
              cornerPoints: [
                { x: 130, y: 536 },
                { x: 320.98455810546875, y: 533.57275390625 },
                { x: 321.60723876953125, y: 582.5687866210938 },
                { x: 130.62269592285156, y: 584.9960327148438 },
              ],
            },
          ],
          frame: { top: 534, width: 310, height: 55, left: 12 },
          cornerPoints: [
            { x: 12, y: 538 },
            { x: 320.97503662109375, y: 534.0732421875 },
            { x: 321.6231384277344, y: 585.069091796875 },
            { x: 12.648109436035156, y: 588.995849609375 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'pois chiches',
        },
      ],
      text: 'pois chiches',
    },
    {
      frame: { top: 612, width: 622, height: 59, left: 16 },
      cornerPoints: [
        { x: 16, y: 612 },
        { x: 638, y: 612 },
        { x: 638, y: 671 },
        { x: 16, y: 671 },
      ],
      recognizedLanguages: [{ languageCode: 'pt' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 626, width: 223, height: 34, left: 16 },
              text: 'conserve',
              cornerPoints: [
                { x: 16, y: 626 },
                { x: 239, y: 626 },
                { x: 239, y: 660 },
                { x: 16, y: 660 },
              ],
            },
            {
              frame: { top: 613, width: 43, height: 57, left: 260 },
              text: '(g',
              cornerPoints: [
                { x: 260, y: 613 },
                { x: 303, y: 613 },
                { x: 303, y: 670 },
                { x: 260, y: 670 },
              ],
            },
            {
              frame: { top: 612, width: 213, height: 59, left: 322 },
              text: 'égoutté)',
              cornerPoints: [
                { x: 322, y: 612 },
                { x: 535, y: 612 },
                { x: 535, y: 671 },
                { x: 322, y: 671 },
              ],
            },
            {
              frame: { top: 614, width: 79, height: 45, left: 559 },
              text: 'Bio',
              cornerPoints: [
                { x: 559, y: 614 },
                { x: 638, y: 614 },
                { x: 638, y: 659 },
                { x: 559, y: 659 },
              ],
            },
          ],
          frame: { top: 612, width: 622, height: 59, left: 16 },
          cornerPoints: [
            { x: 16, y: 612 },
            { x: 638, y: 612 },
            { x: 638, y: 671 },
            { x: 16, y: 671 },
          ],
          recognizedLanguages: [{ languageCode: 'pt' }],
          text: 'conserve (g égoutté) Bio',
        },
      ],
      text: 'conserve (g égoutté) Bio',
    },
    {
      frame: { top: 688, width: 527, height: 136, left: 14 },
      cornerPoints: [
        { x: 14, y: 688 },
        { x: 541, y: 688 },
        { x: 541, y: 824 },
        { x: 14, y: 824 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 690, width: 139, height: 53, left: 16 },
              text: 'purée',
              cornerPoints: [
                { x: 16, y: 690 },
                { x: 155, y: 690 },
                { x: 155, y: 743 },
                { x: 16, y: 743 },
              ],
            },
            {
              frame: { top: 690, width: 59, height: 45, left: 176 },
              text: 'de',
              cornerPoints: [
                { x: 176, y: 690 },
                { x: 235, y: 690 },
                { x: 235, y: 735 },
                { x: 176, y: 735 },
              ],
            },
            {
              frame: { top: 694, width: 209, height: 43, left: 254 },
              text: 'tomates',
              cornerPoints: [
                { x: 254, y: 694 },
                { x: 463, y: 694 },
                { x: 463, y: 737 },
                { x: 254, y: 737 },
              ],
            },
            {
              frame: { top: 688, width: 57, height: 59, left: 484 },
              text: '(g)',
              cornerPoints: [
                { x: 484, y: 688 },
                { x: 541, y: 688 },
                { x: 541, y: 747 },
                { x: 484, y: 747 },
              ],
            },
          ],
          frame: { top: 688, width: 525, height: 59, left: 16 },
          cornerPoints: [
            { x: 16, y: 688 },
            { x: 541, y: 688 },
            { x: 541, y: 747 },
            { x: 16, y: 747 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'purée de tomates (g)',
        },
        {
          elements: [
            {
              frame: { top: 764, width: 58, height: 46, left: 13 },
              text: 'riz',
              cornerPoints: [
                { x: 14, y: 764 },
                { x: 70.99635314941406, y: 764.6443481445312 },
                { x: 70.4876708984375, y: 809.6414794921875 },
                { x: 13.491321563720703, y: 808.9971313476562 },
              ],
            },
            {
              frame: { top: 763, width: 197, height: 51, left: 90 },
              text: 'basmati',
              cornerPoints: [
                { x: 91, y: 763 },
                { x: 286.98748779296875, y: 765.215576171875 },
                { x: 286.44488525390625, y: 813.2125244140625 },
                { x: 90.45741271972656, y: 810.9969482421875 },
              ],
            },
            {
              frame: { top: 764, width: 59, height: 60, left: 307 },
              text: '(g)',
              cornerPoints: [
                { x: 308, y: 764 },
                { x: 365.99627685546875, y: 764.6556396484375 },
                { x: 365.329345703125, y: 823.65185546875 },
                { x: 307.33306884765625, y: 822.9962158203125 },
              ],
            },
            {
              frame: { top: 767, width: 81, height: 46, left: 388 },
              text: 'Bio',
              cornerPoints: [
                { x: 389, y: 767 },
                { x: 468.994873046875, y: 767.904296875 },
                { x: 468.4862060546875, y: 812.9014282226562 },
                { x: 388.4913330078125, y: 811.9971313476562 },
              ],
            },
          ],
          frame: { top: 761, width: 456, height: 64, left: 13 },
          cornerPoints: [
            { x: 14, y: 761 },
            { x: 468.9709167480469, y: 766.143310546875 },
            { x: 468.3152770996094, y: 824.1395874023438 },
            { x: 13.344369888305664, y: 818.9962768554688 },
          ],
          recognizedLanguages: [{ languageCode: 'tr' }],
          text: 'riz basmati (g) Bio',
        },
      ],
      text: 'purée de tomates (g)\nriz basmati (g) Bio',
    },
    {
      frame: { top: 836, width: 638, height: 64, left: 16 },
      cornerPoints: [
        { x: 16, y: 836 },
        { x: 654, y: 836 },
        { x: 654, y: 900 },
        { x: 16, y: 900 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 839, width: 149, height: 55, left: 16 },
              text: 'épices',
              cornerPoints: [
                { x: 16, y: 839 },
                { x: 165, y: 839 },
                { x: 165, y: 894 },
                { x: 16, y: 894 },
              ],
            },
            {
              frame: { top: 842, width: 264, height: 46, left: 183 },
              text: 'Cachemire',
              cornerPoints: [
                { x: 183, y: 842 },
                { x: 447, y: 842 },
                { x: 447, y: 888 },
                { x: 183, y: 888 },
              ],
            },
            {
              frame: { top: 836, width: 202, height: 64, left: 452 },
              text: '(sachet)',
              cornerPoints: [
                { x: 452, y: 836 },
                { x: 654, y: 836 },
                { x: 654, y: 900 },
                { x: 452, y: 900 },
              ],
            },
          ],
          frame: { top: 836, width: 638, height: 64, left: 16 },
          cornerPoints: [
            { x: 16, y: 836 },
            { x: 654, y: 836 },
            { x: 654, y: 900 },
            { x: 16, y: 900 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'épices Cachemire (sachet)',
        },
      ],
      text: 'épices Cachemire (sachet)',
    },
  ],
  text: "carotte\ncitronnelle\ncébette\ngousse d'ail\nlait de coco (ml)\noignon jaune\npoireau\npois chiches\nconserve (g égoutté) Bio\npurée de tomates (g)\nriz basmati (g) Bio\népices Cachemire (sachet)",
};

export const androidNamesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 12, height: 42, left: 14, width: 174 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'it' }],
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
      cornerPoints: [
        { y: 12, x: 14 },
        { y: 12, x: 188 },
        { y: 54, x: 188 },
        { y: 54, x: 14 },
      ],
      text: 'carotte',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 77, height: 129, left: 5, width: 274 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 77, height: 54, left: 6, width: 272 },
              cornerPoints: [
                { y: 82, x: 6 },
                { y: 77, x: 278 },
                { y: 126, x: 278 },
                { y: 131, x: 6 },
              ],
              text: 'citronnelle',
            },
          ],
          frame: { top: 77, height: 54, left: 6, width: 272 },
          cornerPoints: [
            { y: 82, x: 6 },
            { y: 77, x: 278 },
            { y: 126, x: 278 },
            { y: 131, x: 6 },
          ],
          text: 'citronnelle',
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 155, height: 50, left: 6, width: 192 },
              cornerPoints: [
                { y: 158, x: 6 },
                { y: 155, x: 198 },
                { y: 202, x: 198 },
                { y: 205, x: 6 },
              ],
              text: 'cébette',
            },
          ],
          frame: { top: 155, height: 50, left: 6, width: 192 },
          cornerPoints: [
            { y: 158, x: 6 },
            { y: 155, x: 198 },
            { y: 202, x: 198 },
            { y: 205, x: 6 },
          ],
          text: 'cébette',
        },
      ],
      cornerPoints: [
        { y: 81, x: 5 },
        { y: 77, x: 278 },
        { y: 202, x: 279 },
        { y: 206, x: 6 },
      ],
      text: 'citronnelle\ncébette',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 230, height: 61, left: 6, width: 294 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 235, height: 56, left: 6, width: 178 },
              cornerPoints: [
                { y: 243, x: 6 },
                { y: 235, x: 182 },
                { y: 283, x: 184 },
                { y: 291, x: 8 },
              ],
              text: 'gousse',
            },
            {
              frame: { top: 230, height: 52, left: 202, width: 98 },
              cornerPoints: [
                { y: 235, x: 202 },
                { y: 230, x: 298 },
                { y: 277, x: 300 },
                { y: 282, x: 204 },
              ],
              text: "d'ail",
            },
          ],
          frame: { top: 230, height: 61, left: 6, width: 294 },
          cornerPoints: [
            { y: 243, x: 6 },
            { y: 230, x: 298 },
            { y: 278, x: 300 },
            { y: 291, x: 8 },
          ],
          text: "gousse d'ail",
        },
      ],
      cornerPoints: [
        { y: 243, x: 6 },
        { y: 230, x: 298 },
        { y: 278, x: 300 },
        { y: 291, x: 8 },
      ],
      text: "gousse d'ail",
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 306, height: 283, left: 11, width: 403 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'es' }],
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
          frame: { top: 308, height: 54, left: 14, width: 400 },
          cornerPoints: [
            { y: 308, x: 14 },
            { y: 308, x: 414 },
            { y: 362, x: 414 },
            { y: 362, x: 14 },
          ],
          text: 'lait de coco (ml)',
        },
        {
          recognizedLanguages: [{ languageCode: 'hr' }],
          elements: [
            {
              frame: { top: 386, height: 56, left: 16, width: 166 },
              cornerPoints: [
                { y: 386, x: 16 },
                { y: 386, x: 182 },
                { y: 442, x: 182 },
                { y: 442, x: 16 },
              ],
              text: 'ojgnon',
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
          frame: { top: 386, height: 56, left: 16, width: 326 },
          cornerPoints: [
            { y: 386, x: 16 },
            { y: 386, x: 342 },
            { y: 442, x: 342 },
            { y: 442, x: 16 },
          ],
          text: 'ojgnon jaune',
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
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
          frame: { top: 460, height: 54, left: 16, width: 184 },
          cornerPoints: [
            { y: 460, x: 16 },
            { y: 460, x: 200 },
            { y: 514, x: 200 },
            { y: 514, x: 16 },
          ],
          text: 'poireau',
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
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
              frame: { top: 530, height: 57, left: 129, width: 191 },
              cornerPoints: [
                { y: 534, x: 129 },
                { y: 530, x: 320 },
                { y: 583, x: 320 },
                { y: 587, x: 129 },
              ],
              text: 'chiches',
            },
          ],
          frame: { top: 530, height: 59, left: 12, width: 308 },
          cornerPoints: [
            { y: 536, x: 12 },
            { y: 530, x: 320 },
            { y: 583, x: 320 },
            { y: 589, x: 12 },
          ],
          text: 'pois chiches',
        },
      ],
      cornerPoints: [
        { y: 308, x: 11 },
        { y: 306, x: 413 },
        { y: 587, x: 414 },
        { y: 589, x: 12 },
      ],
      text: 'lait de coco (ml)\nojgnon jaune\npoireau\npois chiches',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 611, height: 290, left: 13, width: 648 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'pt' }],
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
          frame: { top: 613, height: 58, left: 15, width: 624 },
          cornerPoints: [
            { y: 613, x: 15 },
            { y: 613, x: 639 },
            { y: 671, x: 639 },
            { y: 671, x: 15 },
          ],
          text: 'conserve (g égoutté) Bio',
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
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
              frame: { top: 688, height: 59, left: 484, width: 59 },
              cornerPoints: [
                { y: 688, x: 484 },
                { y: 688, x: 543 },
                { y: 747, x: 543 },
                { y: 747, x: 484 },
              ],
              text: '(g)',
            },
          ],
          frame: { top: 688, height: 59, left: 15, width: 528 },
          cornerPoints: [
            { y: 688, x: 15 },
            { y: 688, x: 543 },
            { y: 747, x: 543 },
            { y: 747, x: 15 },
          ],
          text: 'purée de tomates (g)',
        },
        {
          recognizedLanguages: [{ languageCode: 'tr' }],
          elements: [
            {
              frame: { top: 762, height: 55, left: 13, width: 57 },
              cornerPoints: [
                { y: 762, x: 14 },
                { y: 762, x: 70 },
                { y: 817, x: 69 },
                { y: 817, x: 13 },
              ],
              text: 'riz',
            },
            {
              frame: { top: 762, height: 56, left: 90, width: 197 },
              cornerPoints: [
                { y: 762, x: 91 },
                { y: 763, x: 287 },
                { y: 818, x: 286 },
                { y: 817, x: 90 },
              ],
              text: 'basmati',
            },
            {
              frame: { top: 764, height: 56, left: 307, width: 59 },
              cornerPoints: [
                { y: 764, x: 308 },
                { y: 764, x: 366 },
                { y: 820, x: 365 },
                { y: 820, x: 307 },
              ],
              text: '(g)',
            },
            {
              frame: { top: 765, height: 56, left: 388, width: 80 },
              cornerPoints: [
                { y: 765, x: 389 },
                { y: 765, x: 468 },
                { y: 821, x: 467 },
                { y: 821, x: 388 },
              ],
              text: 'Bio',
            },
          ],
          frame: { top: 761, height: 60, left: 13, width: 455 },
          cornerPoints: [
            { y: 761, x: 14 },
            { y: 765, x: 468 },
            { y: 821, x: 467 },
            { y: 817, x: 13 },
          ],
          text: 'riz basmati (g) Bio',
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 837, height: 64, left: 16, width: 150 },
              cornerPoints: [
                { y: 837, x: 16 },
                { y: 837, x: 166 },
                { y: 901, x: 166 },
                { y: 901, x: 16 },
              ],
              text: 'épices',
            },
            {
              frame: { top: 837, height: 64, left: 183, width: 265 },
              cornerPoints: [
                { y: 837, x: 183 },
                { y: 837, x: 448 },
                { y: 901, x: 448 },
                { y: 901, x: 183 },
              ],
              text: 'Cachemire',
            },
            {
              frame: { top: 837, height: 64, left: 474, width: 187 },
              cornerPoints: [
                { y: 837, x: 474 },
                { y: 837, x: 661 },
                { y: 901, x: 661 },
                { y: 901, x: 474 },
              ],
              text: '(sachet)',
            },
          ],
          frame: { top: 837, height: 64, left: 16, width: 645 },
          cornerPoints: [
            { y: 837, x: 16 },
            { y: 837, x: 661 },
            { y: 901, x: 661 },
            { y: 901, x: 16 },
          ],
          text: 'épices Cachemire (sachet)',
        },
      ],
      cornerPoints: [
        { y: 611, x: 14 },
        { y: 612, x: 661 },
        { y: 901, x: 660 },
        { y: 900, x: 13 },
      ],
      text: 'conserve (g égoutté) Bio\npurée de tomates (g)\nriz basmati (g) Bio\népices Cachemire (sachet)',
    },
  ],
  text: "carotte\ncitronnelle\ncébette\ngousse d'ail\nlait de coco (ml)\nojgnon jaune\npoireau\npois chiches\nconserve (g égoutté) Bio\npurée de tomates (g)\nriz basmati (g) Bio\népices Cachemire (sachet)",
};

export const quantitiesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 19, height: 193, left: 86, width: 32 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          elements: [
            {
              frame: { top: 19, height: 193, left: 86, width: 32 },
              cornerPoints: [
                { y: 19, x: 114 },
                { y: 212, x: 118 },
                { y: 212, x: 90 },
                { y: 19, x: 86 },
              ],
              text: 'HHH',
            },
          ],
          frame: { top: 19, height: 193, left: 86, width: 32 },
          cornerPoints: [
            { y: 19, x: 114 },
            { y: 212, x: 118 },
            { y: 212, x: 90 },
            { y: 19, x: 86 },
          ],
          text: 'HHH',
        },
      ],
      cornerPoints: [
        { y: 19, x: 114 },
        { y: 212, x: 118 },
        { y: 212, x: 90 },
        { y: 19, x: 86 },
      ],
      text: 'HHH',
    },
  ],
  text: 'HHH',
};

export const androidQuantitiesImageSize = { width: 218, height: 946 };

export const androidQuantitiesStripOcrResults: {
  originY: number;
  result: TextRecognitionResult;
}[] = [
  {
    originY: 0,
    result: {
      blocks: [
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 19, height: 43, left: 90, width: 26 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 19, height: 43, left: 90, width: 26 },
                  cornerPoints: [
                    { y: 19, x: 91 },
                    { y: 19, x: 116 },
                    { y: 62, x: 115 },
                    { y: 62, x: 90 },
                  ],
                  text: '1',
                },
              ],
              frame: { top: 19, height: 43, left: 90, width: 26 },
              cornerPoints: [
                { y: 19, x: 91 },
                { y: 19, x: 116 },
                { y: 62, x: 115 },
                { y: 62, x: 90 },
              ],
              text: '1',
            },
          ],
          cornerPoints: [
            { y: 19, x: 91 },
            { y: 19, x: 116 },
            { y: 62, x: 115 },
            { y: 62, x: 90 },
          ],
          text: '1',
        },
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 94, height: 45, left: 91, width: 26 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 94, height: 45, left: 91, width: 26 },
                  cornerPoints: [
                    { y: 94, x: 91 },
                    { y: 94, x: 117 },
                    { y: 139, x: 117 },
                    { y: 139, x: 91 },
                  ],
                  text: '1',
                },
              ],
              frame: { top: 94, height: 45, left: 91, width: 26 },
              cornerPoints: [
                { y: 94, x: 91 },
                { y: 94, x: 117 },
                { y: 139, x: 117 },
                { y: 139, x: 91 },
              ],
              text: '1',
            },
          ],
          cornerPoints: [
            { y: 94, x: 91 },
            { y: 94, x: 117 },
            { y: 139, x: 117 },
            { y: 139, x: 91 },
          ],
          text: '1',
        },
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 168, height: 47, left: 89, width: 27 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 168, height: 47, left: 89, width: 27 },
                  cornerPoints: [
                    { y: 171, x: 89 },
                    { y: 168, x: 112 },
                    { y: 212, x: 116 },
                    { y: 215, x: 93 },
                  ],
                  text: '1',
                },
              ],
              frame: { top: 168, height: 47, left: 89, width: 27 },
              cornerPoints: [
                { y: 171, x: 89 },
                { y: 168, x: 112 },
                { y: 212, x: 116 },
                { y: 215, x: 93 },
              ],
              text: '1',
            },
          ],
          cornerPoints: [
            { y: 171, x: 89 },
            { y: 168, x: 112 },
            { y: 212, x: 116 },
            { y: 215, x: 93 },
          ],
          text: '1',
        },
      ],
      text: '1\n1\n1',
    },
  },
  {
    originY: 109,
    result: {
      blocks: [
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 61, height: 44, left: 91, width: 26 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 61, height: 44, left: 91, width: 26 },
                  cornerPoints: [
                    { y: 61, x: 91 },
                    { y: 61, x: 117 },
                    { y: 105, x: 117 },
                    { y: 105, x: 91 },
                  ],
                  text: '1',
                },
              ],
              frame: { top: 61, height: 44, left: 91, width: 26 },
              cornerPoints: [
                { y: 61, x: 91 },
                { y: 61, x: 117 },
                { y: 105, x: 117 },
                { y: 105, x: 91 },
              ],
              text: '1',
            },
          ],
          cornerPoints: [
            { y: 61, x: 91 },
            { y: 61, x: 117 },
            { y: 105, x: 117 },
            { y: 105, x: 91 },
          ],
          text: '1',
        },
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 136, height: 47, left: 89, width: 27 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 136, height: 47, left: 89, width: 27 },
                  cornerPoints: [
                    { y: 139, x: 89 },
                    { y: 136, x: 112 },
                    { y: 180, x: 116 },
                    { y: 183, x: 93 },
                  ],
                  text: '1',
                },
              ],
              frame: { top: 136, height: 47, left: 89, width: 27 },
              cornerPoints: [
                { y: 139, x: 89 },
                { y: 136, x: 112 },
                { y: 180, x: 116 },
                { y: 183, x: 93 },
              ],
              text: '1',
            },
          ],
          cornerPoints: [
            { y: 139, x: 89 },
            { y: 136, x: 112 },
            { y: 180, x: 116 },
            { y: 183, x: 93 },
          ],
          text: '1',
        },
      ],
      text: '1\n1',
    },
  },
  {
    originY: 218,
    result: {
      blocks: [
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 28, height: 45, left: 91, width: 27 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 28, height: 45, left: 91, width: 27 },
                  cornerPoints: [
                    { y: 28, x: 91 },
                    { y: 28, x: 118 },
                    { y: 73, x: 118 },
                    { y: 73, x: 91 },
                  ],
                  text: '1',
                },
              ],
              frame: { top: 28, height: 45, left: 91, width: 27 },
              cornerPoints: [
                { y: 28, x: 91 },
                { y: 28, x: 118 },
                { y: 73, x: 118 },
                { y: 73, x: 91 },
              ],
              text: '1',
            },
          ],
          cornerPoints: [
            { y: 28, x: 91 },
            { y: 28, x: 118 },
            { y: 73, x: 118 },
            { y: 73, x: 91 },
          ],
          text: '1',
        },
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 101, height: 48, left: 53, width: 100 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 101, height: 48, left: 53, width: 100 },
                  cornerPoints: [
                    { y: 103, x: 53 },
                    { y: 101, x: 153 },
                    { y: 147, x: 153 },
                    { y: 149, x: 53 },
                  ],
                  text: '200',
                },
              ],
              frame: { top: 101, height: 48, left: 53, width: 100 },
              cornerPoints: [
                { y: 103, x: 53 },
                { y: 101, x: 153 },
                { y: 147, x: 153 },
                { y: 149, x: 53 },
              ],
              text: '200',
            },
          ],
          cornerPoints: [
            { y: 103, x: 53 },
            { y: 101, x: 153 },
            { y: 147, x: 153 },
            { y: 149, x: 53 },
          ],
          text: '200',
        },
      ],
      text: '1\n200',
    },
  },
  {
    originY: 327,
    result: {
      blocks: [
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 0, height: 40, left: 54, width: 101 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 0, height: 40, left: 54, width: 101 },
                  cornerPoints: [
                    { y: 0, x: 54 },
                    { y: 0, x: 155 },
                    { y: 40, x: 155 },
                    { y: 40, x: 54 },
                  ],
                  text: '200',
                },
              ],
              frame: { top: 0, height: 40, left: 54, width: 101 },
              cornerPoints: [
                { y: 0, x: 54 },
                { y: 0, x: 155 },
                { y: 40, x: 155 },
                { y: 40, x: 54 },
              ],
              text: '200',
            },
          ],
          cornerPoints: [
            { y: 0, x: 54 },
            { y: 0, x: 155 },
            { y: 40, x: 155 },
            { y: 40, x: 54 },
          ],
          text: '200',
        },
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 71, height: 45, left: 93, width: 25 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 71, height: 45, left: 93, width: 25 },
                  cornerPoints: [
                    { y: 71, x: 93 },
                    { y: 71, x: 118 },
                    { y: 116, x: 118 },
                    { y: 116, x: 93 },
                  ],
                  text: '1',
                },
              ],
              frame: { top: 71, height: 45, left: 93, width: 25 },
              cornerPoints: [
                { y: 71, x: 93 },
                { y: 71, x: 118 },
                { y: 116, x: 118 },
                { y: 116, x: 93 },
              ],
              text: '1',
            },
          ],
          cornerPoints: [
            { y: 71, x: 93 },
            { y: 71, x: 118 },
            { y: 116, x: 118 },
            { y: 116, x: 93 },
          ],
          text: '1',
        },
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 147, height: 45, left: 93, width: 26 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 147, height: 45, left: 93, width: 26 },
                  cornerPoints: [
                    { y: 147, x: 93 },
                    { y: 147, x: 119 },
                    { y: 192, x: 119 },
                    { y: 192, x: 93 },
                  ],
                  text: '1',
                },
              ],
              frame: { top: 147, height: 45, left: 93, width: 26 },
              cornerPoints: [
                { y: 147, x: 93 },
                { y: 147, x: 119 },
                { y: 192, x: 119 },
                { y: 192, x: 93 },
              ],
              text: '1',
            },
          ],
          cornerPoints: [
            { y: 147, x: 93 },
            { y: 147, x: 119 },
            { y: 192, x: 119 },
            { y: 192, x: 93 },
          ],
          text: '1',
        },
      ],
      text: '200\n1\n1',
    },
  },
  {
    originY: 436,
    result: {
      blocks: [
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 38, height: 45, left: 93, width: 26 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 38, height: 45, left: 93, width: 26 },
                  cornerPoints: [
                    { y: 38, x: 93 },
                    { y: 38, x: 119 },
                    { y: 83, x: 119 },
                    { y: 83, x: 93 },
                  ],
                  text: '1',
                },
              ],
              frame: { top: 38, height: 45, left: 93, width: 26 },
              cornerPoints: [
                { y: 38, x: 93 },
                { y: 38, x: 119 },
                { y: 83, x: 119 },
                { y: 83, x: 93 },
              ],
              text: '1',
            },
          ],
          cornerPoints: [
            { y: 38, x: 93 },
            { y: 38, x: 119 },
            { y: 83, x: 119 },
            { y: 83, x: 93 },
          ],
          text: '1',
        },
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 153, height: 46, left: 58, width: 99 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 153, height: 46, left: 58, width: 99 },
                  cornerPoints: [
                    { y: 153, x: 58 },
                    { y: 153, x: 157 },
                    { y: 199, x: 157 },
                    { y: 199, x: 58 },
                  ],
                  text: '100',
                },
              ],
              frame: { top: 153, height: 46, left: 58, width: 99 },
              cornerPoints: [
                { y: 153, x: 58 },
                { y: 153, x: 157 },
                { y: 199, x: 157 },
                { y: 199, x: 58 },
              ],
              text: '100',
            },
          ],
          cornerPoints: [
            { y: 153, x: 58 },
            { y: 153, x: 157 },
            { y: 199, x: 157 },
            { y: 199, x: 58 },
          ],
          text: '100',
        },
      ],
      text: '1\n100',
    },
  },
  {
    originY: 545,
    result: {
      blocks: [
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 41, height: 48, left: 58, width: 97 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 41, height: 48, left: 58, width: 97 },
                  cornerPoints: [
                    { y: 43, x: 58 },
                    { y: 41, x: 155 },
                    { y: 87, x: 155 },
                    { y: 89, x: 58 },
                  ],
                  text: '100',
                },
              ],
              frame: { top: 41, height: 48, left: 58, width: 97 },
              cornerPoints: [
                { y: 43, x: 58 },
                { y: 41, x: 155 },
                { y: 87, x: 155 },
                { y: 89, x: 58 },
              ],
              text: '100',
            },
          ],
          cornerPoints: [
            { y: 43, x: 58 },
            { y: 41, x: 155 },
            { y: 87, x: 155 },
            { y: 89, x: 58 },
          ],
          text: '100',
        },
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 157, height: 49, left: 58, width: 96 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 157, height: 49, left: 58, width: 96 },
                  cornerPoints: [
                    { y: 160, x: 58 },
                    { y: 157, x: 153 },
                    { y: 203, x: 154 },
                    { y: 206, x: 59 },
                  ],
                  text: '125',
                },
              ],
              frame: { top: 157, height: 49, left: 58, width: 96 },
              cornerPoints: [
                { y: 160, x: 58 },
                { y: 157, x: 153 },
                { y: 203, x: 154 },
                { y: 206, x: 59 },
              ],
              text: '125',
            },
          ],
          cornerPoints: [
            { y: 160, x: 58 },
            { y: 157, x: 153 },
            { y: 203, x: 154 },
            { y: 206, x: 59 },
          ],
          text: '125',
        },
      ],
      text: '100\n125',
    },
  },
  {
    originY: 654,
    result: {
      blocks: [
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 48, height: 124, left: 58, width: 98 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 49, height: 46, left: 59, width: 95 },
                  cornerPoints: [
                    { y: 50, x: 59 },
                    { y: 49, x: 154 },
                    { y: 94, x: 154 },
                    { y: 95, x: 59 },
                  ],
                  text: '125',
                },
              ],
              frame: { top: 49, height: 46, left: 59, width: 95 },
              cornerPoints: [
                { y: 50, x: 59 },
                { y: 49, x: 154 },
                { y: 94, x: 154 },
                { y: 95, x: 59 },
              ],
              text: '125',
            },
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 123, height: 49, left: 59, width: 98 },
                  cornerPoints: [
                    { y: 126, x: 59 },
                    { y: 123, x: 156 },
                    { y: 169, x: 157 },
                    { y: 172, x: 60 },
                  ],
                  text: '150',
                },
              ],
              frame: { top: 123, height: 49, left: 59, width: 98 },
              cornerPoints: [
                { y: 126, x: 59 },
                { y: 123, x: 156 },
                { y: 169, x: 157 },
                { y: 172, x: 60 },
              ],
              text: '150',
            },
          ],
          cornerPoints: [
            { y: 50, x: 58 },
            { y: 48, x: 155 },
            { y: 170, x: 156 },
            { y: 172, x: 59 },
          ],
          text: '125\n150',
        },
      ],
      text: '125\n150',
    },
  },
  {
    originY: 728,
    result: {
      blocks: [
        {
          recognizedLanguages: [{ languageCode: 'und' }],
          frame: { top: 49, height: 126, left: 58, width: 103 },
          lines: [
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 51, height: 48, left: 59, width: 98 },
                  cornerPoints: [
                    { y: 54, x: 59 },
                    { y: 51, x: 156 },
                    { y: 96, x: 157 },
                    { y: 99, x: 60 },
                  ],
                  text: '150',
                },
              ],
              frame: { top: 51, height: 48, left: 59, width: 98 },
              cornerPoints: [
                { y: 54, x: 59 },
                { y: 51, x: 156 },
                { y: 96, x: 157 },
                { y: 99, x: 60 },
              ],
              text: '150',
            },
            {
              recognizedLanguages: [{ languageCode: 'und-Latn' }],
              elements: [
                {
                  frame: { top: 128, height: 45, left: 95, width: 25 },
                  cornerPoints: [
                    { y: 130, x: 95 },
                    { y: 128, x: 118 },
                    { y: 171, x: 120 },
                    { y: 173, x: 97 },
                  ],
                  text: '1',
                },
              ],
              frame: { top: 128, height: 45, left: 95, width: 25 },
              cornerPoints: [
                { y: 130, x: 95 },
                { y: 128, x: 118 },
                { y: 171, x: 120 },
                { y: 173, x: 97 },
              ],
              text: '1',
            },
          ],
          cornerPoints: [
            { y: 54, x: 58 },
            { y: 49, x: 156 },
            { y: 170, x: 161 },
            { y: 175, x: 63 },
          ],
          text: '150\n1',
        },
      ],
      text: '150\n1',
    },
  },
];

export const expectedIngredientNames: FormIngredientElement[] = [
  { name: 'carotte', unit: '' },
  { name: 'citronnelle', unit: '' },
  { name: 'cébette', unit: '' },
  { name: "gousse d'ail", unit: '' },
  { name: 'lait de coco', unit: 'ml' },
  { name: 'ojgnon jaune', unit: '' },
  { name: 'poireau', unit: '' },
  { name: 'pois chiches', unit: '' },
  { name: 'conserve  Bio', unit: 'g égoutté' },
  { name: 'purée de tomates', unit: 'g' },
  { name: 'riz basmati  Bio', unit: 'g' },
  { name: 'épices Cachemire', unit: 'sachet' },
];

export const expectedQuantities: string[] = [
  '1',
  '1',
  '1',
  '1',
  '200',
  '1',
  '1',
  '100',
  '125',
  '150',
  '1',
];

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
  { name: 'purée de tomates', unit: 'g' },
  { name: 'riz basmati  Bio', unit: 'g' },
  { name: 'épices Cachemire', unit: 'sachet' },
];

export const iosQuantitiesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      frame: { top: 19, width: 25, height: 44, left: 91 },
      cornerPoints: [
        { x: 91, y: 19 },
        { x: 116, y: 19 },
        { x: 116, y: 63 },
        { x: 91, y: 63 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 19, width: 25, height: 44, left: 91 },
              text: '1',
              cornerPoints: [
                { x: 91, y: 19 },
                { x: 116, y: 19 },
                { x: 116, y: 63 },
                { x: 91, y: 63 },
              ],
            },
          ],
          frame: { top: 19, width: 25, height: 44, left: 91 },
          cornerPoints: [
            { x: 91, y: 19 },
            { x: 116, y: 19 },
            { x: 116, y: 63 },
            { x: 91, y: 63 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '1',
        },
      ],
      text: '1',
    },
    {
      frame: { top: 94, width: 24, height: 43, left: 91 },
      cornerPoints: [
        { x: 91, y: 95 },
        { x: 112.98916625976562, y: 94.30979919433594 },
        { x: 114.30682373046875, y: 136.28912353515625 },
        { x: 92.31765747070312, y: 136.9793243408203 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 94, width: 24, height: 43, left: 91 },
              text: '1',
              cornerPoints: [
                { x: 91, y: 95 },
                { x: 112.98916625976562, y: 94.30979919433594 },
                { x: 114.30682373046875, y: 136.28912353515625 },
                { x: 92.31765747070312, y: 136.9793243408203 },
              ],
            },
          ],
          frame: { top: 94, width: 24, height: 43, left: 91 },
          cornerPoints: [
            { x: 91, y: 95 },
            { x: 112.98916625976562, y: 94.30979919433594 },
            { x: 114.30682373046875, y: 136.28912353515625 },
            { x: 92.31765747070312, y: 136.9793243408203 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '1',
        },
      ],
      text: '1',
    },
    {
      frame: { top: 170, width: 27, height: 45, left: 90 },
      cornerPoints: [
        { x: 90, y: 172 },
        { x: 112.92913818359375, y: 170.19589233398438 },
        { x: 116.3020248413086, y: 213.0634002685547 },
        { x: 93.37288665771484, y: 214.8675079345703 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 170, width: 27, height: 45, left: 90 },
              text: '1',
              cornerPoints: [
                { x: 90, y: 172 },
                { x: 112.92913818359375, y: 170.19589233398438 },
                { x: 116.3020248413086, y: 213.0634002685547 },
                { x: 93.37288665771484, y: 214.8675079345703 },
              ],
            },
          ],
          frame: { top: 170, width: 27, height: 45, left: 90 },
          cornerPoints: [
            { x: 90, y: 172 },
            { x: 112.92913818359375, y: 170.19589233398438 },
            { x: 116.3020248413086, y: 213.0634002685547 },
            { x: 93.37288665771484, y: 214.8675079345703 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '1',
        },
      ],
      text: '1',
    },
    {
      frame: { top: 245, width: 25, height: 44, left: 91 },
      cornerPoints: [
        { x: 91, y: 246 },
        { x: 113.9913330078125, y: 245.36862182617188 },
        { x: 115.17172241210938, y: 288.3524169921875 },
        { x: 92.18038940429688, y: 288.9837951660156 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 245, width: 25, height: 44, left: 91 },
              text: '1',
              cornerPoints: [
                { x: 91, y: 246 },
                { x: 113.9913330078125, y: 245.36862182617188 },
                { x: 115.17172241210938, y: 288.3524169921875 },
                { x: 92.18038940429688, y: 288.9837951660156 },
              ],
            },
          ],
          frame: { top: 245, width: 25, height: 44, left: 91 },
          cornerPoints: [
            { x: 91, y: 246 },
            { x: 113.9913330078125, y: 245.36862182617188 },
            { x: 115.17172241210938, y: 288.3524169921875 },
            { x: 92.18038940429688, y: 288.9837951660156 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '1',
        },
      ],
      text: '1',
    },
    {
      frame: { top: 322, width: 101, height: 43, left: 54 },
      cornerPoints: [
        { x: 54, y: 322 },
        { x: 155, y: 322 },
        { x: 155, y: 365 },
        { x: 54, y: 365 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 322, width: 101, height: 43, left: 54 },
              text: '200',
              cornerPoints: [
                { x: 54, y: 322 },
                { x: 155, y: 322 },
                { x: 155, y: 365 },
                { x: 54, y: 365 },
              ],
            },
          ],
          frame: { top: 322, width: 101, height: 43, left: 54 },
          cornerPoints: [
            { x: 54, y: 322 },
            { x: 155, y: 322 },
            { x: 155, y: 365 },
            { x: 54, y: 365 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '200',
        },
      ],
      text: '200',
    },
    {
      frame: { top: 397, width: 26, height: 46, left: 92 },
      cornerPoints: [
        { x: 92, y: 399 },
        { x: 114.9700927734375, y: 397.8274230957031 },
        { x: 117.21327209472656, y: 441.77020263671875 },
        { x: 94.24317932128906, y: 442.9427795410156 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 397, width: 26, height: 46, left: 92 },
              text: '1',
              cornerPoints: [
                { x: 92, y: 399 },
                { x: 114.9700927734375, y: 397.8274230957031 },
                { x: 117.21327209472656, y: 441.77020263671875 },
                { x: 94.24317932128906, y: 442.9427795410156 },
              ],
            },
          ],
          frame: { top: 397, width: 26, height: 46, left: 92 },
          cornerPoints: [
            { x: 92, y: 399 },
            { x: 114.9700927734375, y: 397.8274230957031 },
            { x: 117.21327209472656, y: 441.77020263671875 },
            { x: 94.24317932128906, y: 442.9427795410156 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '1',
        },
      ],
      text: '1',
    },
    {
      frame: { top: 473, width: 26, height: 45, left: 92 },
      cornerPoints: [
        { x: 92, y: 474 },
        { x: 115.98666381835938, y: 473.1999206542969 },
        { x: 117.45345306396484, y: 517.1754760742188 },
        { x: 93.46678924560547, y: 517.9755249023438 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 473, width: 26, height: 45, left: 92 },
              text: '1',
              cornerPoints: [
                { x: 92, y: 474 },
                { x: 115.98666381835938, y: 473.1999206542969 },
                { x: 117.45345306396484, y: 517.1754760742188 },
                { x: 93.46678924560547, y: 517.9755249023438 },
              ],
            },
          ],
          frame: { top: 473, width: 26, height: 45, left: 92 },
          cornerPoints: [
            { x: 92, y: 474 },
            { x: 115.98666381835938, y: 473.1999206542969 },
            { x: 117.45345306396484, y: 517.1754760742188 },
            { x: 93.46678924560547, y: 517.9755249023438 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '1',
        },
      ],
      text: '1',
    },
    {
      frame: { top: 589, width: 98, height: 45, left: 58 },
      cornerPoints: [
        { x: 58, y: 589 },
        { x: 156, y: 589 },
        { x: 156, y: 634 },
        { x: 58, y: 634 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 589, width: 98, height: 45, left: 58 },
              text: '100',
              cornerPoints: [
                { x: 58, y: 589 },
                { x: 156, y: 589 },
                { x: 156, y: 634 },
                { x: 58, y: 634 },
              ],
            },
          ],
          frame: { top: 589, width: 98, height: 45, left: 58 },
          cornerPoints: [
            { x: 58, y: 589 },
            { x: 156, y: 589 },
            { x: 156, y: 634 },
            { x: 58, y: 634 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '100',
        },
      ],
      text: '100',
    },
    {
      frame: { top: 703, width: 157, height: 198, left: 2 },
      cornerPoints: [
        { x: 5, y: 703 },
        { x: 158.98934936523438, y: 704.8118286132812 },
        { x: 156.68341064453125, y: 900.7982788085938 },
        { x: 2.6940665245056152, y: 898.9864501953125 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 704, width: 98, height: 47, left: 57 },
              text: '125',
              cornerPoints: [
                { x: 58, y: 704 },
                { x: 154.9932861328125, y: 705.1411743164062 },
                { x: 154.4638671875, y: 750.1380615234375 },
                { x: 57.470577239990234, y: 748.9968872070312 },
              ],
            },
          ],
          frame: { top: 704, width: 98, height: 47, left: 57 },
          cornerPoints: [
            { x: 58, y: 704 },
            { x: 154.9932861328125, y: 705.1411743164062 },
            { x: 154.4638671875, y: 750.1380615234375 },
            { x: 57.470577239990234, y: 748.9968872070312 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '125',
        },
        {
          elements: [
            {
              frame: { top: 855, width: 25, height: 45, left: 95 },
              text: '1',
              cornerPoints: [
                { x: 95, y: 857 },
                { x: 117.97591400146484, y: 855.9476928710938 },
                { x: 119.94324493408203, y: 898.9026489257812 },
                { x: 96.96733093261719, y: 899.9549560546875 },
              ],
            },
          ],
          frame: { top: 855, width: 25, height: 45, left: 95 },
          cornerPoints: [
            { x: 95, y: 857 },
            { x: 117.97591400146484, y: 855.9476928710938 },
            { x: 119.94324493408203, y: 898.9026489257812 },
            { x: 96.96733093261719, y: 899.9549560546875 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '1',
        },
        {
          elements: [
            {
              frame: { top: 772, width: 155, height: 65, left: 3 },
              text: '150',
              cornerPoints: [
                { x: 3, y: 774 },
                { x: 156.9912109375, y: 772.3544921875 },
                { x: 157.66436767578125, y: 835.3508911132812 },
                { x: 3.673157215118408, y: 836.9963989257812 },
              ],
            },
          ],
          frame: { top: 772, width: 155, height: 65, left: 3 },
          cornerPoints: [
            { x: 3, y: 774 },
            { x: 156.9912109375, y: 772.3544921875 },
            { x: 157.66436767578125, y: 835.3508911132812 },
            { x: 3.673157215118408, y: 836.9963989257812 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '150',
        },
      ],
      text: '125\n1\n150',
    },
  ],
  text: '1\n1\n1\n1\n200\n1\n1\n100\n125\n1\n150',
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
