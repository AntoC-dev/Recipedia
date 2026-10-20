/* eslint-disable no-loss-of-precision */
import { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { FormIngredientElement } from '@customTypes/DatabaseElementTypes';

export const iosNamesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      frame: { top: 22, width: 400, height: 78, left: 46 },
      cornerPoints: [
        { x: 46, y: 22 },
        { x: 446, y: 22 },
        { x: 446, y: 100 },
        { x: 46, y: 100 },
      ],
      recognizedLanguages: [{ languageCode: 'es' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 23, width: 180, height: 25, left: 52 },
              text: 'cacahuètes',
              cornerPoints: [
                { x: 52, y: 23 },
                { x: 232, y: 23 },
                { x: 232, y: 48 },
                { x: 52, y: 48 },
              ],
            },
            {
              frame: { top: 22, width: 119, height: 32, left: 240 },
              text: 'grillées',
              cornerPoints: [
                { x: 240, y: 22 },
                { x: 359, y: 22 },
                { x: 359, y: 54 },
                { x: 240, y: 54 },
              ],
            },
            {
              frame: { top: 22, width: 38, height: 33, left: 369 },
              text: '(g)',
              cornerPoints: [
                { x: 369, y: 22 },
                { x: 407, y: 22 },
                { x: 407, y: 55 },
                { x: 369, y: 55 },
              ],
            },
          ],
          frame: { top: 22, width: 355, height: 33, left: 52 },
          cornerPoints: [
            { x: 52, y: 22 },
            { x: 407, y: 22 },
            { x: 407, y: 55 },
            { x: 52, y: 55 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'cacahuètes grillées (g)',
        },
        {
          elements: [
            {
              frame: { top: 68, width: 163, height: 26, left: 46 },
              text: 'concentré',
              cornerPoints: [
                { x: 46, y: 68 },
                { x: 209, y: 68 },
                { x: 209, y: 94 },
                { x: 46, y: 94 },
              ],
            },
            {
              frame: { top: 68, width: 38, height: 26, left: 219 },
              text: 'de',
              cornerPoints: [
                { x: 219, y: 68 },
                { x: 257, y: 68 },
                { x: 257, y: 94 },
                { x: 219, y: 94 },
              ],
            },
            {
              frame: { top: 70, width: 134, height: 24, left: 267 },
              text: 'tomates',
              cornerPoints: [
                { x: 267, y: 70 },
                { x: 401, y: 70 },
                { x: 401, y: 94 },
                { x: 267, y: 94 },
              ],
            },
            {
              frame: { top: 67, width: 36, height: 33, left: 410 },
              text: '(g)',
              cornerPoints: [
                { x: 410, y: 67 },
                { x: 446, y: 67 },
                { x: 446, y: 100 },
                { x: 410, y: 100 },
              ],
            },
          ],
          frame: { top: 67, width: 400, height: 33, left: 46 },
          cornerPoints: [
            { x: 46, y: 67 },
            { x: 446, y: 67 },
            { x: 446, y: 100 },
            { x: 46, y: 100 },
          ],
          recognizedLanguages: [{ languageCode: 'es' }],
          text: 'concentré de tomates (g)',
        },
      ],
      text: 'cacahuètes grillées (g)\nconcentré de tomates (g)',
    },
    {
      frame: { top: 114, width: 263, height: 84, left: 22 },
      cornerPoints: [
        { x: 22, y: 114 },
        { x: 285, y: 114 },
        { x: 285, y: 198 },
        { x: 22, y: 198 },
      ],
      recognizedLanguages: [{ languageCode: 'en' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 114, width: 64, height: 26, left: 42 },
              text: 'filet',
              cornerPoints: [
                { x: 42, y: 114 },
                { x: 106, y: 114 },
                { x: 106, y: 140 },
                { x: 42, y: 140 },
              ],
            },
            {
              frame: { top: 114, width: 38, height: 26, left: 115 },
              text: 'de',
              cornerPoints: [
                { x: 115, y: 114 },
                { x: 153, y: 114 },
                { x: 153, y: 140 },
                { x: 115, y: 140 },
              ],
            },
            {
              frame: { top: 114, width: 105, height: 31, left: 162 },
              text: 'poulet',
              cornerPoints: [
                { x: 162, y: 114 },
                { x: 267, y: 114 },
                { x: 267, y: 145 },
                { x: 162, y: 145 },
              ],
            },
          ],
          frame: { top: 114, width: 225, height: 31, left: 42 },
          cornerPoints: [
            { x: 42, y: 114 },
            { x: 267, y: 114 },
            { x: 267, y: 145 },
            { x: 42, y: 145 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'filet de poulet',
        },
        {
          elements: [
            {
              frame: { top: 156, width: 189, height: 42, left: 21 },
              text: 'gingembre',
              cornerPoints: [
                { x: 21, y: 158 },
                { x: 208.99205017089844, y: 156.27120971679688 },
                { x: 209.35987854003906, y: 196.26951599121094 },
                { x: 21.367826461791992, y: 197.99830627441406 },
              ],
            },
            {
              frame: { top: 155, width: 74, height: 42, left: 212 },
              text: '(cm)',
              cornerPoints: [
                { x: 212, y: 156 },
                { x: 284.9969177246094, y: 155.32872009277344 },
                { x: 285.3739318847656, y: 196.32699584960938 },
                { x: 212.3770294189453, y: 196.99826049804688 },
              ],
            },
          ],
          frame: { top: 155, width: 265, height: 43, left: 21 },
          cornerPoints: [
            { x: 21, y: 158 },
            { x: 284.98883056640625, y: 155.5723419189453 },
            { x: 285.3566589355469, y: 195.57064819335938 },
            { x: 21.367826461791992, y: 197.99830627441406 },
          ],
          recognizedLanguages: [{ languageCode: 'en' }],
          text: 'gingembre (cm)',
        },
      ],
      text: 'filet de poulet\ngingembre (cm)',
    },
    {
      frame: { top: 204, width: 188, height: 36, left: 31 },
      cornerPoints: [
        { x: 31, y: 210 },
        { x: 217.909423828125, y: 204.1804962158203 },
        { x: 218.84303283691406, y: 234.1659698486328 },
        { x: 31.933609008789062, y: 239.9854736328125 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 211, width: 112, height: 29, left: 31 },
              text: 'gousse',
              cornerPoints: [
                { x: 31, y: 215 },
                { x: 141.94622802734375, y: 211.54563903808594 },
                { x: 142.7242431640625, y: 236.53353881835938 },
                { x: 31.77800750732422, y: 239.98788452148438 },
              ],
            },
            {
              frame: { top: 203, width: 68, height: 32, left: 151 },
              text: "d'ail",
              cornerPoints: [
                { x: 151, y: 206 },
                { x: 217.96755981445312, y: 203.91493225097656 },
                { x: 218.87005615234375, y: 232.90087890625 },
                { x: 151.90249633789062, y: 234.9859619140625 },
              ],
            },
          ],
          frame: { top: 204, width: 188, height: 36, left: 31 },
          cornerPoints: [
            { x: 31, y: 210 },
            { x: 217.909423828125, y: 204.1804962158203 },
            { x: 218.84303283691406, y: 234.1659698486328 },
            { x: 31.933609008789062, y: 239.9854736328125 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: "gousse d'ail",
        },
      ],
      text: "gousse d'ail",
    },
    {
      frame: { top: 252, width: 264, height: 34, left: 27 },
      cornerPoints: [
        { x: 27, y: 252 },
        { x: 291, y: 252 },
        { x: 291, y: 286 },
        { x: 27, y: 286 },
      ],
      recognizedLanguages: [{ languageCode: 'es' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 254, width: 53, height: 26, left: 27 },
              text: 'lait',
              cornerPoints: [
                { x: 27, y: 254 },
                { x: 80, y: 254 },
                { x: 80, y: 280 },
                { x: 27, y: 280 },
              ],
            },
            {
              frame: { top: 253, width: 39, height: 27, left: 88 },
              text: 'de',
              cornerPoints: [
                { x: 88, y: 253 },
                { x: 127, y: 253 },
                { x: 127, y: 280 },
                { x: 88, y: 280 },
              ],
            },
            {
              frame: { top: 261, width: 75, height: 19, left: 136 },
              text: 'coco',
              cornerPoints: [
                { x: 136, y: 261 },
                { x: 211, y: 261 },
                { x: 211, y: 280 },
                { x: 136, y: 280 },
              ],
            },
            {
              frame: { top: 252, width: 70, height: 34, left: 221 },
              text: '(mL)',
              cornerPoints: [
                { x: 221, y: 252 },
                { x: 291, y: 252 },
                { x: 291, y: 286 },
                { x: 221, y: 286 },
              ],
            },
          ],
          frame: { top: 252, width: 264, height: 34, left: 27 },
          cornerPoints: [
            { x: 27, y: 252 },
            { x: 291, y: 252 },
            { x: 291, y: 286 },
            { x: 27, y: 286 },
          ],
          recognizedLanguages: [{ languageCode: 'es' }],
          text: 'lait de coco (mL)',
        },
      ],
      text: 'lait de coco (mL)',
    },
    {
      frame: { top: 300, width: 207, height: 33, left: 26 },
      cornerPoints: [
        { x: 26, y: 300 },
        { x: 233, y: 300 },
        { x: 233, y: 333 },
        { x: 26, y: 333 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 300, width: 107, height: 33, left: 26 },
              text: 'oignon',
              cornerPoints: [
                { x: 26, y: 300 },
                { x: 133, y: 300 },
                { x: 133, y: 333 },
                { x: 26, y: 333 },
              ],
            },
            {
              frame: { top: 300, width: 93, height: 33, left: 140 },
              text: 'jaune',
              cornerPoints: [
                { x: 140, y: 300 },
                { x: 233, y: 300 },
                { x: 233, y: 333 },
                { x: 140, y: 333 },
              ],
            },
          ],
          frame: { top: 300, width: 207, height: 33, left: 26 },
          cornerPoints: [
            { x: 26, y: 300 },
            { x: 233, y: 300 },
            { x: 233, y: 333 },
            { x: 26, y: 333 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'oignon jaune',
        },
      ],
      text: 'oignon jaune',
    },
    {
      frame: { top: 348, width: 299, height: 79, left: 14 },
      cornerPoints: [
        { x: 14, y: 348 },
        { x: 313, y: 348 },
        { x: 313, y: 427 },
        { x: 14, y: 427 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 348, width: 111, height: 32, left: 17 },
              text: 'oignon',
              cornerPoints: [
                { x: 17, y: 348 },
                { x: 128, y: 348 },
                { x: 128, y: 380 },
                { x: 17, y: 380 },
              ],
            },
            {
              frame: { top: 356, width: 142, height: 19, left: 138 },
              text: 'nouveau',
              cornerPoints: [
                { x: 138, y: 356 },
                { x: 280, y: 356 },
                { x: 280, y: 375 },
                { x: 138, y: 375 },
              ],
            },
          ],
          frame: { top: 348, width: 263, height: 32, left: 17 },
          cornerPoints: [
            { x: 17, y: 348 },
            { x: 280, y: 348 },
            { x: 280, y: 380 },
            { x: 17, y: 380 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'oignon nouveau',
        },
        {
          elements: [
            {
              frame: { top: 394, width: 39, height: 27, left: 14 },
              text: 'riz',
              cornerPoints: [
                { x: 14, y: 394 },
                { x: 53, y: 394 },
                { x: 53, y: 421 },
                { x: 14, y: 421 },
              ],
            },
            {
              frame: { top: 394, width: 129, height: 27, left: 64 },
              text: 'basmati',
              cornerPoints: [
                { x: 64, y: 394 },
                { x: 193, y: 394 },
                { x: 193, y: 421 },
                { x: 64, y: 421 },
              ],
            },
            {
              frame: { top: 394, width: 37, height: 33, left: 204 },
              text: '(g)',
              cornerPoints: [
                { x: 204, y: 394 },
                { x: 241, y: 394 },
                { x: 241, y: 427 },
                { x: 204, y: 427 },
              ],
            },
            {
              frame: { top: 394, width: 55, height: 27, left: 258 },
              text: 'Bio',
              cornerPoints: [
                { x: 258, y: 394 },
                { x: 313, y: 394 },
                { x: 313, y: 421 },
                { x: 258, y: 421 },
              ],
            },
          ],
          frame: { top: 394, width: 299, height: 33, left: 14 },
          cornerPoints: [
            { x: 14, y: 394 },
            { x: 313, y: 394 },
            { x: 313, y: 427 },
            { x: 14, y: 427 },
          ],
          recognizedLanguages: [{ languageCode: 'tr' }],
          text: 'riz basmati (g) Bio',
        },
      ],
      text: 'oignon nouveau\nriz basmati (g) Bio',
    },
  ],
  text: "cacahuètes grillées (g)\nconcentré de tomates (g)\nfilet de poulet\ngingembre (cm)\ngousse d'ail\nlait de coco (mL)\noignon jaune\noignon nouveau\nriz basmati (g) Bio",
};

export const androidNamesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 21, height: 81, left: 52, width: 397 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 21, height: 34, left: 52, width: 182 },
              cornerPoints: [
                { y: 21, x: 52 },
                { y: 21, x: 234 },
                { y: 55, x: 234 },
                { y: 55, x: 52 },
              ],
              text: 'cacahuètes',
            },
            {
              frame: { top: 21, height: 34, left: 240, width: 120 },
              cornerPoints: [
                { y: 21, x: 240 },
                { y: 21, x: 360 },
                { y: 55, x: 360 },
                { y: 55, x: 240 },
              ],
              text: 'grillées',
            },
            {
              frame: { top: 21, height: 34, left: 369, width: 39 },
              cornerPoints: [
                { y: 21, x: 369 },
                { y: 21, x: 408 },
                { y: 55, x: 408 },
                { y: 55, x: 369 },
              ],
              text: '(g)',
            },
          ],
          frame: { top: 21, height: 34, left: 52, width: 356 },
          cornerPoints: [
            { y: 21, x: 52 },
            { y: 21, x: 408 },
            { y: 55, x: 408 },
            { y: 55, x: 52 },
          ],
          text: 'cacahuètes grillées (g)',
        },
        {
          recognizedLanguages: [{ languageCode: 'es' }],
          elements: [
            {
              frame: { top: 66, height: 36, left: 67, width: 157 },
              cornerPoints: [
                { y: 66, x: 67 },
                { y: 66, x: 224 },
                { y: 102, x: 224 },
                { y: 102, x: 67 },
              ],
              text: 'concentré',
            },
            {
              frame: { top: 66, height: 36, left: 219, width: 39 },
              cornerPoints: [
                { y: 66, x: 219 },
                { y: 66, x: 258 },
                { y: 102, x: 258 },
                { y: 102, x: 219 },
              ],
              text: 'de',
            },
            {
              frame: { top: 66, height: 36, left: 267, width: 135 },
              cornerPoints: [
                { y: 66, x: 267 },
                { y: 66, x: 402 },
                { y: 102, x: 402 },
                { y: 102, x: 267 },
              ],
              text: 'tomates',
            },
            {
              frame: { top: 66, height: 36, left: 410, width: 39 },
              cornerPoints: [
                { y: 66, x: 410 },
                { y: 66, x: 449 },
                { y: 102, x: 449 },
                { y: 102, x: 410 },
              ],
              text: '(g)',
            },
          ],
          frame: { top: 66, height: 36, left: 67, width: 382 },
          cornerPoints: [
            { y: 66, x: 67 },
            { y: 66, x: 449 },
            { y: 102, x: 449 },
            { y: 102, x: 67 },
          ],
          text: 'concentré de tomates (g)',
        },
      ],
      cornerPoints: [
        { y: 21, x: 52 },
        { y: 21, x: 449 },
        { y: 102, x: 449 },
        { y: 102, x: 52 },
      ],
      text: 'cacahuètes grillées (g)\nconcentré de tomates (g)',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 112, height: 84, left: 47, width: 242 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 112, height: 35, left: 47, width: 61 },
              cornerPoints: [
                { y: 112, x: 47 },
                { y: 112, x: 108 },
                { y: 147, x: 108 },
                { y: 147, x: 47 },
              ],
              text: 'filet',
            },
            {
              frame: { top: 112, height: 35, left: 126, width: 29 },
              cornerPoints: [
                { y: 112, x: 126 },
                { y: 112, x: 155 },
                { y: 147, x: 155 },
                { y: 147, x: 126 },
              ],
              text: 'de',
            },
            {
              frame: { top: 112, height: 35, left: 162, width: 106 },
              cornerPoints: [
                { y: 112, x: 162 },
                { y: 112, x: 268 },
                { y: 147, x: 268 },
                { y: 147, x: 162 },
              ],
              text: 'poulet',
            },
          ],
          frame: { top: 112, height: 35, left: 47, width: 221 },
          cornerPoints: [
            { y: 112, x: 47 },
            { y: 112, x: 268 },
            { y: 147, x: 268 },
            { y: 147, x: 47 },
          ],
          text: 'filet de poulet',
        },
        {
          recognizedLanguages: [{ languageCode: 'en' }],
          elements: [
            {
              frame: { top: 157, height: 39, left: 49, width: 166 },
              cornerPoints: [
                { y: 157, x: 49 },
                { y: 157, x: 215 },
                { y: 196, x: 215 },
                { y: 196, x: 49 },
              ],
              text: 'gingembre',
            },
            {
              frame: { top: 157, height: 39, left: 227, width: 62 },
              cornerPoints: [
                { y: 157, x: 227 },
                { y: 157, x: 289 },
                { y: 196, x: 289 },
                { y: 196, x: 227 },
              ],
              text: '(cm)',
            },
          ],
          frame: { top: 157, height: 39, left: 49, width: 240 },
          cornerPoints: [
            { y: 157, x: 49 },
            { y: 157, x: 289 },
            { y: 196, x: 289 },
            { y: 196, x: 49 },
          ],
          text: 'gingembre (cm)',
        },
      ],
      cornerPoints: [
        { y: 112, x: 47 },
        { y: 112, x: 289 },
        { y: 196, x: 289 },
        { y: 196, x: 47 },
      ],
      text: 'filet de poulet\ngingembre (cm)',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 203, height: 37, left: 31, width: 187 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          elements: [
            {
              frame: { top: 203, height: 37, left: 31, width: 187 },
              cornerPoints: [
                { y: 210, x: 31 },
                { y: 203, x: 217 },
                { y: 233, x: 218 },
                { y: 240, x: 32 },
              ],
              text: "gOussed'ail",
            },
          ],
          frame: { top: 203, height: 37, left: 31, width: 187 },
          cornerPoints: [
            { y: 210, x: 31 },
            { y: 203, x: 217 },
            { y: 233, x: 218 },
            { y: 240, x: 32 },
          ],
          text: "gOussed'ail",
        },
      ],
      cornerPoints: [
        { y: 210, x: 31 },
        { y: 203, x: 217 },
        { y: 233, x: 218 },
        { y: 240, x: 32 },
      ],
      text: "gOussed'ail",
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 252, height: 34, left: 29, width: 263 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'es' }],
          elements: [
            {
              frame: { top: 252, height: 34, left: 29, width: 52 },
              cornerPoints: [
                { y: 252, x: 29 },
                { y: 252, x: 81 },
                { y: 286, x: 81 },
                { y: 286, x: 29 },
              ],
              text: 'lait',
            },
            {
              frame: { top: 252, height: 34, left: 88, width: 40 },
              cornerPoints: [
                { y: 252, x: 88 },
                { y: 252, x: 128 },
                { y: 286, x: 128 },
                { y: 286, x: 88 },
              ],
              text: 'de',
            },
            {
              frame: { top: 252, height: 34, left: 136, width: 76 },
              cornerPoints: [
                { y: 252, x: 136 },
                { y: 252, x: 212 },
                { y: 286, x: 212 },
                { y: 286, x: 136 },
              ],
              text: 'cOco',
            },
            {
              frame: { top: 252, height: 34, left: 221, width: 71 },
              cornerPoints: [
                { y: 252, x: 221 },
                { y: 252, x: 292 },
                { y: 286, x: 292 },
                { y: 286, x: 221 },
              ],
              text: '(mL)',
            },
          ],
          frame: { top: 252, height: 34, left: 29, width: 263 },
          cornerPoints: [
            { y: 252, x: 29 },
            { y: 252, x: 292 },
            { y: 286, x: 292 },
            { y: 286, x: 29 },
          ],
          text: 'lait de cOco (mL)',
        },
      ],
      cornerPoints: [
        { y: 252, x: 29 },
        { y: 252, x: 292 },
        { y: 286, x: 292 },
        { y: 286, x: 29 },
      ],
      text: 'lait de cOco (mL)',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 300, height: 34, left: 23, width: 210 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 300, height: 34, left: 23, width: 112 },
              cornerPoints: [
                { y: 300, x: 23 },
                { y: 300, x: 135 },
                { y: 334, x: 135 },
                { y: 334, x: 23 },
              ],
              text: 'oignon',
            },
            {
              frame: { top: 300, height: 34, left: 140, width: 93 },
              cornerPoints: [
                { y: 300, x: 140 },
                { y: 300, x: 233 },
                { y: 334, x: 233 },
                { y: 334, x: 140 },
              ],
              text: 'jaune',
            },
          ],
          frame: { top: 300, height: 34, left: 23, width: 210 },
          cornerPoints: [
            { y: 300, x: 23 },
            { y: 300, x: 233 },
            { y: 334, x: 233 },
            { y: 334, x: 23 },
          ],
          text: 'oignon jaune',
        },
      ],
      cornerPoints: [
        { y: 300, x: 23 },
        { y: 300, x: 233 },
        { y: 334, x: 233 },
        { y: 334, x: 23 },
      ],
      text: 'oignon jaune',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 349, height: 79, left: 14, width: 300 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 349, height: 32, left: 37, width: 93 },
              cornerPoints: [
                { y: 349, x: 37 },
                { y: 349, x: 130 },
                { y: 381, x: 130 },
                { y: 381, x: 37 },
              ],
              text: 'oignon',
            },
            {
              frame: { top: 349, height: 32, left: 149, width: 136 },
              cornerPoints: [
                { y: 349, x: 149 },
                { y: 349, x: 285 },
                { y: 381, x: 285 },
                { y: 381, x: 149 },
              ],
              text: 'nouveau',
            },
          ],
          frame: { top: 349, height: 32, left: 37, width: 248 },
          cornerPoints: [
            { y: 349, x: 37 },
            { y: 349, x: 285 },
            { y: 381, x: 285 },
            { y: 381, x: 37 },
          ],
          text: 'oignon nouveau',
        },
        {
          recognizedLanguages: [{ languageCode: 'tr' }],
          elements: [
            {
              frame: { top: 394, height: 34, left: 14, width: 40 },
              cornerPoints: [
                { y: 394, x: 14 },
                { y: 394, x: 54 },
                { y: 428, x: 54 },
                { y: 428, x: 14 },
              ],
              text: 'riz',
            },
            {
              frame: { top: 394, height: 34, left: 64, width: 130 },
              cornerPoints: [
                { y: 394, x: 64 },
                { y: 394, x: 194 },
                { y: 428, x: 194 },
                { y: 428, x: 64 },
              ],
              text: 'basmati',
            },
            {
              frame: { top: 394, height: 34, left: 204, width: 38 },
              cornerPoints: [
                { y: 394, x: 204 },
                { y: 394, x: 242 },
                { y: 428, x: 242 },
                { y: 428, x: 204 },
              ],
              text: '(g)',
            },
            {
              frame: { top: 394, height: 34, left: 258, width: 56 },
              cornerPoints: [
                { y: 394, x: 258 },
                { y: 394, x: 314 },
                { y: 428, x: 314 },
                { y: 428, x: 258 },
              ],
              text: 'Bio',
            },
          ],
          frame: { top: 394, height: 34, left: 14, width: 300 },
          cornerPoints: [
            { y: 394, x: 14 },
            { y: 394, x: 314 },
            { y: 428, x: 314 },
            { y: 428, x: 14 },
          ],
          text: 'riz basmati (g) Bio',
        },
      ],
      cornerPoints: [
        { y: 349, x: 14 },
        { y: 349, x: 314 },
        { y: 428, x: 314 },
        { y: 428, x: 14 },
      ],
      text: 'oignon nouveau\nriz basmati (g) Bio',
    },
  ],
  text: "cacahuètes grillées (g)\nconcentré de tomates (g)\nfilet de poulet\ngingembre (cm)\ngOussed'ail\nlait de cOco (mL)\noignon jaune\noignon nouveau\nriz basmati (g) Bio",
};

export const quantitiesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 363, height: 28, left: 121, width: 50 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          elements: [
            {
              frame: { top: 363, height: 28, left: 121, width: 50 },
              cornerPoints: [
                { y: 363, x: 121 },
                { y: 363, x: 171 },
                { y: 391, x: 171 },
                { y: 391, x: 121 },
              ],
              text: '0.5',
            },
          ],
          frame: { top: 363, height: 28, left: 121, width: 50 },
          cornerPoints: [
            { y: 363, x: 121 },
            { y: 363, x: 171 },
            { y: 391, x: 171 },
            { y: 391, x: 121 },
          ],
          text: '0.5',
        },
      ],
      cornerPoints: [
        { y: 363, x: 121 },
        { y: 363, x: 171 },
        { y: 391, x: 171 },
        { y: 391, x: 121 },
      ],
      text: '0.5',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 412, height: 28, left: 115, width: 62 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          elements: [
            {
              frame: { top: 412, height: 28, left: 115, width: 62 },
              cornerPoints: [
                { y: 412, x: 115 },
                { y: 412, x: 177 },
                { y: 440, x: 177 },
                { y: 440, x: 115 },
              ],
              text: '150',
            },
          ],
          frame: { top: 412, height: 28, left: 115, width: 62 },
          cornerPoints: [
            { y: 412, x: 115 },
            { y: 412, x: 177 },
            { y: 440, x: 177 },
            { y: 440, x: 115 },
          ],
          text: '150',
        },
      ],
      cornerPoints: [
        { y: 412, x: 115 },
        { y: 412, x: 177 },
        { y: 440, x: 177 },
        { y: 440, x: 115 },
      ],
      text: '150',
    },
  ],
  text: '0.5\n150',
};

export const expectedIngredientNames: FormIngredientElement[] = [
  { name: 'cacahuètes grillées', unit: 'g' },
  { name: 'concentré de tomates', unit: 'g' },
  { name: 'filet de poulet', unit: '' },
  { name: 'gingembre', unit: 'cm' },
  { name: "gOussed'ail", unit: '' },
  { name: 'lait de cOco', unit: 'mL' },
  { name: 'oignon jaune', unit: '' },
  { name: 'oignon nouveau', unit: '' },
  { name: 'riz basmati  Bio', unit: 'g' },
];

export const expectedQuantities: string[] = ['0.5', '150'];

export const expectedIosIngredientNames: FormIngredientElement[] = [
  { name: 'cacahuètes grillées', unit: 'g' },
  { name: 'concentré de tomates', unit: 'g' },
  { name: 'filet de poulet', unit: '' },
  { name: 'gingembre', unit: 'cm' },
  { name: "gousse d'ail", unit: '' },
  { name: 'lait de coco', unit: 'mL' },
  { name: 'oignon jaune', unit: '' },
  { name: 'oignon nouveau', unit: '' },
  { name: 'riz basmati  Bio', unit: 'g' },
];

export const iosQuantitiesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      frame: { top: 35, width: 61, height: 28, left: 139 },
      cornerPoints: [
        { x: 140, y: 35 },
        { x: 199.99652099609375, y: 35.645870208740234 },
        { x: 199.70587158203125, y: 62.64430618286133 },
        { x: 139.7093505859375, y: 61.998435974121094 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 35, width: 61, height: 28, left: 139 },
              text: '100',
              cornerPoints: [
                { x: 140, y: 35 },
                { x: 199.99652099609375, y: 35.645870208740234 },
                { x: 199.70587158203125, y: 62.64430618286133 },
                { x: 139.7093505859375, y: 61.998435974121094 },
              ],
            },
          ],
          frame: { top: 35, width: 61, height: 28, left: 139 },
          cornerPoints: [
            { x: 140, y: 35 },
            { x: 199.99652099609375, y: 35.645870208740234 },
            { x: 199.70587158203125, y: 62.64430618286133 },
            { x: 139.7093505859375, y: 61.998435974121094 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '100',
        },
      ],
      text: '100',
    },
    {
      frame: { top: 81, width: 39, height: 26, left: 145 },
      cornerPoints: [
        { x: 145, y: 81 },
        { x: 184, y: 81 },
        { x: 184, y: 107 },
        { x: 145, y: 107 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 81, width: 39, height: 26, left: 145 },
              text: '35',
              cornerPoints: [
                { x: 145, y: 81 },
                { x: 184, y: 81 },
                { x: 184, y: 107 },
                { x: 145, y: 107 },
              ],
            },
          ],
          frame: { top: 81, width: 39, height: 26, left: 145 },
          cornerPoints: [
            { x: 145, y: 81 },
            { x: 184, y: 81 },
            { x: 184, y: 107 },
            { x: 145, y: 107 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '35',
        },
      ],
      text: '35',
    },
    {
      frame: { top: 127, width: 70, height: 314, left: 115 },
      cornerPoints: [
        { x: 125, y: 127 },
        { x: 184.970458984375, y: 128.8823699951172 },
        { x: 175.18214416503906, y: 440.728759765625 },
        { x: 115.21168518066406, y: 438.8464050292969 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 128, width: 19, height: 27, left: 152 },
              text: '2',
              cornerPoints: [
                { x: 153, y: 128 },
                { x: 170.9911346435547, y: 128.56471252441406 },
                { x: 170.17544555664062, y: 154.55191040039062 },
                { x: 152.18431091308594, y: 153.98719787597656 },
              ],
            },
          ],
          frame: { top: 128, width: 19, height: 27, left: 152 },
          cornerPoints: [
            { x: 153, y: 128 },
            { x: 170.9911346435547, y: 128.56471252441406 },
            { x: 170.17544555664062, y: 154.55191040039062 },
            { x: 152.18431091308594, y: 153.98719787597656 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '2',
        },
        {
          elements: [
            {
              frame: { top: 222, width: 17, height: 26, left: 148 },
              text: '1',
              cornerPoints: [
                { x: 149, y: 222 },
                { x: 164.99888610839844, y: 222.188232421875 },
                { x: 164.70477294921875, y: 247.18650817871094 },
                { x: 148.7058868408203, y: 246.99827575683594 },
              ],
            },
          ],
          frame: { top: 222, width: 17, height: 26, left: 148 },
          cornerPoints: [
            { x: 149, y: 222 },
            { x: 164.99888610839844, y: 222.188232421875 },
            { x: 164.70477294921875, y: 247.18650817871094 },
            { x: 148.7058868408203, y: 246.99827575683594 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '1',
        },
        {
          elements: [
            {
              frame: { top: 316, width: 18, height: 28, left: 140 },
              text: '1',
              cornerPoints: [
                { x: 140, y: 318 },
                { x: 154.92884826660156, y: 316.5408020019531 },
                { x: 157.45814514160156, y: 342.41748046875 },
                { x: 142.529296875, y: 343.8766784667969 },
              ],
            },
          ],
          frame: { top: 316, width: 18, height: 28, left: 140 },
          cornerPoints: [
            { x: 140, y: 318 },
            { x: 154.92884826660156, y: 316.5408020019531 },
            { x: 157.45814514160156, y: 342.41748046875 },
            { x: 142.529296875, y: 343.8766784667969 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '1',
        },
        {
          elements: [
            {
              frame: { top: 362, width: 50, height: 29, left: 121 },
              text: '0.5',
              cornerPoints: [
                { x: 122, y: 362 },
                { x: 170.992919921875, y: 362.8326721191406 },
                { x: 170.51710510253906, y: 390.82861328125 },
                { x: 121.52417755126953, y: 389.9959716796875 },
              ],
            },
          ],
          frame: { top: 362, width: 50, height: 29, left: 121 },
          cornerPoints: [
            { x: 122, y: 362 },
            { x: 170.992919921875, y: 362.8326721191406 },
            { x: 170.51710510253906, y: 390.82861328125 },
            { x: 121.52417755126953, y: 389.9959716796875 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '0.5',
        },
        {
          elements: [
            {
              frame: { top: 411, width: 62, height: 29, left: 114 },
              text: '150',
              cornerPoints: [
                { x: 115, y: 411 },
                { x: 175.99249267578125, y: 411.9568786621094 },
                { x: 175.5532684326172, y: 439.95343017578125 },
                { x: 114.56078338623047, y: 438.9965515136719 },
              ],
            },
          ],
          frame: { top: 411, width: 62, height: 29, left: 114 },
          cornerPoints: [
            { x: 115, y: 411 },
            { x: 175.99249267578125, y: 411.9568786621094 },
            { x: 175.5532684326172, y: 439.95343017578125 },
            { x: 114.56078338623047, y: 438.9965515136719 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '150',
        },
      ],
      text: '2\n1\n1\n0.5\n150',
    },
    {
      frame: { top: 172, width: 73, height: 30, left: 124 },
      cornerPoints: [
        { x: 124, y: 174 },
        { x: 195.9886474609375, y: 172.7216339111328 },
        { x: 196.4857940673828, y: 200.71722412109375 },
        { x: 124.49714660644531, y: 201.99559020996094 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 172, width: 73, height: 30, left: 124 },
              text: '1à3',
              cornerPoints: [
                { x: 124, y: 174 },
                { x: 195.9886474609375, y: 172.7216339111328 },
                { x: 196.4857940673828, y: 200.71722412109375 },
                { x: 124.49714660644531, y: 201.99559020996094 },
              ],
            },
          ],
          frame: { top: 172, width: 73, height: 30, left: 124 },
          cornerPoints: [
            { x: 124, y: 174 },
            { x: 195.9886474609375, y: 172.7216339111328 },
            { x: 196.4857940673828, y: 200.71722412109375 },
            { x: 124.49714660644531, y: 201.99559020996094 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '1à3',
        },
      ],
      text: '1à3',
    },
    {
      frame: { top: 266, width: 65, height: 30, left: 121 },
      cornerPoints: [
        { x: 121, y: 267 },
        { x: 184.9966583251953, y: 266.345458984375 },
        { x: 185.29324340820312, y: 295.34393310546875 },
        { x: 121.29658508300781, y: 295.99847412109375 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 266, width: 65, height: 30, left: 121 },
              text: '200',
              cornerPoints: [
                { x: 121, y: 267 },
                { x: 184.9966583251953, y: 266.345458984375 },
                { x: 185.29324340820312, y: 295.34393310546875 },
                { x: 121.29658508300781, y: 295.99847412109375 },
              ],
            },
          ],
          frame: { top: 266, width: 65, height: 30, left: 121 },
          cornerPoints: [
            { x: 121, y: 267 },
            { x: 184.9966583251953, y: 266.345458984375 },
            { x: 185.29324340820312, y: 295.34393310546875 },
            { x: 121.29658508300781, y: 295.99847412109375 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '200',
        },
      ],
      text: '200',
    },
  ],
  text: '100\n35\n2\n1\n1\n0.5\n150\n1à3\n200',
};

export const expectedIosQuantities: string[] = [
  '100',
  '35',
  '2',
  '1',
  '1',
  '0.5',
  '150',
  '1à3',
  '200',
];
