/* eslint-disable no-loss-of-precision */
import { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { FormIngredientElement } from '@customTypes/DatabaseElementTypes';

export const iosNamesOcrResult: TextRecognitionResult = {
  text: "cacahuètes grillées (g)\nconcentré de tomates (g)\nfilet de poulet\ngingembre (cm)\ngousse d'ail\nlait de coco (mL)\noignon jaune\noignon nouveau\nriz basmati (g) Bio",
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'es' }],
      frame: { top: 21, width: 401, height: 79, left: 46 },
      cornerPoints: [
        { x: 46, y: 21 },
        { x: 447, y: 21 },
        { x: 447, y: 100 },
        { x: 46, y: 100 },
      ],
      text: 'cacahuètes grillées (g)\nconcentré de tomates (g)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 21, width: 354, height: 34, left: 51 },
          cornerPoints: [
            { x: 51, y: 21 },
            { x: 405, y: 21 },
            { x: 405, y: 55 },
            { x: 51, y: 55 },
          ],
          text: 'cacahuètes grillées (g)',
          elements: [
            {
              frame: { top: 23, width: 182, height: 25, left: 51 },
              cornerPoints: [
                { x: 51, y: 23 },
                { x: 233, y: 23 },
                { x: 233, y: 48 },
                { x: 51, y: 48 },
              ],
              text: 'cacahuètes',
            },
            {
              frame: { top: 22, width: 120, height: 32, left: 240 },
              cornerPoints: [
                { x: 240, y: 22 },
                { x: 360, y: 22 },
                { x: 360, y: 54 },
                { x: 240, y: 54 },
              ],
              text: 'grillées',
            },
            {
              frame: { top: 21, width: 37, height: 34, left: 368 },
              cornerPoints: [
                { x: 368, y: 21 },
                { x: 405, y: 21 },
                { x: 405, y: 55 },
                { x: 368, y: 55 },
              ],
              text: '(g)',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'es' }],
          frame: { top: 67, width: 401, height: 33, left: 46 },
          cornerPoints: [
            { x: 46, y: 67 },
            { x: 447, y: 67 },
            { x: 447, y: 100 },
            { x: 46, y: 100 },
          ],
          text: 'concentré de tomates (g)',
          elements: [
            {
              frame: { top: 68, width: 163, height: 26, left: 46 },
              cornerPoints: [
                { x: 46, y: 68 },
                { x: 209, y: 68 },
                { x: 209, y: 94 },
                { x: 46, y: 94 },
              ],
              text: 'concentré',
            },
            {
              frame: { top: 68, width: 39, height: 26, left: 218 },
              cornerPoints: [
                { x: 218, y: 68 },
                { x: 257, y: 68 },
                { x: 257, y: 94 },
                { x: 218, y: 94 },
              ],
              text: 'de',
            },
            {
              frame: { top: 70, width: 134, height: 24, left: 267 },
              cornerPoints: [
                { x: 267, y: 70 },
                { x: 401, y: 70 },
                { x: 401, y: 94 },
                { x: 267, y: 94 },
              ],
              text: 'tomates',
            },
            {
              frame: { top: 67, width: 37, height: 33, left: 410 },
              cornerPoints: [
                { x: 410, y: 67 },
                { x: 447, y: 67 },
                { x: 447, y: 100 },
                { x: 410, y: 100 },
              ],
              text: '(g)',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'en' }],
      frame: { top: 114, width: 263, height: 86, left: 23 },
      cornerPoints: [
        { x: 23, y: 114 },
        { x: 286, y: 114 },
        { x: 286, y: 200 },
        { x: 23, y: 200 },
      ],
      text: 'filet de poulet\ngingembre (cm)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 114, width: 225, height: 31, left: 42 },
          cornerPoints: [
            { x: 42, y: 114 },
            { x: 267, y: 114 },
            { x: 267, y: 145 },
            { x: 42, y: 145 },
          ],
          text: 'filet de poulet',
          elements: [
            {
              frame: { top: 114, width: 64, height: 26, left: 42 },
              cornerPoints: [
                { x: 42, y: 114 },
                { x: 106, y: 114 },
                { x: 106, y: 140 },
                { x: 42, y: 140 },
              ],
              text: 'filet',
            },
            {
              frame: { top: 114, width: 38, height: 26, left: 115 },
              cornerPoints: [
                { x: 115, y: 114 },
                { x: 153, y: 114 },
                { x: 153, y: 140 },
                { x: 115, y: 140 },
              ],
              text: 'de',
            },
            {
              frame: { top: 114, width: 105, height: 31, left: 162 },
              cornerPoints: [
                { x: 162, y: 114 },
                { x: 267, y: 114 },
                { x: 267, y: 145 },
                { x: 162, y: 145 },
              ],
              text: 'poulet',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'en' }],
          frame: { top: 156, width: 265, height: 44, left: 22 },
          cornerPoints: [
            { x: 22, y: 159 },
            { x: 285.9837951660156, y: 156.07522583007812 },
            { x: 286.4380187988281, y: 197.0727081298828 },
            { x: 22.454227447509766, y: 199.9974822998047 },
          ],
          text: 'gingembre (cm)',
          elements: [
            {
              frame: { top: 156, width: 189, height: 44, left: 22 },
              cornerPoints: [
                { x: 22, y: 159 },
                { x: 209.98846435546875, y: 156.91720581054688 },
                { x: 210.44268798828125, y: 197.91468811035156 },
                { x: 22.454227447509766, y: 199.9974822998047 },
              ],
              text: 'gingembre',
            },
            {
              frame: { top: 156, width: 74, height: 41, left: 213 },
              cornerPoints: [
                { x: 213, y: 157 },
                { x: 285.9955139160156, y: 156.19125366210938 },
                { x: 286.43865966796875, y: 196.1887969970703 },
                { x: 213.44314575195312, y: 196.99754333496094 },
              ],
              text: '(cm)',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 204, width: 188, height: 36, left: 31 },
      cornerPoints: [
        { x: 31, y: 210 },
        { x: 217.90594482421875, y: 204.06979370117188 },
        { x: 218.85731506347656, y: 234.05470275878906 },
        { x: 31.951370239257812, y: 239.9849090576172 },
      ],
      text: "gousse d'ail",
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 204, width: 188, height: 36, left: 31 },
          cornerPoints: [
            { x: 31, y: 210 },
            { x: 217.90594482421875, y: 204.06979370117188 },
            { x: 218.85731506347656, y: 234.05470275878906 },
            { x: 31.951370239257812, y: 239.9849090576172 },
          ],
          text: "gousse d'ail",
          elements: [
            {
              frame: { top: 211, width: 113, height: 29, left: 31 },
              cornerPoints: [
                { x: 31, y: 215 },
                { x: 142.94366455078125, y: 211.44821166992188 },
                { x: 143.73646545410156, y: 236.43563842773438 },
                { x: 31.792808532714844, y: 239.9874267578125 },
              ],
              text: 'gousse',
            },
            {
              frame: { top: 203, width: 68, height: 32, left: 151 },
              cornerPoints: [
                { x: 151, y: 206 },
                { x: 217.96630859375, y: 203.87527465820312 },
                { x: 218.88597106933594, y: 232.86068725585938 },
                { x: 151.91966247558594, y: 234.98541259765625 },
              ],
              text: "d'ail",
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'es' }],
      frame: { top: 253, width: 261, height: 33, left: 30 },
      cornerPoints: [
        { x: 30, y: 253 },
        { x: 291, y: 253 },
        { x: 291, y: 286 },
        { x: 30, y: 286 },
      ],
      text: 'lait de coco (mL)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'es' }],
          frame: { top: 253, width: 261, height: 33, left: 30 },
          cornerPoints: [
            { x: 30, y: 253 },
            { x: 291, y: 253 },
            { x: 291, y: 286 },
            { x: 30, y: 286 },
          ],
          text: 'lait de coco (mL)',
          elements: [
            {
              frame: { top: 254, width: 50, height: 26, left: 30 },
              cornerPoints: [
                { x: 30, y: 254 },
                { x: 80, y: 254 },
                { x: 80, y: 280 },
                { x: 30, y: 280 },
              ],
              text: 'lait',
            },
            {
              frame: { top: 254, width: 39, height: 26, left: 88 },
              cornerPoints: [
                { x: 88, y: 254 },
                { x: 127, y: 254 },
                { x: 127, y: 280 },
                { x: 88, y: 280 },
              ],
              text: 'de',
            },
            {
              frame: { top: 261, width: 75, height: 19, left: 136 },
              cornerPoints: [
                { x: 136, y: 261 },
                { x: 211, y: 261 },
                { x: 211, y: 280 },
                { x: 136, y: 280 },
              ],
              text: 'coco',
            },
            {
              frame: { top: 253, width: 69, height: 33, left: 222 },
              cornerPoints: [
                { x: 222, y: 253 },
                { x: 291, y: 253 },
                { x: 291, y: 286 },
                { x: 222, y: 286 },
              ],
              text: '(mL)',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 296, width: 210, height: 39, left: 24 },
      cornerPoints: [
        { x: 24, y: 299 },
        { x: 232.9804229736328, y: 296.13958740234375 },
        { x: 233.47312927246094, y: 332.13623046875 },
        { x: 24.49270248413086, y: 334.99664306640625 },
      ],
      text: 'oignon jaune',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 296, width: 210, height: 39, left: 24 },
          cornerPoints: [
            { x: 24, y: 299 },
            { x: 232.9804229736328, y: 296.13958740234375 },
            { x: 233.47312927246094, y: 332.13623046875 },
            { x: 24.49270248413086, y: 334.99664306640625 },
          ],
          text: 'oignon jaune',
          elements: [
            {
              frame: { top: 297, width: 110, height: 38, left: 24 },
              cornerPoints: [
                { x: 24, y: 299 },
                { x: 132.9897918701172, y: 297.5082092285156 },
                { x: 133.4824981689453, y: 333.50482177734375 },
                { x: 24.49270248413086, y: 334.99664306640625 },
              ],
              text: 'oignon',
            },
            {
              frame: { top: 298, width: 96, height: 36, left: 138 },
              cornerPoints: [
                { x: 138, y: 300 },
                { x: 232.99110412597656, y: 298.6997985839844 },
                { x: 233.45643615722656, y: 332.6966247558594 },
                { x: 138.46533203125, y: 333.996826171875 },
              ],
              text: 'jaune',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 348, width: 299, height: 81, left: 14 },
      cornerPoints: [
        { x: 14, y: 348 },
        { x: 313, y: 348 },
        { x: 313, y: 429 },
        { x: 14, y: 429 },
      ],
      text: 'oignon nouveau\nriz basmati (g) Bio',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 348, width: 262, height: 34, left: 17 },
          cornerPoints: [
            { x: 17, y: 348 },
            { x: 279, y: 348 },
            { x: 279, y: 382 },
            { x: 17, y: 382 },
          ],
          text: 'oignon nouveau',
          elements: [
            {
              frame: { top: 348, width: 111, height: 34, left: 17 },
              cornerPoints: [
                { x: 17, y: 348 },
                { x: 128, y: 348 },
                { x: 128, y: 382 },
                { x: 17, y: 382 },
              ],
              text: 'oignon',
            },
            {
              frame: { top: 348, width: 143, height: 34, left: 136 },
              cornerPoints: [
                { x: 136, y: 348 },
                { x: 279, y: 348 },
                { x: 279, y: 382 },
                { x: 136, y: 382 },
              ],
              text: 'nouveau',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'tr' }],
          frame: { top: 394, width: 299, height: 35, left: 14 },
          cornerPoints: [
            { x: 14, y: 394 },
            { x: 313, y: 394 },
            { x: 313, y: 429 },
            { x: 14, y: 429 },
          ],
          text: 'riz basmati (g) Bio',
          elements: [
            {
              frame: { top: 394, width: 39, height: 35, left: 14 },
              cornerPoints: [
                { x: 14, y: 394 },
                { x: 53, y: 394 },
                { x: 53, y: 429 },
                { x: 14, y: 429 },
              ],
              text: 'riz',
            },
            {
              frame: { top: 394, width: 129, height: 27, left: 64 },
              cornerPoints: [
                { x: 64, y: 394 },
                { x: 193, y: 394 },
                { x: 193, y: 421 },
                { x: 64, y: 421 },
              ],
              text: 'basmati',
            },
            {
              frame: { top: 394, width: 37, height: 35, left: 204 },
              cornerPoints: [
                { x: 204, y: 394 },
                { x: 241, y: 394 },
                { x: 241, y: 429 },
                { x: 204, y: 429 },
              ],
              text: '(g)',
            },
            {
              frame: { top: 396, width: 55, height: 27, left: 258 },
              cornerPoints: [
                { x: 258, y: 396 },
                { x: 313, y: 396 },
                { x: 313, y: 423 },
                { x: 258, y: 423 },
              ],
              text: 'Bio',
            },
          ],
        },
      ],
    },
  ],
};

export const androidNamesOcrResult: TextRecognitionResult = {
  text: "cacahuètes grillées (g)\nconcentré de tomates (g)\nfilet de poulet\ngingembre (cm)\ngoussed'ail\nlait de cOco (mL)\noignon jaune\noignon nouveau\nriz basmati (g) Bio",
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 22, height: 80, left: 52, width: 397 },
      cornerPoints: [
        { y: 22, x: 52 },
        { y: 22, x: 449 },
        { y: 102, x: 449 },
        { y: 102, x: 52 },
      ],
      text: 'cacahuètes grillées (g)\nconcentré de tomates (g)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 22, height: 34, left: 52, width: 356 },
          cornerPoints: [
            { y: 22, x: 52 },
            { y: 22, x: 408 },
            { y: 56, x: 408 },
            { y: 56, x: 52 },
          ],
          text: 'cacahuètes grillées (g)',
          elements: [
            {
              frame: { top: 22, height: 34, left: 52, width: 181 },
              cornerPoints: [
                { y: 22, x: 52 },
                { y: 22, x: 233 },
                { y: 56, x: 233 },
                { y: 56, x: 52 },
              ],
              text: 'cacahuètes',
            },
            {
              frame: { top: 22, height: 34, left: 241, width: 119 },
              cornerPoints: [
                { y: 22, x: 241 },
                { y: 22, x: 360 },
                { y: 56, x: 360 },
                { y: 56, x: 241 },
              ],
              text: 'grillées',
            },
            {
              frame: { top: 22, height: 34, left: 370, width: 38 },
              cornerPoints: [
                { y: 22, x: 370 },
                { y: 22, x: 408 },
                { y: 56, x: 408 },
                { y: 56, x: 370 },
              ],
              text: '(g)',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'es' }],
          frame: { top: 67, height: 35, left: 64, width: 385 },
          cornerPoints: [
            { y: 67, x: 64 },
            { y: 67, x: 449 },
            { y: 102, x: 449 },
            { y: 102, x: 64 },
          ],
          text: 'concentré de tomates (g)',
          elements: [
            {
              frame: { top: 67, height: 35, left: 64, width: 167 },
              cornerPoints: [
                { y: 67, x: 64 },
                { y: 67, x: 231 },
                { y: 102, x: 231 },
                { y: 102, x: 64 },
              ],
              text: 'concentré',
            },
            {
              frame: { top: 67, height: 35, left: 233, width: 29 },
              cornerPoints: [
                { y: 67, x: 233 },
                { y: 67, x: 262 },
                { y: 102, x: 262 },
                { y: 102, x: 233 },
              ],
              text: 'de',
            },
            {
              frame: { top: 67, height: 35, left: 267, width: 135 },
              cornerPoints: [
                { y: 67, x: 267 },
                { y: 67, x: 402 },
                { y: 102, x: 402 },
                { y: 102, x: 267 },
              ],
              text: 'tomates',
            },
            {
              frame: { top: 67, height: 35, left: 410, width: 39 },
              cornerPoints: [
                { y: 67, x: 410 },
                { y: 67, x: 449 },
                { y: 102, x: 449 },
                { y: 102, x: 410 },
              ],
              text: '(g)',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 108, height: 132, left: 30, width: 258 },
      cornerPoints: [
        { y: 112, x: 30 },
        { y: 108, x: 287 },
        { y: 236, x: 288 },
        { y: 240, x: 31 },
      ],
      text: "filet de poulet\ngingembre (cm)\ngoussed'ail",
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 112, height: 35, left: 48, width: 220 },
          cornerPoints: [
            { y: 112, x: 48 },
            { y: 112, x: 268 },
            { y: 147, x: 268 },
            { y: 147, x: 48 },
          ],
          text: 'filet de poulet',
          elements: [
            {
              frame: { top: 112, height: 35, left: 48, width: 61 },
              cornerPoints: [
                { y: 112, x: 48 },
                { y: 112, x: 109 },
                { y: 147, x: 109 },
                { y: 147, x: 48 },
              ],
              text: 'filet',
            },
            {
              frame: { top: 112, height: 35, left: 127, width: 29 },
              cornerPoints: [
                { y: 112, x: 127 },
                { y: 112, x: 156 },
                { y: 147, x: 156 },
                { y: 147, x: 127 },
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
        },
        {
          recognizedLanguages: [{ languageCode: 'en' }],
          frame: { top: 159, height: 35, left: 34, width: 255 },
          cornerPoints: [
            { y: 159, x: 34 },
            { y: 159, x: 289 },
            { y: 194, x: 289 },
            { y: 194, x: 34 },
          ],
          text: 'gingembre (cm)',
          elements: [
            {
              frame: { top: 159, height: 35, left: 34, width: 177 },
              cornerPoints: [
                { y: 159, x: 34 },
                { y: 159, x: 211 },
                { y: 194, x: 211 },
                { y: 194, x: 34 },
              ],
              text: 'gingembre',
            },
            {
              frame: { top: 159, height: 35, left: 219, width: 70 },
              cornerPoints: [
                { y: 159, x: 219 },
                { y: 159, x: 289 },
                { y: 194, x: 289 },
                { y: 194, x: 219 },
              ],
              text: '(cm)',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 203, height: 37, left: 31, width: 187 },
          cornerPoints: [
            { y: 210, x: 31 },
            { y: 203, x: 217 },
            { y: 233, x: 218 },
            { y: 240, x: 32 },
          ],
          text: "goussed'ail",
          elements: [
            {
              frame: { top: 203, height: 37, left: 31, width: 187 },
              cornerPoints: [
                { y: 210, x: 31 },
                { y: 203, x: 217 },
                { y: 233, x: 218 },
                { y: 240, x: 32 },
              ],
              text: "goussed'ail",
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 252, height: 34, left: 29, width: 263 },
      cornerPoints: [
        { y: 252, x: 29 },
        { y: 252, x: 292 },
        { y: 286, x: 292 },
        { y: 286, x: 29 },
      ],
      text: 'lait de cOco (mL)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'es' }],
          frame: { top: 252, height: 34, left: 29, width: 263 },
          cornerPoints: [
            { y: 252, x: 29 },
            { y: 252, x: 292 },
            { y: 286, x: 292 },
            { y: 286, x: 29 },
          ],
          text: 'lait de cOco (mL)',
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
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 301, height: 33, left: 24, width: 209 },
      cornerPoints: [
        { y: 301, x: 24 },
        { y: 301, x: 233 },
        { y: 334, x: 233 },
        { y: 334, x: 24 },
      ],
      text: 'oignon jaune',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 301, height: 33, left: 24, width: 209 },
          cornerPoints: [
            { y: 301, x: 24 },
            { y: 301, x: 233 },
            { y: 334, x: 233 },
            { y: 334, x: 24 },
          ],
          text: 'oignon jaune',
          elements: [
            {
              frame: { top: 301, height: 33, left: 24, width: 110 },
              cornerPoints: [
                { y: 301, x: 24 },
                { y: 301, x: 134 },
                { y: 334, x: 134 },
                { y: 334, x: 24 },
              ],
              text: 'oignon',
            },
            {
              frame: { top: 301, height: 33, left: 140, width: 93 },
              cornerPoints: [
                { y: 301, x: 140 },
                { y: 301, x: 233 },
                { y: 334, x: 233 },
                { y: 334, x: 140 },
              ],
              text: 'jaune',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 349, height: 32, left: 17, width: 264 },
      cornerPoints: [
        { y: 349, x: 17 },
        { y: 349, x: 281 },
        { y: 381, x: 281 },
        { y: 381, x: 17 },
      ],
      text: 'oignon nouveau',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 349, height: 32, left: 17, width: 264 },
          cornerPoints: [
            { y: 349, x: 17 },
            { y: 349, x: 281 },
            { y: 381, x: 281 },
            { y: 381, x: 17 },
          ],
          text: 'oignon nouveau',
          elements: [
            {
              frame: { top: 349, height: 32, left: 17, width: 112 },
              cornerPoints: [
                { y: 349, x: 17 },
                { y: 349, x: 129 },
                { y: 381, x: 129 },
                { y: 381, x: 17 },
              ],
              text: 'oignon',
            },
            {
              frame: { top: 349, height: 32, left: 138, width: 143 },
              cornerPoints: [
                { y: 349, x: 138 },
                { y: 349, x: 281 },
                { y: 381, x: 281 },
                { y: 381, x: 138 },
              ],
              text: 'nouveau',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 394, height: 34, left: 14, width: 300 },
      cornerPoints: [
        { y: 394, x: 14 },
        { y: 394, x: 314 },
        { y: 428, x: 314 },
        { y: 428, x: 14 },
      ],
      text: 'riz basmati (g) Bio',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'tr' }],
          frame: { top: 394, height: 34, left: 14, width: 300 },
          cornerPoints: [
            { y: 394, x: 14 },
            { y: 394, x: 314 },
            { y: 428, x: 314 },
            { y: 428, x: 14 },
          ],
          text: 'riz basmati (g) Bio',
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
        },
      ],
    },
  ],
};

export const quantitiesOcrResult: TextRecognitionResult = {
  text: '8',
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 65, height: 20, left: 139, width: 58 },
      cornerPoints: [
        { y: 70, x: 197 },
        { y: 85, x: 195 },
        { y: 80, x: 139 },
        { y: 65, x: 141 },
      ],
      text: '8',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 65, height: 20, left: 139, width: 58 },
          cornerPoints: [
            { y: 70, x: 197 },
            { y: 85, x: 195 },
            { y: 80, x: 139 },
            { y: 65, x: 141 },
          ],
          text: '8',
          elements: [
            {
              frame: { top: 65, height: 20, left: 139, width: 58 },
              cornerPoints: [
                { y: 70, x: 197 },
                { y: 85, x: 195 },
                { y: 80, x: 139 },
                { y: 65, x: 141 },
              ],
              text: '8',
            },
          ],
        },
      ],
    },
  ],
};

export const expectedIngredientNames: FormIngredientElement[] = [
  { name: 'cacahuètes grillées', unit: 'g' },
  { name: 'concentré de tomates', unit: 'g' },
  { name: 'filet de poulet', unit: '' },
  { name: 'gingembre', unit: 'cm' },
  { name: "goussed'ail", unit: '' },
  { name: 'lait de cOco', unit: 'mL' },
  { name: 'oignon jaune', unit: '' },
  { name: 'oignon nouveau', unit: '' },
  { name: 'riz basmati  Bio', unit: 'g' },
];

export const expectedQuantities: string[] = ['8'];

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
  text: '100\n35\n2\n1\n1\n0.5\n150\n1à3\n200',
  blocks: [
    {
      recognizedLanguages: [],
      frame: { top: 36, width: 58, height: 25, left: 141 },
      cornerPoints: [
        { x: 141, y: 36 },
        { x: 199, y: 36 },
        { x: 199, y: 61 },
        { x: 141, y: 61 },
      ],
      text: '100',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 36, width: 58, height: 25, left: 141 },
          cornerPoints: [
            { x: 141, y: 36 },
            { x: 199, y: 36 },
            { x: 199, y: 61 },
            { x: 141, y: 61 },
          ],
          text: '100',
          elements: [
            {
              frame: { top: 36, width: 58, height: 25, left: 141 },
              cornerPoints: [
                { x: 141, y: 36 },
                { x: 199, y: 36 },
                { x: 199, y: 61 },
                { x: 141, y: 61 },
              ],
              text: '100',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 82, width: 39, height: 25, left: 145 },
      cornerPoints: [
        { x: 145, y: 82 },
        { x: 184, y: 82 },
        { x: 184, y: 107 },
        { x: 145, y: 107 },
      ],
      text: '35',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 82, width: 39, height: 25, left: 145 },
          cornerPoints: [
            { x: 145, y: 82 },
            { x: 184, y: 82 },
            { x: 184, y: 107 },
            { x: 145, y: 107 },
          ],
          text: '35',
          elements: [
            {
              frame: { top: 82, width: 39, height: 25, left: 145 },
              cornerPoints: [
                { x: 145, y: 82 },
                { x: 184, y: 82 },
                { x: 184, y: 107 },
                { x: 145, y: 107 },
              ],
              text: '35',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 126, width: 67, height: 314, left: 116 },
      cornerPoints: [
        { x: 123, y: 126 },
        { x: 182.98846435546875, y: 127.17646789550781 },
        { x: 176.87081909179688, y: 439.11651611328125 },
        { x: 116.88235473632812, y: 437.9400329589844 },
      ],
      text: '2\n1\n1\n0.5\n150',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 127, width: 19, height: 27, left: 152 },
          cornerPoints: [
            { x: 153, y: 127 },
            { x: 170.9965362548828, y: 127.35294342041016 },
            { x: 170.48672485351562, y: 153.3479461669922 },
            { x: 152.49020385742188, y: 152.9949951171875 },
          ],
          text: '2',
          elements: [
            {
              frame: { top: 127, width: 19, height: 27, left: 152 },
              cornerPoints: [
                { x: 153, y: 127 },
                { x: 170.9965362548828, y: 127.35294342041016 },
                { x: 170.48672485351562, y: 153.3479461669922 },
                { x: 152.49020385742188, y: 152.9949951171875 },
              ],
              text: '2',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 222, width: 17, height: 26, left: 148 },
          cornerPoints: [
            { x: 149, y: 222 },
            { x: 164.99691772460938, y: 222.313720703125 },
            { x: 164.50672912597656, y: 247.3089141845703 },
            { x: 148.5098114013672, y: 246.9951934814453 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 222, width: 17, height: 26, left: 148 },
              cornerPoints: [
                { x: 149, y: 222 },
                { x: 164.99691772460938, y: 222.313720703125 },
                { x: 164.50672912597656, y: 247.3089141845703 },
                { x: 148.5098114013672, y: 246.9951934814453 },
              ],
              text: '1',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 316, width: 18, height: 28, left: 140 },
          cornerPoints: [
            { x: 140, y: 318 },
            { x: 154.92401123046875, y: 316.49200439453125 },
            { x: 157.53785705566406, y: 342.36029052734375 },
            { x: 142.6138458251953, y: 343.8682861328125 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 316, width: 18, height: 28, left: 140 },
              cornerPoints: [
                { x: 140, y: 318 },
                { x: 154.92401123046875, y: 316.49200439453125 },
                { x: 157.53785705566406, y: 342.36029052734375 },
                { x: 142.6138458251953, y: 343.8682861328125 },
              ],
              text: '1',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 362, width: 50, height: 29, left: 121 },
          cornerPoints: [
            { x: 122, y: 362 },
            { x: 170.9840850830078, y: 363.2490234375 },
            { x: 170.2958526611328, y: 390.2402648925781 },
            { x: 121.31175994873047, y: 388.9912414550781 },
          ],
          text: '0.5',
          elements: [
            {
              frame: { top: 362, width: 50, height: 29, left: 121 },
              cornerPoints: [
                { x: 122, y: 362 },
                { x: 170.9840850830078, y: 363.2490234375 },
                { x: 170.2958526611328, y: 390.2402648925781 },
                { x: 121.31175994873047, y: 388.9912414550781 },
              ],
              text: '0.5',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 410, width: 62, height: 30, left: 115 },
          cornerPoints: [
            { x: 116, y: 410 },
            { x: 176.97702026367188, y: 411.67449951171875 },
            { x: 176.20838928222656, y: 439.6639404296875 },
            { x: 115.23136901855469, y: 437.98944091796875 },
          ],
          text: '150',
          elements: [
            {
              frame: { top: 410, width: 62, height: 30, left: 115 },
              cornerPoints: [
                { x: 116, y: 410 },
                { x: 176.97702026367188, y: 411.67449951171875 },
                { x: 176.20838928222656, y: 439.6639404296875 },
                { x: 115.23136901855469, y: 437.98944091796875 },
              ],
              text: '150',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 173, width: 73, height: 29, left: 124 },
      cornerPoints: [
        { x: 124, y: 175 },
        { x: 195.98361206054688, y: 173.46417236328125 },
        { x: 196.55955505371094, y: 200.45802307128906 },
        { x: 124.57593536376953, y: 201.9938507080078 },
      ],
      text: '1à3',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 173, width: 73, height: 29, left: 124 },
          cornerPoints: [
            { x: 124, y: 175 },
            { x: 195.98361206054688, y: 173.46417236328125 },
            { x: 196.55955505371094, y: 200.45802307128906 },
            { x: 124.57593536376953, y: 201.9938507080078 },
          ],
          text: '1à3',
          elements: [
            {
              frame: { top: 173, width: 73, height: 29, left: 124 },
              cornerPoints: [
                { x: 124, y: 175 },
                { x: 195.98361206054688, y: 173.46417236328125 },
                { x: 196.55955505371094, y: 200.45802307128906 },
                { x: 124.57593536376953, y: 201.9938507080078 },
              ],
              text: '1à3',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 265, width: 64, height: 31, left: 121 },
      cornerPoints: [
        { x: 121, y: 267 },
        { x: 183.9897918701172, y: 265.8659362792969 },
        { x: 184.51182556152344, y: 294.8612365722656 },
        { x: 121.52203369140625, y: 295.99530029296875 },
      ],
      text: '200',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 265, width: 64, height: 31, left: 121 },
          cornerPoints: [
            { x: 121, y: 267 },
            { x: 183.9897918701172, y: 265.8659362792969 },
            { x: 184.51182556152344, y: 294.8612365722656 },
            { x: 121.52203369140625, y: 295.99530029296875 },
          ],
          text: '200',
          elements: [
            {
              frame: { top: 265, width: 64, height: 31, left: 121 },
              cornerPoints: [
                { x: 121, y: 267 },
                { x: 183.9897918701172, y: 265.8659362792969 },
                { x: 184.51182556152344, y: 294.8612365722656 },
                { x: 121.52203369140625, y: 295.99530029296875 },
              ],
              text: '200',
            },
          ],
        },
      ],
    },
  ],
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
