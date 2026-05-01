/* eslint-disable no-loss-of-precision */
import { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { FormIngredientElement } from '@customTypes/DatabaseElementTypes';

export const iosNamesOcrResult: TextRecognitionResult = {
  text: 'Riz basmati\nOignon jaune\nCarotte"\nPoireau*\nCiboulette*\nGousse d\'ail\nGingembre frais\nSauce soja 11) 13) 15)\nHuile de sésame 3)\nFilet de poulet"\nGomasio 3)',
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'tr' }],
      frame: { top: 24, width: 138, height: 23, left: 51 },
      cornerPoints: [
        { x: 51, y: 27 },
        { x: 187.98248291015625, y: 24.809314727783203 },
        { x: 188.3022918701172, y: 44.80675506591797 },
        { x: 51.31980895996094, y: 46.99744415283203 },
      ],
      text: 'Riz basmati',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'tr' }],
          frame: { top: 24, width: 138, height: 23, left: 51 },
          cornerPoints: [
            { x: 51, y: 27 },
            { x: 187.98248291015625, y: 24.809314727783203 },
            { x: 188.3022918701172, y: 44.80675506591797 },
            { x: 51.31980895996094, y: 46.99744415283203 },
          ],
          text: 'Riz basmati',
          elements: [
            {
              frame: { top: 27, width: 34, height: 20, left: 51 },
              cornerPoints: [
                { x: 51, y: 28 },
                { x: 83.99578094482422, y: 27.47231674194336 },
                { x: 84.29959869384766, y: 46.469886779785156 },
                { x: 51.30381774902344, y: 46.9975700378418 },
              ],
              text: 'Riz',
            },
            {
              frame: { top: 24, width: 97, height: 21, left: 92 },
              cornerPoints: [
                { x: 92, y: 26 },
                { x: 187.98773193359375, y: 24.464920043945312 },
                { x: 188.2915496826172, y: 43.46249008178711 },
                { x: 92.30381774902344, y: 44.9975700378418 },
              ],
              text: 'basmati',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 69, width: 160, height: 30, left: 46 },
      cornerPoints: [
        { x: 46, y: 73 },
        { x: 204.95411682128906, y: 69.18061065673828 },
        { x: 205.57867431640625, y: 95.17311096191406 },
        { x: 46.62455368041992, y: 98.99250030517578 },
      ],
      text: 'Oignon jaune',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 69, width: 160, height: 30, left: 46 },
          cornerPoints: [
            { x: 46, y: 73 },
            { x: 204.95411682128906, y: 69.18061065673828 },
            { x: 205.57867431640625, y: 95.17311096191406 },
            { x: 46.62455368041992, y: 98.99250030517578 },
          ],
          text: 'Oignon jaune',
          elements: [
            {
              frame: { top: 70, width: 85, height: 29, left: 46 },
              cornerPoints: [
                { x: 46, y: 73 },
                { x: 129.97576904296875, y: 70.98220825195312 },
                { x: 130.60032653808594, y: 96.9747085571289 },
                { x: 46.62455368041992, y: 98.99250030517578 },
              ],
              text: 'Oignon',
            },
            {
              frame: { top: 70, width: 71, height: 27, left: 135 },
              cornerPoints: [
                { x: 135, y: 72 },
                { x: 204.97979736328125, y: 70.3185043334961 },
                { x: 205.58033752441406, y: 95.31129455566406 },
                { x: 135.6005401611328, y: 96.99278259277344 },
              ],
              text: 'jaune',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'it' }],
      frame: { top: 117, width: 100, height: 22, left: 42 },
      cornerPoints: [
        { x: 42, y: 119 },
        { x: 140.98484802246094, y: 117.26802825927734 },
        { x: 141.33474731445312, y: 137.2649688720703 },
        { x: 42.349891662597656, y: 138.99693298339844 },
      ],
      text: 'Carotte"',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'it' }],
          frame: { top: 117, width: 100, height: 22, left: 42 },
          cornerPoints: [
            { x: 42, y: 119 },
            { x: 140.98484802246094, y: 117.26802825927734 },
            { x: 141.33474731445312, y: 137.2649688720703 },
            { x: 42.349891662597656, y: 138.99693298339844 },
          ],
          text: 'Carotte"',
          elements: [
            {
              frame: { top: 117, width: 100, height: 22, left: 42 },
              cornerPoints: [
                { x: 42, y: 119 },
                { x: 140.98484802246094, y: 117.26802825927734 },
                { x: 141.33474731445312, y: 137.2649688720703 },
                { x: 42.349891662597656, y: 138.99693298339844 },
              ],
              text: 'Carotte"',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 164, width: 103, height: 21, left: 38 },
      cornerPoints: [
        { x: 38, y: 166 },
        { x: 139.99191284179688, y: 164.71487426757812 },
        { x: 140.23129272460938, y: 183.71336364746094 },
        { x: 38.23938751220703, y: 184.9984893798828 },
      ],
      text: 'Poireau*',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 164, width: 103, height: 21, left: 38 },
          cornerPoints: [
            { x: 38, y: 166 },
            { x: 139.99191284179688, y: 164.71487426757812 },
            { x: 140.23129272460938, y: 183.71336364746094 },
            { x: 38.23938751220703, y: 184.9984893798828 },
          ],
          text: 'Poireau*',
          elements: [
            {
              frame: { top: 164, width: 103, height: 21, left: 38 },
              cornerPoints: [
                { x: 38, y: 166 },
                { x: 139.99191284179688, y: 164.71487426757812 },
                { x: 140.23129272460938, y: 183.71336364746094 },
                { x: 38.23938751220703, y: 184.9984893798828 },
              ],
              text: 'Poireau*',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 209, width: 134, height: 24, left: 34 },
      cornerPoints: [
        { x: 34, y: 212 },
        { x: 166.971435546875, y: 209.24327087402344 },
        { x: 167.40670776367188, y: 230.23875427246094 },
        { x: 34.435272216796875, y: 232.9954833984375 },
      ],
      text: 'Ciboulette*',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 209, width: 134, height: 24, left: 34 },
          cornerPoints: [
            { x: 34, y: 212 },
            { x: 166.971435546875, y: 209.24327087402344 },
            { x: 167.40670776367188, y: 230.23875427246094 },
            { x: 34.435272216796875, y: 232.9954833984375 },
          ],
          text: 'Ciboulette*',
          elements: [
            {
              frame: { top: 209, width: 134, height: 24, left: 34 },
              cornerPoints: [
                { x: 34, y: 212 },
                { x: 166.971435546875, y: 209.24327087402344 },
                { x: 167.40670776367188, y: 230.23875427246094 },
                { x: 34.435272216796875, y: 232.9954833984375 },
              ],
              text: 'Ciboulette*',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 256, width: 146, height: 24, left: 31 },
      cornerPoints: [
        { x: 31, y: 258 },
        { x: 175.9927978515625, y: 256.5547180175781 },
        { x: 176.2120819091797, y: 278.5536193847656 },
        { x: 31.219284057617188, y: 279.9989013671875 },
      ],
      text: "Gousse d'ail",
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 256, width: 146, height: 24, left: 31 },
          cornerPoints: [
            { x: 31, y: 258 },
            { x: 175.9927978515625, y: 256.5547180175781 },
            { x: 176.2120819091797, y: 278.5536193847656 },
            { x: 31.219284057617188, y: 279.9989013671875 },
          ],
          text: "Gousse d'ail",
          elements: [
            {
              frame: { top: 260, width: 87, height: 20, left: 31 },
              cornerPoints: [
                { x: 31, y: 261 },
                { x: 116.9957275390625, y: 260.1427917480469 },
                { x: 117.18511199951172, y: 279.141845703125 },
                { x: 31.189380645751953, y: 279.9990539550781 },
              ],
              text: 'Gousse',
            },
            {
              frame: { top: 256, width: 51, height: 23, left: 126 },
              cornerPoints: [
                { x: 126, y: 257 },
                { x: 175.9975128173828, y: 256.5016174316406 },
                { x: 176.216796875, y: 278.5005187988281 },
                { x: 126.21928405761719, y: 278.9989013671875 },
              ],
              text: "d'ail",
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 299, width: 194, height: 39, left: 28 },
      cornerPoints: [
        { x: 28, y: 305 },
        { x: 220.92880249023438, y: 299.7580261230469 },
        { x: 221.82510375976562, y: 332.745849609375 },
        { x: 28.89629554748535, y: 337.9878234863281 },
      ],
      text: 'Gingembre frais',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 299, width: 194, height: 39, left: 28 },
          cornerPoints: [
            { x: 28, y: 305 },
            { x: 220.92880249023438, y: 299.7580261230469 },
            { x: 221.82510375976562, y: 332.745849609375 },
            { x: 28.89629554748535, y: 337.9878234863281 },
          ],
          text: 'Gingembre frais',
          elements: [
            {
              frame: { top: 304, width: 134, height: 31, left: 28 },
              cornerPoints: [
                { x: 28, y: 308 },
                { x: 160.95094299316406, y: 304.3876647949219 },
                { x: 161.6842803955078, y: 331.3777160644531 },
                { x: 28.73333168029785, y: 334.99005126953125 },
              ],
              text: 'Gingembre',
            },
            {
              frame: { top: 300, width: 59, height: 34, left: 163 },
              cornerPoints: [
                { x: 163, y: 302 },
                { x: 220.97860717773438, y: 300.4246826171875 },
                { x: 221.84774780273438, y: 332.4128723144531 },
                { x: 163.869140625, y: 333.9881896972656 },
              ],
              text: 'frais',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fi' }],
      frame: { top: 351, width: 267, height: 80, left: 25 },
      cornerPoints: [
        { x: 25, y: 355 },
        { x: 290.9779968261719, y: 351.5802917480469 },
        { x: 291.9550476074219, y: 427.5740051269531 },
        { x: 25.977060317993164, y: 430.99371337890625 },
      ],
      text: 'Sauce soja 11) 13) 15)\nHuile de sésame 3)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fi' }],
          frame: { top: 351, width: 267, height: 32, left: 25 },
          cornerPoints: [
            { x: 25, y: 355 },
            { x: 290.9779968261719, y: 351.5802917480469 },
            { x: 291.33795166015625, y: 379.5779724121094 },
            { x: 25.359970092773438, y: 382.9976806640625 },
          ],
          text: 'Sauce soja 11) 13) 15)',
          elements: [
            {
              frame: { top: 357, width: 73, height: 21, left: 25 },
              cornerPoints: [
                { x: 25, y: 358 },
                { x: 96.99404907226562, y: 357.0743713378906 },
                { x: 97.25116729736328, y: 377.0727233886719 },
                { x: 25.257122039794922, y: 377.99835205078125 },
              ],
              text: 'Sauce',
            },
            {
              frame: { top: 354, width: 49, height: 28, left: 105 },
              cornerPoints: [
                { x: 105, y: 355 },
                { x: 152.99603271484375, y: 354.3829040527344 },
                { x: 153.3431396484375, y: 381.38067626953125 },
                { x: 105.34711456298828, y: 381.9977722167969 },
              ],
              text: 'soja',
            },
            {
              frame: { top: 353, width: 37, height: 27, left: 163 },
              cornerPoints: [
                { x: 163, y: 354 },
                { x: 198.9970245361328, y: 353.53717041015625 },
                { x: 199.33128356933594, y: 379.5350341796875 },
                { x: 163.33425903320312, y: 379.99786376953125 },
              ],
              text: '11)',
            },
            {
              frame: { top: 352, width: 38, height: 28, left: 208 },
              cornerPoints: [
                { x: 208, y: 353 },
                { x: 244.9969482421875, y: 352.5243225097656 },
                { x: 245.34405517578125, y: 379.5220947265625 },
                { x: 208.34710693359375, y: 379.9977722167969 },
              ],
              text: '13)',
            },
            {
              frame: { top: 351, width: 38, height: 28, left: 254 },
              cornerPoints: [
                { x: 254, y: 352 },
                { x: 290.9969482421875, y: 351.5243225097656 },
                { x: 291.34405517578125, y: 378.5220947265625 },
                { x: 254.34710693359375, y: 378.9977722167969 },
              ],
              text: '15)',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 402, width: 227, height: 26, left: 25 },
          cornerPoints: [
            { x: 25, y: 402 },
            { x: 252, y: 402 },
            { x: 252, y: 428 },
            { x: 25, y: 428 },
          ],
          text: 'Huile de sésame 3)',
          elements: [
            {
              frame: { top: 405, width: 61, height: 22, left: 25 },
              cornerPoints: [
                { x: 25, y: 405 },
                { x: 86, y: 405 },
                { x: 86, y: 427 },
                { x: 25, y: 427 },
              ],
              text: 'Huile',
            },
            {
              frame: { top: 404, width: 29, height: 21, left: 94 },
              cornerPoints: [
                { x: 94, y: 404 },
                { x: 123, y: 404 },
                { x: 123, y: 425 },
                { x: 94, y: 425 },
              ],
              text: 'de',
            },
            {
              frame: { top: 404, width: 93, height: 21, left: 130 },
              cornerPoints: [
                { x: 130, y: 404 },
                { x: 223, y: 404 },
                { x: 223, y: 425 },
                { x: 130, y: 425 },
              ],
              text: 'sésame',
            },
            {
              frame: { top: 402, width: 22, height: 26, left: 230 },
              cornerPoints: [
                { x: 230, y: 402 },
                { x: 252, y: 402 },
                { x: 252, y: 428 },
                { x: 230, y: 428 },
              ],
              text: '3)',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 451, width: 186, height: 31, left: 24 },
      cornerPoints: [
        { x: 24, y: 454 },
        { x: 208.98483276367188, y: 451.630615234375 },
        { x: 209.34344482421875, y: 479.6283264160156 },
        { x: 24.358610153198242, y: 481.9977111816406 },
      ],
      text: 'Filet de poulet"',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 451, width: 186, height: 31, left: 24 },
          cornerPoints: [
            { x: 24, y: 454 },
            { x: 208.98483276367188, y: 451.630615234375 },
            { x: 209.34344482421875, y: 479.6283264160156 },
            { x: 24.358610153198242, y: 481.9977111816406 },
          ],
          text: 'Filet de poulet"',
          elements: [
            {
              frame: { top: 453, width: 52, height: 23, left: 24 },
              cornerPoints: [
                { x: 24, y: 454 },
                { x: 74.99581909179688, y: 453.3468017578125 },
                { x: 75.277587890625, y: 475.3450012207031 },
                { x: 24.28176498413086, y: 475.9981994628906 },
              ],
              text: 'Filet',
            },
            {
              frame: { top: 453, width: 28, height: 22, left: 83 },
              cornerPoints: [
                { x: 83, y: 454 },
                { x: 109.99778747558594, y: 453.6542053222656 },
                { x: 110.2667465209961, y: 474.6524963378906 },
                { x: 83.26895904541016, y: 474.998291015625 },
              ],
              text: 'de',
            },
            {
              frame: { top: 451, width: 90, height: 30, left: 120 },
              cornerPoints: [
                { x: 120, y: 453 },
                { x: 208.99270629882812, y: 451.8601379394531 },
                { x: 209.351318359375, y: 479.85784912109375 },
                { x: 120.35861206054688, y: 480.9977111816406 },
              ],
              text: 'poulet"',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'sw' }],
      frame: { top: 502, width: 134, height: 27, left: 23 },
      cornerPoints: [
        { x: 23, y: 502 },
        { x: 157, y: 502 },
        { x: 157, y: 529 },
        { x: 23, y: 529 },
      ],
      text: 'Gomasio 3)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'sw' }],
          frame: { top: 502, width: 134, height: 27, left: 23 },
          cornerPoints: [
            { x: 23, y: 502 },
            { x: 157, y: 502 },
            { x: 157, y: 529 },
            { x: 23, y: 529 },
          ],
          text: 'Gomasio 3)',
          elements: [
            {
              frame: { top: 504, width: 105, height: 22, left: 23 },
              cornerPoints: [
                { x: 23, y: 504 },
                { x: 128, y: 504 },
                { x: 128, y: 526 },
                { x: 23, y: 526 },
              ],
              text: 'Gomasio',
            },
            {
              frame: { top: 502, width: 21, height: 27, left: 136 },
              cornerPoints: [
                { x: 136, y: 502 },
                { x: 157, y: 502 },
                { x: 157, y: 529 },
                { x: 136, y: 529 },
              ],
              text: '3)',
            },
          ],
        },
      ],
    },
  ],
};

export const androidNamesOcrResult: TextRecognitionResult = {
  text: "Riz basmati\nOignon jaune\nCarotte\nPoireau\nCiboulette\nGousse d'ail\nGingembre frais\nSauce soja 11) 13) 15)\nHuile de sésame 3)\nFilet de poulet\nGomasio3)",
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 23, height: 25, left: 51, width: 136 },
      cornerPoints: [
        { y: 27, x: 51 },
        { y: 23, x: 187 },
        { y: 44, x: 187 },
        { y: 48, x: 51 },
      ],
      text: 'Riz basmati',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'tr' }],
          frame: { top: 23, height: 25, left: 51, width: 136 },
          cornerPoints: [
            { y: 27, x: 51 },
            { y: 23, x: 187 },
            { y: 44, x: 187 },
            { y: 48, x: 51 },
          ],
          text: 'Riz basmati',
          elements: [
            {
              frame: { top: 26, height: 22, left: 51, width: 32 },
              cornerPoints: [
                { y: 27, x: 51 },
                { y: 26, x: 83 },
                { y: 47, x: 83 },
                { y: 48, x: 51 },
              ],
              text: 'Riz',
            },
            {
              frame: { top: 23, height: 24, left: 91, width: 96 },
              cornerPoints: [
                { y: 26, x: 91 },
                { y: 23, x: 187 },
                { y: 44, x: 187 },
                { y: 47, x: 91 },
              ],
              text: 'basmati',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 72, height: 27, left: 47, width: 159 },
      cornerPoints: [
        { y: 72, x: 47 },
        { y: 72, x: 206 },
        { y: 99, x: 206 },
        { y: 99, x: 47 },
      ],
      text: 'Oignon jaune',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 72, height: 27, left: 47, width: 159 },
          cornerPoints: [
            { y: 72, x: 47 },
            { y: 72, x: 206 },
            { y: 99, x: 206 },
            { y: 99, x: 47 },
          ],
          text: 'Oignon jaune',
          elements: [
            {
              frame: { top: 72, height: 27, left: 47, width: 85 },
              cornerPoints: [
                { y: 72, x: 47 },
                { y: 72, x: 132 },
                { y: 99, x: 132 },
                { y: 99, x: 47 },
              ],
              text: 'Oignon',
            },
            {
              frame: { top: 72, height: 27, left: 136, width: 70 },
              cornerPoints: [
                { y: 72, x: 136 },
                { y: 72, x: 206 },
                { y: 99, x: 206 },
                { y: 99, x: 136 },
              ],
              text: 'jaune',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 113, height: 31, left: 54, width: 80 },
      cornerPoints: [
        { y: 116, x: 54 },
        { y: 113, x: 134 },
        { y: 141, x: 134 },
        { y: 144, x: 54 },
      ],
      text: 'Carotte',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'it' }],
          frame: { top: 113, height: 31, left: 54, width: 80 },
          cornerPoints: [
            { y: 116, x: 54 },
            { y: 113, x: 134 },
            { y: 141, x: 134 },
            { y: 144, x: 54 },
          ],
          text: 'Carotte',
          elements: [
            {
              frame: { top: 113, height: 31, left: 54, width: 80 },
              cornerPoints: [
                { y: 116, x: 54 },
                { y: 113, x: 134 },
                { y: 141, x: 134 },
                { y: 144, x: 54 },
              ],
              text: 'Carotte',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 162, height: 23, left: 39, width: 103 },
      cornerPoints: [
        { y: 164, x: 39 },
        { y: 162, x: 142 },
        { y: 183, x: 142 },
        { y: 185, x: 39 },
      ],
      text: 'Poireau',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 162, height: 23, left: 39, width: 103 },
          cornerPoints: [
            { y: 164, x: 39 },
            { y: 162, x: 142 },
            { y: 183, x: 142 },
            { y: 185, x: 39 },
          ],
          text: 'Poireau',
          elements: [
            {
              frame: { top: 162, height: 23, left: 39, width: 103 },
              cornerPoints: [
                { y: 164, x: 39 },
                { y: 162, x: 142 },
                { y: 183, x: 142 },
                { y: 185, x: 39 },
              ],
              text: 'Poireau',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 206, height: 31, left: 48, width: 116 },
      cornerPoints: [
        { y: 206, x: 48 },
        { y: 206, x: 164 },
        { y: 237, x: 164 },
        { y: 237, x: 48 },
      ],
      text: 'Ciboulette',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 206, height: 31, left: 48, width: 116 },
          cornerPoints: [
            { y: 206, x: 48 },
            { y: 206, x: 164 },
            { y: 237, x: 164 },
            { y: 237, x: 48 },
          ],
          text: 'Ciboulette',
          elements: [
            {
              frame: { top: 206, height: 31, left: 48, width: 116 },
              cornerPoints: [
                { y: 206, x: 48 },
                { y: 206, x: 164 },
                { y: 237, x: 164 },
                { y: 237, x: 48 },
              ],
              text: 'Ciboulette',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 255, height: 26, left: 30, width: 145 },
      cornerPoints: [
        { y: 259, x: 30 },
        { y: 255, x: 175 },
        { y: 277, x: 175 },
        { y: 281, x: 30 },
      ],
      text: "Gousse d'ail",
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 255, height: 26, left: 30, width: 145 },
          cornerPoints: [
            { y: 259, x: 30 },
            { y: 255, x: 175 },
            { y: 277, x: 175 },
            { y: 281, x: 30 },
          ],
          text: "Gousse d'ail",
          elements: [
            {
              frame: { top: 256, height: 25, left: 30, width: 86 },
              cornerPoints: [
                { y: 259, x: 30 },
                { y: 256, x: 116 },
                { y: 278, x: 116 },
                { y: 281, x: 30 },
              ],
              text: 'Gousse',
            },
            {
              frame: { top: 255, height: 23, left: 124, width: 51 },
              cornerPoints: [
                { y: 257, x: 124 },
                { y: 255, x: 175 },
                { y: 276, x: 175 },
                { y: 278, x: 124 },
              ],
              text: "d'ail",
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 298, height: 40, left: 28, width: 192 },
      cornerPoints: [
        { y: 304, x: 28 },
        { y: 298, x: 220 },
        { y: 332, x: 220 },
        { y: 338, x: 28 },
      ],
      text: 'Gingembre frais',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 298, height: 40, left: 28, width: 192 },
          cornerPoints: [
            { y: 304, x: 28 },
            { y: 298, x: 220 },
            { y: 332, x: 220 },
            { y: 338, x: 28 },
          ],
          text: 'Gingembre frais',
          elements: [
            {
              frame: { top: 300, height: 38, left: 28, width: 132 },
              cornerPoints: [
                { y: 304, x: 28 },
                { y: 300, x: 160 },
                { y: 334, x: 160 },
                { y: 338, x: 28 },
              ],
              text: 'Gingembre',
            },
            {
              frame: { top: 298, height: 36, left: 177, width: 43 },
              cornerPoints: [
                { y: 300, x: 177 },
                { y: 298, x: 220 },
                { y: 332, x: 220 },
                { y: 334, x: 177 },
              ],
              text: 'frais',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 349, height: 35, left: 25, width: 265 },
      cornerPoints: [
        { y: 354, x: 25 },
        { y: 349, x: 290 },
        { y: 379, x: 290 },
        { y: 384, x: 25 },
      ],
      text: 'Sauce soja 11) 13) 15)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fi' }],
          frame: { top: 349, height: 35, left: 25, width: 265 },
          cornerPoints: [
            { y: 354, x: 25 },
            { y: 349, x: 290 },
            { y: 379, x: 290 },
            { y: 384, x: 25 },
          ],
          text: 'Sauce soja 11) 13) 15)',
          elements: [
            {
              frame: { top: 352, height: 32, left: 25, width: 71 },
              cornerPoints: [
                { y: 354, x: 25 },
                { y: 352, x: 96 },
                { y: 382, x: 96 },
                { y: 384, x: 25 },
              ],
              text: 'Sauce',
            },
            {
              frame: { top: 352, height: 31, left: 104, width: 50 },
              cornerPoints: [
                { y: 353, x: 104 },
                { y: 352, x: 154 },
                { y: 382, x: 154 },
                { y: 383, x: 104 },
              ],
              text: 'soja',
            },
            {
              frame: { top: 351, height: 30, left: 162, width: 36 },
              cornerPoints: [
                { y: 352, x: 162 },
                { y: 351, x: 198 },
                { y: 380, x: 198 },
                { y: 381, x: 162 },
              ],
              text: '11)',
            },
            {
              frame: { top: 350, height: 31, left: 207, width: 36 },
              cornerPoints: [
                { y: 351, x: 207 },
                { y: 350, x: 243 },
                { y: 380, x: 243 },
                { y: 381, x: 207 },
              ],
              text: '13)',
            },
            {
              frame: { top: 349, height: 31, left: 253, width: 37 },
              cornerPoints: [
                { y: 350, x: 253 },
                { y: 349, x: 290 },
                { y: 379, x: 290 },
                { y: 380, x: 253 },
              ],
              text: '15)',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 400, height: 30, left: 25, width: 226 },
      cornerPoints: [
        { y: 403, x: 25 },
        { y: 400, x: 251 },
        { y: 427, x: 251 },
        { y: 430, x: 25 },
      ],
      text: 'Huile de sésame 3)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 400, height: 30, left: 25, width: 226 },
          cornerPoints: [
            { y: 403, x: 25 },
            { y: 400, x: 251 },
            { y: 427, x: 251 },
            { y: 430, x: 25 },
          ],
          text: 'Huile de sésame 3)',
          elements: [
            {
              frame: { top: 402, height: 28, left: 25, width: 60 },
              cornerPoints: [
                { y: 403, x: 25 },
                { y: 402, x: 85 },
                { y: 429, x: 85 },
                { y: 430, x: 25 },
              ],
              text: 'Huile',
            },
            {
              frame: { top: 402, height: 27, left: 93, width: 29 },
              cornerPoints: [
                { y: 403, x: 93 },
                { y: 402, x: 122 },
                { y: 428, x: 122 },
                { y: 429, x: 93 },
              ],
              text: 'de',
            },
            {
              frame: { top: 401, height: 28, left: 129, width: 92 },
              cornerPoints: [
                { y: 402, x: 129 },
                { y: 401, x: 221 },
                { y: 428, x: 221 },
                { y: 429, x: 129 },
              ],
              text: 'sésame',
            },
            {
              frame: { top: 400, height: 27, left: 228, width: 23 },
              cornerPoints: [
                { y: 401, x: 228 },
                { y: 400, x: 251 },
                { y: 426, x: 251 },
                { y: 427, x: 228 },
              ],
              text: '3)',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 447, height: 36, left: 24, width: 172 },
      cornerPoints: [
        { y: 450, x: 24 },
        { y: 447, x: 196 },
        { y: 480, x: 196 },
        { y: 483, x: 24 },
      ],
      text: 'Filet de poulet',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 447, height: 36, left: 24, width: 172 },
          cornerPoints: [
            { y: 450, x: 24 },
            { y: 447, x: 196 },
            { y: 480, x: 196 },
            { y: 483, x: 24 },
          ],
          text: 'Filet de poulet',
          elements: [
            {
              frame: { top: 449, height: 34, left: 24, width: 50 },
              cornerPoints: [
                { y: 450, x: 24 },
                { y: 449, x: 74 },
                { y: 482, x: 74 },
                { y: 483, x: 24 },
              ],
              text: 'Filet',
            },
            {
              frame: { top: 449, height: 33, left: 82, width: 28 },
              cornerPoints: [
                { y: 450, x: 82 },
                { y: 449, x: 110 },
                { y: 481, x: 110 },
                { y: 482, x: 82 },
              ],
              text: 'de',
            },
            {
              frame: { top: 448, height: 34, left: 124, width: 72 },
              cornerPoints: [
                { y: 449, x: 124 },
                { y: 448, x: 196 },
                { y: 481, x: 196 },
                { y: 482, x: 124 },
              ],
              text: 'poulet',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 502, height: 28, left: 23, width: 135 },
      cornerPoints: [
        { y: 502, x: 23 },
        { y: 502, x: 158 },
        { y: 530, x: 158 },
        { y: 530, x: 23 },
      ],
      text: 'Gomasio3)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'sw' }],
          frame: { top: 502, height: 28, left: 23, width: 135 },
          cornerPoints: [
            { y: 502, x: 23 },
            { y: 502, x: 158 },
            { y: 530, x: 158 },
            { y: 530, x: 23 },
          ],
          text: 'Gomasio3)',
          elements: [
            {
              frame: { top: 502, height: 28, left: 23, width: 135 },
              cornerPoints: [
                { y: 502, x: 23 },
                { y: 502, x: 158 },
                { y: 530, x: 158 },
                { y: 530, x: 23 },
              ],
              text: 'Gomasio3)',
            },
          ],
        },
      ],
    },
  ],
};

export const quantitiesOcrResult: TextRecognitionResult = {
  text: '140 g\n1 pièce\n1 pièce\n1 pièce\n3g\n1 pièce\n2 cm\n40 ml\n10 ml\n2 pièce\n2 cc',
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 10, height: 27, left: 58, width: 64 },
      cornerPoints: [
        { y: 10, x: 60 },
        { y: 13, x: 122 },
        { y: 37, x: 120 },
        { y: 34, x: 58 },
      ],
      text: '140 g',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 10, height: 27, left: 58, width: 64 },
          cornerPoints: [
            { y: 10, x: 60 },
            { y: 13, x: 122 },
            { y: 37, x: 120 },
            { y: 34, x: 58 },
          ],
          text: '140 g',
          elements: [
            {
              frame: { top: 10, height: 26, left: 58, width: 43 },
              cornerPoints: [
                { y: 10, x: 60 },
                { y: 12, x: 101 },
                { y: 36, x: 99 },
                { y: 34, x: 58 },
              ],
              text: '140',
            },
            {
              frame: { top: 14, height: 23, left: 108, width: 14 },
              cornerPoints: [
                { y: 14, x: 110 },
                { y: 14, x: 122 },
                { y: 37, x: 120 },
                { y: 37, x: 108 },
              ],
              text: 'g',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 54, height: 75, left: 46, width: 84 },
      cornerPoints: [
        { y: 55, x: 46 },
        { y: 54, x: 130 },
        { y: 128, x: 130 },
        { y: 129, x: 46 },
      ],
      text: '1 pièce\n1 pièce',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 54, height: 29, left: 46, width: 83 },
          cornerPoints: [
            { y: 55, x: 46 },
            { y: 54, x: 129 },
            { y: 82, x: 129 },
            { y: 83, x: 46 },
          ],
          text: '1 pièce',
          elements: [
            {
              frame: { top: 55, height: 28, left: 46, width: 11 },
              cornerPoints: [
                { y: 56, x: 46 },
                { y: 55, x: 57 },
                { y: 82, x: 57 },
                { y: 83, x: 46 },
              ],
              text: '1',
            },
            {
              frame: { top: 54, height: 29, left: 66, width: 63 },
              cornerPoints: [
                { y: 55, x: 66 },
                { y: 54, x: 129 },
                { y: 82, x: 129 },
                { y: 83, x: 66 },
              ],
              text: 'pièce',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 103, height: 27, left: 46, width: 85 },
          cornerPoints: [
            { y: 103, x: 46 },
            { y: 103, x: 131 },
            { y: 130, x: 131 },
            { y: 130, x: 46 },
          ],
          text: '1 pièce',
          elements: [
            {
              frame: { top: 103, height: 27, left: 46, width: 11 },
              cornerPoints: [
                { y: 103, x: 46 },
                { y: 103, x: 57 },
                { y: 130, x: 57 },
                { y: 130, x: 46 },
              ],
              text: '1',
            },
            {
              frame: { top: 103, height: 27, left: 66, width: 65 },
              cornerPoints: [
                { y: 103, x: 66 },
                { y: 103, x: 131 },
                { y: 130, x: 131 },
                { y: 130, x: 66 },
              ],
              text: 'pièce',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 149, height: 28, left: 44, width: 85 },
      cornerPoints: [
        { y: 149, x: 44 },
        { y: 149, x: 129 },
        { y: 177, x: 129 },
        { y: 177, x: 44 },
      ],
      text: '1 pièce',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 149, height: 28, left: 44, width: 85 },
          cornerPoints: [
            { y: 149, x: 44 },
            { y: 149, x: 129 },
            { y: 177, x: 129 },
            { y: 177, x: 44 },
          ],
          text: '1 pièce',
          elements: [
            {
              frame: { top: 149, height: 28, left: 44, width: 12 },
              cornerPoints: [
                { y: 149, x: 44 },
                { y: 149, x: 56 },
                { y: 177, x: 56 },
                { y: 177, x: 44 },
              ],
              text: '1',
            },
            {
              frame: { top: 149, height: 28, left: 65, width: 64 },
              cornerPoints: [
                { y: 149, x: 65 },
                { y: 149, x: 129 },
                { y: 177, x: 129 },
                { y: 177, x: 65 },
              ],
              text: 'pièce',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 199, height: 24, left: 67, width: 35 },
      cornerPoints: [
        { y: 199, x: 68 },
        { y: 199, x: 102 },
        { y: 223, x: 101 },
        { y: 223, x: 67 },
      ],
      text: '3g',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 199, height: 24, left: 67, width: 35 },
          cornerPoints: [
            { y: 199, x: 68 },
            { y: 199, x: 102 },
            { y: 223, x: 101 },
            { y: 223, x: 67 },
          ],
          text: '3g',
          elements: [
            {
              frame: { top: 199, height: 24, left: 67, width: 35 },
              cornerPoints: [
                { y: 199, x: 68 },
                { y: 199, x: 102 },
                { y: 223, x: 101 },
                { y: 223, x: 67 },
              ],
              text: '3g',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 244, height: 28, left: 42, width: 86 },
      cornerPoints: [
        { y: 244, x: 42 },
        { y: 244, x: 128 },
        { y: 272, x: 128 },
        { y: 272, x: 42 },
      ],
      text: '1 pièce',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 244, height: 28, left: 42, width: 86 },
          cornerPoints: [
            { y: 244, x: 42 },
            { y: 244, x: 128 },
            { y: 272, x: 128 },
            { y: 272, x: 42 },
          ],
          text: '1 pièce',
          elements: [
            {
              frame: { top: 244, height: 28, left: 42, width: 11 },
              cornerPoints: [
                { y: 244, x: 42 },
                { y: 244, x: 53 },
                { y: 272, x: 53 },
                { y: 272, x: 42 },
              ],
              text: '1',
            },
            {
              frame: { top: 244, height: 28, left: 63, width: 65 },
              cornerPoints: [
                { y: 244, x: 63 },
                { y: 244, x: 128 },
                { y: 272, x: 128 },
                { y: 272, x: 63 },
              ],
              text: 'pièce',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 295, height: 20, left: 54, width: 57 },
      cornerPoints: [
        { y: 295, x: 54 },
        { y: 295, x: 111 },
        { y: 315, x: 111 },
        { y: 315, x: 54 },
      ],
      text: '2 cm',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 295, height: 20, left: 54, width: 57 },
          cornerPoints: [
            { y: 295, x: 54 },
            { y: 295, x: 111 },
            { y: 315, x: 111 },
            { y: 315, x: 54 },
          ],
          text: '2 cm',
          elements: [
            {
              frame: { top: 295, height: 20, left: 54, width: 13 },
              cornerPoints: [
                { y: 295, x: 54 },
                { y: 295, x: 67 },
                { y: 315, x: 67 },
                { y: 315, x: 54 },
              ],
              text: '2',
            },
            {
              frame: { top: 295, height: 20, left: 76, width: 35 },
              cornerPoints: [
                { y: 295, x: 76 },
                { y: 295, x: 111 },
                { y: 315, x: 111 },
                { y: 315, x: 76 },
              ],
              text: 'cm',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 340, height: 23, left: 48, width: 68 },
      cornerPoints: [
        { y: 340, x: 48 },
        { y: 340, x: 116 },
        { y: 363, x: 116 },
        { y: 363, x: 48 },
      ],
      text: '40 ml',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 340, height: 23, left: 48, width: 68 },
          cornerPoints: [
            { y: 340, x: 48 },
            { y: 340, x: 116 },
            { y: 363, x: 116 },
            { y: 363, x: 48 },
          ],
          text: '40 ml',
          elements: [
            {
              frame: { top: 340, height: 23, left: 48, width: 29 },
              cornerPoints: [
                { y: 340, x: 48 },
                { y: 340, x: 77 },
                { y: 363, x: 77 },
                { y: 363, x: 48 },
              ],
              text: '40',
            },
            {
              frame: { top: 340, height: 23, left: 86, width: 30 },
              cornerPoints: [
                { y: 340, x: 86 },
                { y: 340, x: 116 },
                { y: 363, x: 116 },
                { y: 363, x: 86 },
              ],
              text: 'ml',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 390, height: 22, left: 49, width: 66 },
      cornerPoints: [
        { y: 390, x: 49 },
        { y: 390, x: 115 },
        { y: 412, x: 115 },
        { y: 412, x: 49 },
      ],
      text: '10 ml',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 390, height: 22, left: 49, width: 66 },
          cornerPoints: [
            { y: 390, x: 49 },
            { y: 390, x: 115 },
            { y: 412, x: 115 },
            { y: 412, x: 49 },
          ],
          text: '10 ml',
          elements: [
            {
              frame: { top: 390, height: 22, left: 49, width: 28 },
              cornerPoints: [
                { y: 390, x: 49 },
                { y: 390, x: 77 },
                { y: 412, x: 77 },
                { y: 412, x: 49 },
              ],
              text: '10',
            },
            {
              frame: { top: 390, height: 22, left: 86, width: 29 },
              cornerPoints: [
                { y: 390, x: 86 },
                { y: 390, x: 115 },
                { y: 412, x: 115 },
                { y: 412, x: 86 },
              ],
              text: 'ml',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 436, height: 32, left: 37, width: 87 },
      cornerPoints: [
        { y: 440, x: 37 },
        { y: 436, x: 123 },
        { y: 464, x: 124 },
        { y: 468, x: 38 },
      ],
      text: '2 pièce',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 436, height: 32, left: 37, width: 87 },
          cornerPoints: [
            { y: 440, x: 37 },
            { y: 436, x: 123 },
            { y: 464, x: 124 },
            { y: 468, x: 38 },
          ],
          text: '2 pièce',
          elements: [
            {
              frame: { top: 440, height: 28, left: 37, width: 13 },
              cornerPoints: [
                { y: 441, x: 37 },
                { y: 440, x: 49 },
                { y: 467, x: 50 },
                { y: 468, x: 38 },
              ],
              text: '2',
            },
            {
              frame: { top: 436, height: 31, left: 58, width: 66 },
              cornerPoints: [
                { y: 439, x: 58 },
                { y: 436, x: 123 },
                { y: 464, x: 124 },
                { y: 467, x: 59 },
              ],
              text: 'pièce',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 492, height: 19, left: 58, width: 47 },
      cornerPoints: [
        { y: 492, x: 58 },
        { y: 492, x: 105 },
        { y: 511, x: 105 },
        { y: 511, x: 58 },
      ],
      text: '2 cc',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 492, height: 19, left: 58, width: 47 },
          cornerPoints: [
            { y: 492, x: 58 },
            { y: 492, x: 105 },
            { y: 511, x: 105 },
            { y: 511, x: 58 },
          ],
          text: '2 cc',
          elements: [
            {
              frame: { top: 492, height: 19, left: 58, width: 12 },
              cornerPoints: [
                { y: 492, x: 58 },
                { y: 492, x: 70 },
                { y: 511, x: 70 },
                { y: 511, x: 58 },
              ],
              text: '2',
            },
            {
              frame: { top: 492, height: 19, left: 79, width: 26 },
              cornerPoints: [
                { y: 492, x: 79 },
                { y: 492, x: 105 },
                { y: 511, x: 105 },
                { y: 511, x: 79 },
              ],
              text: 'cc',
            },
          ],
        },
      ],
    },
  ],
};

export const expectedIngredientNames: FormIngredientElement[] = [
  { name: 'Riz basmati', unit: '' },
  { name: 'Oignon jaune', unit: '' },
  { name: 'Carotte', unit: '' },
  { name: 'Poireau', unit: '' },
  { name: 'Ciboulette', unit: '' },
  { name: "Gousse d'ail", unit: '' },
  { name: 'Gingembre frais', unit: '' },
  { name: 'Sauce soja 11) 13) 15)', unit: '' },
  { name: 'Huile de sésame 3)', unit: '' },
  { name: 'Filet de poulet', unit: '' },
  { name: 'Gomasio3)', unit: '' },
];

export const expectedQuantities: string[] = [
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
];

export const expectedIosIngredientNames: FormIngredientElement[] = [
  { name: 'Riz basmati', unit: '' },
  { name: 'Oignon jaune', unit: '' },
  { name: 'Carotte"', unit: '' },
  { name: 'Poireau*', unit: '' },
  { name: 'Ciboulette*', unit: '' },
  { name: "Gousse d'ail", unit: '' },
  { name: 'Gingembre frais', unit: '' },
  { name: 'Sauce soja 11) 13) 15)', unit: '' },
  { name: 'Huile de sésame 3)', unit: '' },
  { name: 'Filet de poulet"', unit: '' },
  { name: 'Gomasio 3)', unit: '' },
];

export const iosQuantitiesOcrResult: TextRecognitionResult = {
  text: '140 g\n1 pièce\n1 pièce\n1 pièce\n3g\n1 pièce\n2 cm\n2 cc\n40 ml\n10 ml\n2 pièce',
  blocks: [
    {
      recognizedLanguages: [],
      frame: { top: 13, width: 65, height: 25, left: 57 },
      cornerPoints: [
        { x: 59, y: 13 },
        { x: 121.91682434082031, y: 16.236270904541016 },
        { x: 120.83806610107422, y: 37.20854187011719 },
        { x: 57.921241760253906, y: 33.97227478027344 },
      ],
      text: '140 g',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 13, width: 65, height: 25, left: 57 },
          cornerPoints: [
            { x: 59, y: 13 },
            { x: 121.91682434082031, y: 16.236270904541016 },
            { x: 120.83806610107422, y: 37.20854187011719 },
            { x: 57.921241760253906, y: 33.97227478027344 },
          ],
          text: '140 g',
          elements: [
            {
              frame: { top: 13, width: 43, height: 21, left: 58 },
              cornerPoints: [
                { x: 59, y: 13 },
                { x: 100.94454956054688, y: 15.157514572143555 },
                { x: 100.0198974609375, y: 33.133750915527344 },
                { x: 58.07535171508789, y: 30.976234436035156 },
              ],
              text: '140',
            },
            {
              frame: { top: 17, width: 14, height: 21, left: 108 },
              cornerPoints: [
                { x: 110, y: 17 },
                { x: 121.9841537475586, y: 17.616432189941406 },
                { x: 120.9567642211914, y: 37.59002685546875 },
                { x: 108.97261047363281, y: 36.973594665527344 },
              ],
              text: 'g',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 56, width: 85, height: 26, left: 46 },
      cornerPoints: [
        { x: 46, y: 58 },
        { x: 129.9832763671875, y: 56.324432373046875 },
        { x: 130.46200561523438, y: 80.31965637207031 },
        { x: 46.47873306274414, y: 81.99522399902344 },
      ],
      text: '1 pièce',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 56, width: 85, height: 26, left: 46 },
          cornerPoints: [
            { x: 46, y: 58 },
            { x: 129.9832763671875, y: 56.324432373046875 },
            { x: 130.46200561523438, y: 80.31965637207031 },
            { x: 46.47873306274414, y: 81.99522399902344 },
          ],
          text: '1 pièce',
          elements: [
            {
              frame: { top: 59, width: 12, height: 18, left: 46 },
              cornerPoints: [
                { x: 46, y: 60 },
                { x: 56.99781036376953, y: 59.78057861328125 },
                { x: 57.3369140625, y: 76.7771987915039 },
                { x: 46.33910369873047, y: 76.99662017822266 },
              ],
              text: '1',
            },
            {
              frame: { top: 55, width: 64, height: 27, left: 67 },
              cornerPoints: [
                { x: 67, y: 57 },
                { x: 129.98745727539062, y: 55.743324279785156 },
                { x: 130.48614501953125, y: 80.73834991455078 },
                { x: 67.4986801147461, y: 81.99502563476562 },
              ],
              text: 'pièce',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 102, width: 85, height: 27, left: 45 },
      cornerPoints: [
        { x: 45, y: 104 },
        { x: 128.9873046875, y: 102.53910827636719 },
        { x: 129.42208862304688, y: 127.53532409667969 },
        { x: 45.43478775024414, y: 128.9962158203125 },
      ],
      text: '1 pièce',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 102, width: 85, height: 27, left: 45 },
          cornerPoints: [
            { x: 45, y: 104 },
            { x: 128.9873046875, y: 102.53910827636719 },
            { x: 129.42208862304688, y: 127.53532409667969 },
            { x: 45.43478775024414, y: 128.9962158203125 },
          ],
          text: '1 pièce',
          elements: [
            {
              frame: { top: 105, width: 12, height: 19, left: 45 },
              cornerPoints: [
                { x: 45, y: 106 },
                { x: 55.99833679199219, y: 105.8086929321289 },
                { x: 56.31138610839844, y: 123.80596923828125 },
                { x: 45.31304931640625, y: 123.99727630615234 },
              ],
              text: '1',
            },
            {
              frame: { top: 101, width: 65, height: 28, left: 65 },
              cornerPoints: [
                { x: 65, y: 103 },
                { x: 128.99032592773438, y: 101.8869400024414 },
                { x: 129.4425048828125, y: 127.88301086425781 },
                { x: 65.45217895507812, y: 128.99606323242188 },
              ],
              text: 'pièce',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 149, width: 84, height: 27, left: 44 },
      cornerPoints: [
        { x: 44, y: 149 },
        { x: 128, y: 149 },
        { x: 128, y: 176 },
        { x: 44, y: 176 },
      ],
      text: '1 pièce',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 149, width: 84, height: 27, left: 44 },
          cornerPoints: [
            { x: 44, y: 149 },
            { x: 128, y: 149 },
            { x: 128, y: 176 },
            { x: 44, y: 176 },
          ],
          text: '1 pièce',
          elements: [
            {
              frame: { top: 152, width: 11, height: 18, left: 44 },
              cornerPoints: [
                { x: 44, y: 152 },
                { x: 55, y: 152 },
                { x: 55, y: 170 },
                { x: 44, y: 170 },
              ],
              text: '1',
            },
            {
              frame: { top: 149, width: 63, height: 27, left: 65 },
              cornerPoints: [
                { x: 65, y: 149 },
                { x: 128, y: 149 },
                { x: 128, y: 176 },
                { x: 65, y: 176 },
              ],
              text: 'pièce',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 196, width: 126, height: 320, left: 13 },
      cornerPoints: [
        { x: 48, y: 196 },
        { x: 138.4361572265625, y: 206.11431884765625 },
        { x: 103.86961364746094, y: 515.1873779296875 },
        { x: 13.433460235595703, y: 505.07305908203125 },
      ],
      text: '3g\n1 pièce\n2 cm\n2 cc',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 198, width: 38, height: 27, left: 65 },
          cornerPoints: [
            { x: 68, y: 198 },
            { x: 102.78314208984375, y: 201.89012145996094 },
            { x: 100.22677612304688, y: 224.74761962890625 },
            { x: 65.44363403320312, y: 220.8574981689453 },
          ],
          text: '3g',
          elements: [
            {
              frame: { top: 198, width: 38, height: 27, left: 65 },
              cornerPoints: [
                { x: 68, y: 198 },
                { x: 102.78314208984375, y: 201.89012145996094 },
                { x: 100.22677612304688, y: 224.74761962890625 },
                { x: 65.44363403320312, y: 220.8574981689453 },
              ],
              text: '3g',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 243, width: 85, height: 28, left: 42 },
          cornerPoints: [
            { x: 42, y: 244 },
            { x: 125.99634552001953, y: 243.21664428710938 },
            { x: 126.24813842773438, y: 270.2154541015625 },
            { x: 42.251792907714844, y: 270.99884033203125 },
          ],
          text: '1 pièce',
          elements: [
            {
              frame: { top: 246, width: 11, height: 20, left: 42 },
              cornerPoints: [
                { x: 42, y: 247 },
                { x: 51.99956512451172, y: 246.90673828125 },
                { x: 52.176753997802734, y: 265.9059143066406 },
                { x: 42.177188873291016, y: 265.9991760253906 },
              ],
              text: '1',
            },
            {
              frame: { top: 243, width: 64, height: 28, left: 63 },
              cornerPoints: [
                { x: 63, y: 244 },
                { x: 125.99725341796875, y: 243.4124755859375 },
                { x: 126.2490463256836, y: 270.41131591796875 },
                { x: 63.251792907714844, y: 270.99884033203125 },
              ],
              text: 'pièce',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 295, width: 57, height: 21, left: 53 },
          cornerPoints: [
            { x: 54, y: 295 },
            { x: 109.98994445800781, y: 296.0615234375 },
            { x: 109.62979125976562, y: 315.05810546875 },
            { x: 53.63984298706055, y: 313.99658203125 },
          ],
          text: '2 cm',
          elements: [
            {
              frame: { top: 295, width: 14, height: 19, left: 53 },
              cornerPoints: [
                { x: 54, y: 295 },
                { x: 66.99766540527344, y: 295.2464294433594 },
                { x: 66.65646362304688, y: 313.2431945800781 },
                { x: 53.65879821777344, y: 312.99676513671875 },
              ],
              text: '2',
            },
            {
              frame: { top: 298, width: 35, height: 17, left: 75 },
              cornerPoints: [
                { x: 76, y: 298 },
                { x: 109.993896484375, y: 298.6445007324219 },
                { x: 109.69060516357422, y: 314.6416320800781 },
                { x: 75.69670867919922, y: 313.99713134765625 },
              ],
              text: 'cm',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 491, width: 47, height: 20, left: 57 },
          cornerPoints: [
            { x: 58, y: 491 },
            { x: 103.99681854248047, y: 491.54119873046875 },
            { x: 103.77328491210938, y: 510.5398864746094 },
            { x: 57.776466369628906, y: 509.9986877441406 },
          ],
          text: '2 cc',
          elements: [
            {
              frame: { top: 491, width: 13, height: 20, left: 57 },
              cornerPoints: [
                { x: 58, y: 491 },
                { x: 69.9991683959961, y: 491.14117431640625 },
                { x: 69.775634765625, y: 510.1398620605469 },
                { x: 57.776466369628906, y: 509.9986877441406 },
              ],
              text: '2',
            },
            {
              frame: { top: 495, width: 26, height: 16, left: 78 },
              cornerPoints: [
                { x: 79, y: 495 },
                { x: 103.9982681274414, y: 495.29412841796875 },
                { x: 103.82179260253906, y: 510.2930908203125 },
                { x: 78.82352447509766, y: 509.99896240234375 },
              ],
              text: 'cc',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 340, width: 67, height: 22, left: 48 },
      cornerPoints: [
        { x: 48, y: 340 },
        { x: 115, y: 340 },
        { x: 115, y: 362 },
        { x: 48, y: 362 },
      ],
      text: '40 ml',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 340, width: 67, height: 22, left: 48 },
          cornerPoints: [
            { x: 48, y: 340 },
            { x: 115, y: 340 },
            { x: 115, y: 362 },
            { x: 48, y: 362 },
          ],
          text: '40 ml',
          elements: [
            {
              frame: { top: 344, width: 28, height: 18, left: 48 },
              cornerPoints: [
                { x: 48, y: 344 },
                { x: 76, y: 344 },
                { x: 76, y: 362 },
                { x: 48, y: 362 },
              ],
              text: '40',
            },
            {
              frame: { top: 340, width: 29, height: 22, left: 86 },
              cornerPoints: [
                { x: 86, y: 340 },
                { x: 115, y: 340 },
                { x: 115, y: 362 },
                { x: 86, y: 362 },
              ],
              text: 'ml',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 390, width: 65, height: 21, left: 49 },
      cornerPoints: [
        { x: 49, y: 390 },
        { x: 114, y: 390 },
        { x: 114, y: 411 },
        { x: 49, y: 411 },
      ],
      text: '10 ml',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 390, width: 65, height: 21, left: 49 },
          cornerPoints: [
            { x: 49, y: 390 },
            { x: 114, y: 390 },
            { x: 114, y: 411 },
            { x: 49, y: 411 },
          ],
          text: '10 ml',
          elements: [
            {
              frame: { top: 393, width: 27, height: 18, left: 49 },
              cornerPoints: [
                { x: 49, y: 393 },
                { x: 76, y: 393 },
                { x: 76, y: 411 },
                { x: 49, y: 411 },
              ],
              text: '10',
            },
            {
              frame: { top: 390, width: 28, height: 21, left: 86 },
              cornerPoints: [
                { x: 86, y: 390 },
                { x: 114, y: 390 },
                { x: 114, y: 411 },
                { x: 86, y: 411 },
              ],
              text: 'ml',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 438, width: 87, height: 28, left: 38 },
      cornerPoints: [
        { x: 38, y: 440 },
        { x: 123.99053955078125, y: 438.7243957519531 },
        { x: 124.37619018554688, y: 464.7215270996094 },
        { x: 38.385650634765625, y: 465.99713134765625 },
      ],
      text: '2 pièce',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 438, width: 87, height: 28, left: 38 },
          cornerPoints: [
            { x: 38, y: 440 },
            { x: 123.99053955078125, y: 438.7243957519531 },
            { x: 124.37619018554688, y: 464.7215270996094 },
            { x: 38.385650634765625, y: 465.99713134765625 },
          ],
          text: '2 pièce',
          elements: [
            {
              frame: { top: 442, width: 12, height: 19, left: 38 },
              cornerPoints: [
                { x: 38, y: 443 },
                { x: 48.9987907409668, y: 442.83685302734375 },
                { x: 49.26578140258789, y: 460.8348693847656 },
                { x: 38.266990661621094, y: 460.9980163574219 },
              ],
              text: '2',
            },
            {
              frame: { top: 438, width: 66, height: 28, left: 59 },
              cornerPoints: [
                { x: 59, y: 439 },
                { x: 123.99285125732422, y: 438.0358581542969 },
                { x: 124.3933334350586, y: 465.03289794921875 },
                { x: 59.400482177734375, y: 465.9970397949219 },
              ],
              text: 'pièce',
            },
          ],
        },
      ],
    },
  ],
};

export const expectedIosQuantities: string[] = [
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
];
