/* eslint-disable no-loss-of-precision */
import { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { FormIngredientElement } from '@customTypes/DatabaseElementTypes';

export const iosNamesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      frame: { top: 24, width: 138, height: 23, left: 51 },
      cornerPoints: [
        { x: 51, y: 26 },
        { x: 187.99449157714844, y: 24.77161407470703 },
        { x: 188.1827850341797, y: 45.77077102661133 },
        { x: 51.18829345703125, y: 46.9991569519043 },
      ],
      recognizedLanguages: [{ languageCode: 'tr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 27, width: 34, height: 20, left: 51 },
              text: 'Riz',
              cornerPoints: [
                { x: 51, y: 28 },
                { x: 83.99867248535156, y: 27.704111099243164 },
                { x: 84.16902923583984, y: 46.703346252441406 },
                { x: 51.17036056518555, y: 46.999237060546875 },
              ],
            },
            {
              frame: { top: 25, width: 97, height: 21, left: 92 },
              text: 'basmati',
              cornerPoints: [
                { x: 92, y: 26 },
                { x: 187.9961395263672, y: 25.139232635498047 },
                { x: 188.1754608154297, y: 45.138427734375 },
                { x: 92.17932891845703, y: 45.99919891357422 },
              ],
            },
          ],
          frame: { top: 24, width: 138, height: 23, left: 51 },
          cornerPoints: [
            { x: 51, y: 26 },
            { x: 187.99449157714844, y: 24.77161407470703 },
            { x: 188.1827850341797, y: 45.77077102661133 },
            { x: 51.18829345703125, y: 46.9991569519043 },
          ],
          recognizedLanguages: [{ languageCode: 'tr' }],
          text: 'Riz basmati',
        },
      ],
      text: 'Riz basmati',
    },
    {
      frame: { top: 69, width: 160, height: 30, left: 46 },
      cornerPoints: [
        { x: 46, y: 73 },
        { x: 204.95391845703125, y: 69.17192077636719 },
        { x: 205.57989501953125, y: 95.16438293457031 },
        { x: 46.6259765625, y: 98.99246215820312 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 70, width: 85, height: 29, left: 46 },
              text: 'Oignon',
              cornerPoints: [
                { x: 46, y: 73 },
                { x: 129.97564697265625, y: 70.97761535644531 },
                { x: 130.60162353515625, y: 96.97007751464844 },
                { x: 46.6259765625, y: 98.99246215820312 },
              ],
            },
            {
              frame: { top: 70, width: 70, height: 27, left: 136 },
              text: 'jaune',
              cornerPoints: [
                { x: 136, y: 72 },
                { x: 204.98001098632812, y: 70.33876037597656 },
                { x: 205.5819091796875, y: 95.33151245117188 },
                { x: 136.60189819335938, y: 96.99275207519531 },
              ],
            },
          ],
          frame: { top: 69, width: 160, height: 30, left: 46 },
          cornerPoints: [
            { x: 46, y: 73 },
            { x: 204.95391845703125, y: 69.17192077636719 },
            { x: 205.57989501953125, y: 95.16438293457031 },
            { x: 46.6259765625, y: 98.99246215820312 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'Oignon jaune',
        },
      ],
      text: 'Oignon jaune',
    },
    {
      frame: { top: 117, width: 99, height: 23, left: 42 },
      cornerPoints: [
        { x: 42, y: 120 },
        { x: 139.9671630859375, y: 117.46342468261719 },
        { x: 140.48483276367188, y: 137.45672607421875 },
        { x: 42.51766586303711, y: 139.99330139160156 },
      ],
      recognizedLanguages: [{ languageCode: 'it' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 117, width: 99, height: 23, left: 42 },
              text: 'Carotte*',
              cornerPoints: [
                { x: 42, y: 120 },
                { x: 139.9671630859375, y: 117.46342468261719 },
                { x: 140.48483276367188, y: 137.45672607421875 },
                { x: 42.51766586303711, y: 139.99330139160156 },
              ],
            },
          ],
          frame: { top: 117, width: 99, height: 23, left: 42 },
          cornerPoints: [
            { x: 42, y: 120 },
            { x: 139.9671630859375, y: 117.46342468261719 },
            { x: 140.48483276367188, y: 137.45672607421875 },
            { x: 42.51766586303711, y: 139.99330139160156 },
          ],
          recognizedLanguages: [{ languageCode: 'it' }],
          text: 'Carotte*',
        },
      ],
      text: 'Carotte*',
    },
    {
      frame: { top: 163, width: 103, height: 23, left: 38 },
      cornerPoints: [
        { x: 38, y: 165 },
        { x: 139.9831085205078, y: 163.14393615722656 },
        { x: 140.365234375, y: 184.1404571533203 },
        { x: 38.38212966918945, y: 185.99652099609375 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 163, width: 103, height: 23, left: 38 },
              text: 'Poireau*',
              cornerPoints: [
                { x: 38, y: 165 },
                { x: 139.9831085205078, y: 163.14393615722656 },
                { x: 140.365234375, y: 184.1404571533203 },
                { x: 38.38212966918945, y: 185.99652099609375 },
              ],
            },
          ],
          frame: { top: 163, width: 103, height: 23, left: 38 },
          cornerPoints: [
            { x: 38, y: 165 },
            { x: 139.9831085205078, y: 163.14393615722656 },
            { x: 140.365234375, y: 184.1404571533203 },
            { x: 38.38212966918945, y: 185.99652099609375 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'Poireau*',
        },
      ],
      text: 'Poireau*',
    },
    {
      frame: { top: 208, width: 136, height: 26, left: 34 },
      cornerPoints: [
        { x: 34, y: 212 },
        { x: 168.94876098632812, y: 208.28118896484375 },
        { x: 169.55479431152344, y: 230.27284240722656 },
        { x: 34.60602951049805, y: 233.9916534423828 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 208, width: 136, height: 26, left: 34 },
              text: 'Ciboulette*',
              cornerPoints: [
                { x: 34, y: 212 },
                { x: 168.94876098632812, y: 208.28118896484375 },
                { x: 169.55479431152344, y: 230.27284240722656 },
                { x: 34.60602951049805, y: 233.9916534423828 },
              ],
            },
          ],
          frame: { top: 208, width: 136, height: 26, left: 34 },
          cornerPoints: [
            { x: 34, y: 212 },
            { x: 168.94876098632812, y: 208.28118896484375 },
            { x: 169.55479431152344, y: 230.27284240722656 },
            { x: 34.60602951049805, y: 233.9916534423828 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'Ciboulette*',
        },
      ],
      text: 'Ciboulette*',
    },
    {
      frame: { top: 256, width: 146, height: 25, left: 31 },
      cornerPoints: [
        { x: 31, y: 260 },
        { x: 175.96554565429688, y: 256.8390808105469 },
        { x: 176.42333984375, y: 277.8341064453125 },
        { x: 31.457786560058594, y: 280.9949951171875 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 260, width: 87, height: 21, left: 31 },
              text: 'Gousse',
              cornerPoints: [
                { x: 31, y: 262 },
                { x: 116.97956085205078, y: 260.125244140625 },
                { x: 117.39374542236328, y: 279.1207275390625 },
                { x: 31.414188385009766, y: 280.9954833984375 },
              ],
            },
            {
              frame: { top: 256, width: 51, height: 23, left: 126 },
              text: "d'ail",
              cornerPoints: [
                { x: 126, y: 258 },
                { x: 175.9881134033203, y: 256.9100341796875 },
                { x: 176.44590759277344, y: 277.905029296875 },
                { x: 126.4577865600586, y: 278.9949951171875 },
              ],
            },
          ],
          frame: { top: 256, width: 146, height: 25, left: 31 },
          cornerPoints: [
            { x: 31, y: 260 },
            { x: 175.96554565429688, y: 256.8390808105469 },
            { x: 176.42333984375, y: 277.8341064453125 },
            { x: 31.457786560058594, y: 280.9949951171875 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: "Gousse d'ail",
        },
      ],
      text: "Gousse d'ail",
    },
    {
      frame: { top: 299, width: 194, height: 39, left: 28 },
      cornerPoints: [
        { x: 28, y: 305 },
        { x: 220.9344024658203, y: 299.968505859375 },
        { x: 221.79470825195312, y: 332.957275390625 },
        { x: 28.860305786132812, y: 337.98876953125 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 304, width: 134, height: 31, left: 28 },
              text: 'Gingembre',
              cornerPoints: [
                { x: 28, y: 308 },
                { x: 160.95480346679688, y: 304.53271484375 },
                { x: 161.65869140625, y: 331.5235290527344 },
                { x: 28.703886032104492, y: 334.9908142089844 },
              ],
            },
            {
              frame: { top: 300, width: 59, height: 34, left: 163 },
              text: 'frais',
              cornerPoints: [
                { x: 163, y: 302 },
                { x: 220.98028564453125, y: 300.4879455566406 },
                { x: 221.81451416015625, y: 332.4770812988281 },
                { x: 163.834228515625, y: 333.9891357421875 },
              ],
            },
          ],
          frame: { top: 299, width: 194, height: 39, left: 28 },
          cornerPoints: [
            { x: 28, y: 305 },
            { x: 220.9344024658203, y: 299.968505859375 },
            { x: 221.79470825195312, y: 332.957275390625 },
            { x: 28.860305786132812, y: 337.98876953125 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'Gingembre frais',
        },
      ],
      text: 'Gingembre frais',
    },
    {
      frame: { top: 351, width: 271, height: 134, left: 23 },
      cornerPoints: [
        { x: 23, y: 356 },
        { x: 290.961669921875, y: 351.4671325683594 },
        { x: 293.1435241699219, y: 480.44866943359375 },
        { x: 25.181861877441406, y: 484.9815673828125 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 356, width: 73, height: 22, left: 25 },
              text: 'Sauce',
              cornerPoints: [
                { x: 25, y: 358 },
                { x: 96.98970031738281, y: 356.7822265625 },
                { x: 97.32797241210938, y: 376.77935791015625 },
                { x: 25.338274002075195, y: 377.99713134765625 },
              ],
            },
            {
              frame: { top: 355, width: 49, height: 27, left: 105 },
              text: 'soja',
              cornerPoints: [
                { x: 105, y: 356 },
                { x: 152.99313354492188, y: 355.1881408691406 },
                { x: 153.43289184570312, y: 381.1844177246094 },
                { x: 105.43975830078125, y: 381.99627685546875 },
              ],
            },
            {
              frame: { top: 354, width: 37, height: 27, left: 163 },
              text: '11)',
              cornerPoints: [
                { x: 163, y: 355 },
                { x: 198.99484252929688, y: 354.39111328125 },
                { x: 199.43460083007812, y: 380.38739013671875 },
                { x: 163.43975830078125, y: 380.99627685546875 },
              ],
            },
            {
              frame: { top: 352, width: 38, height: 27, left: 208 },
              text: '13)',
              cornerPoints: [
                { x: 208, y: 353 },
                { x: 244.9947052001953, y: 352.37420654296875 },
                { x: 245.43446350097656, y: 378.3704833984375 },
                { x: 208.43975830078125, y: 378.99627685546875 },
              ],
            },
            {
              frame: { top: 352, width: 38, height: 27, left: 254 },
              text: '15)',
              cornerPoints: [
                { x: 254, y: 353 },
                { x: 290.99468994140625, y: 352.37420654296875 },
                { x: 291.4344482421875, y: 378.3704833984375 },
                { x: 254.43975830078125, y: 378.99627685546875 },
              ],
            },
          ],
          frame: { top: 351, width: 267, height: 32, left: 25 },
          cornerPoints: [
            { x: 25, y: 356 },
            { x: 290.9619445800781, y: 351.5009765625 },
            { x: 291.4186096191406, y: 378.4971008300781 },
            { x: 25.456668853759766, y: 382.9961242675781 },
          ],
          recognizedLanguages: [{ languageCode: 'fi' }],
          text: 'Sauce soja 11) 13) 15)',
        },
        {
          elements: [
            {
              frame: { top: 405, width: 61, height: 22, left: 25 },
              text: 'Huile',
              cornerPoints: [
                { x: 25, y: 405 },
                { x: 86, y: 405 },
                { x: 86, y: 427 },
                { x: 25, y: 427 },
              ],
            },
            {
              frame: { top: 404, width: 29, height: 21, left: 94 },
              text: 'de',
              cornerPoints: [
                { x: 94, y: 404 },
                { x: 123, y: 404 },
                { x: 123, y: 425 },
                { x: 94, y: 425 },
              ],
            },
            {
              frame: { top: 404, width: 93, height: 21, left: 130 },
              text: 'sésame',
              cornerPoints: [
                { x: 130, y: 404 },
                { x: 223, y: 404 },
                { x: 223, y: 425 },
                { x: 130, y: 425 },
              ],
            },
            {
              frame: { top: 402, width: 22, height: 26, left: 230 },
              text: '3)',
              cornerPoints: [
                { x: 230, y: 402 },
                { x: 252, y: 402 },
                { x: 252, y: 428 },
                { x: 230, y: 428 },
              ],
            },
          ],
          frame: { top: 402, width: 227, height: 26, left: 25 },
          cornerPoints: [
            { x: 25, y: 402 },
            { x: 252, y: 402 },
            { x: 252, y: 428 },
            { x: 25, y: 428 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'Huile de sésame 3)',
        },
        {
          elements: [
            {
              frame: { top: 454, width: 52, height: 22, left: 24 },
              text: 'Filet',
              cornerPoints: [
                { x: 24, y: 455 },
                { x: 74.99588012695312, y: 454.35174560546875 },
                { x: 75.26280212402344, y: 475.35003662109375 },
                { x: 24.266923904418945, y: 475.998291015625 },
              ],
            },
            {
              frame: { top: 453, width: 28, height: 22, left: 83 },
              text: 'de',
              cornerPoints: [
                { x: 83, y: 454 },
                { x: 109.99781799316406, y: 453.65679931640625 },
                { x: 110.26473999023438, y: 474.65509033203125 },
                { x: 83.26692199707031, y: 474.998291015625 },
              ],
            },
            {
              frame: { top: 447, width: 84, height: 36, left: 112 },
              text: 'poulet',
              cornerPoints: [
                { x: 112, y: 449 },
                { x: 194.9932861328125, y: 447.94500732421875 },
                { x: 195.42544555664062, y: 481.9422607421875 },
                { x: 112.43216705322266, y: 482.99725341796875 },
              ],
            },
          ],
          frame: { top: 447, width: 172, height: 37, left: 24 },
          cornerPoints: [
            { x: 24, y: 450 },
            { x: 194.98619079589844, y: 447.82647705078125 },
            { x: 195.41835021972656, y: 481.82373046875 },
            { x: 24.43216323852539, y: 483.99725341796875 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'Filet de poulet',
        },
      ],
      text: 'Sauce soja 11) 13) 15)\nHuile de sésame 3)\nFilet de poulet',
    },
    {
      frame: { top: 502, width: 135, height: 27, left: 23 },
      cornerPoints: [
        { x: 23, y: 502 },
        { x: 158, y: 502 },
        { x: 158, y: 529 },
        { x: 23, y: 529 },
      ],
      recognizedLanguages: [{ languageCode: 'sw' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 504, width: 105, height: 22, left: 23 },
              text: 'Gomasio',
              cornerPoints: [
                { x: 23, y: 504 },
                { x: 128, y: 504 },
                { x: 128, y: 526 },
                { x: 23, y: 526 },
              ],
            },
            {
              frame: { top: 502, width: 22, height: 27, left: 136 },
              text: '3)',
              cornerPoints: [
                { x: 136, y: 502 },
                { x: 158, y: 502 },
                { x: 158, y: 529 },
                { x: 136, y: 529 },
              ],
            },
          ],
          frame: { top: 502, width: 135, height: 27, left: 23 },
          cornerPoints: [
            { x: 23, y: 502 },
            { x: 158, y: 502 },
            { x: 158, y: 529 },
            { x: 23, y: 529 },
          ],
          recognizedLanguages: [{ languageCode: 'sw' }],
          text: 'Gomasio 3)',
        },
      ],
      text: 'Gomasio 3)',
    },
  ],
  text: "Riz basmati\nOignon jaune\nCarotte*\nPoireau*\nCiboulette*\nGousse d'ail\nGingembre frais\nSauce soja 11) 13) 15)\nHuile de sésame 3)\nFilet de poulet\nGomasio 3)",
};

export const androidNamesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 22, height: 26, left: 50, width: 137 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'tr' }],
          elements: [
            {
              frame: { top: 26, height: 22, left: 50, width: 34 },
              cornerPoints: [
                { y: 28, x: 50 },
                { y: 26, x: 84 },
                { y: 46, x: 84 },
                { y: 48, x: 50 },
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
          frame: { top: 22, height: 26, left: 50, width: 137 },
          cornerPoints: [
            { y: 27, x: 50 },
            { y: 22, x: 187 },
            { y: 43, x: 187 },
            { y: 48, x: 50 },
          ],
          text: 'Riz basmati',
        },
      ],
      cornerPoints: [
        { y: 27, x: 50 },
        { y: 22, x: 187 },
        { y: 43, x: 187 },
        { y: 48, x: 50 },
      ],
      text: 'Riz basmati',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 72, height: 27, left: 47, width: 159 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
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
          frame: { top: 72, height: 27, left: 47, width: 159 },
          cornerPoints: [
            { y: 72, x: 47 },
            { y: 72, x: 206 },
            { y: 99, x: 206 },
            { y: 99, x: 47 },
          ],
          text: 'Oignon jaune',
        },
      ],
      cornerPoints: [
        { y: 72, x: 47 },
        { y: 72, x: 206 },
        { y: 99, x: 206 },
        { y: 99, x: 47 },
      ],
      text: 'Oignon jaune',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 113, height: 31, left: 54, width: 80 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'it' }],
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
      cornerPoints: [
        { y: 116, x: 54 },
        { y: 113, x: 134 },
        { y: 141, x: 134 },
        { y: 144, x: 54 },
      ],
      text: 'Carotte',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 162, height: 24, left: 38, width: 101 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 162, height: 24, left: 38, width: 101 },
              cornerPoints: [
                { y: 165, x: 38 },
                { y: 162, x: 139 },
                { y: 183, x: 139 },
                { y: 186, x: 38 },
              ],
              text: 'Poireau*',
            },
          ],
          frame: { top: 162, height: 24, left: 38, width: 101 },
          cornerPoints: [
            { y: 165, x: 38 },
            { y: 162, x: 139 },
            { y: 183, x: 139 },
            { y: 186, x: 38 },
          ],
          text: 'Poireau*',
        },
      ],
      cornerPoints: [
        { y: 165, x: 38 },
        { y: 162, x: 139 },
        { y: 183, x: 139 },
        { y: 186, x: 38 },
      ],
      text: 'Poireau*',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 208, height: 24, left: 34, width: 135 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 208, height: 24, left: 34, width: 135 },
              cornerPoints: [
                { y: 210, x: 34 },
                { y: 208, x: 169 },
                { y: 230, x: 169 },
                { y: 232, x: 34 },
              ],
              text: 'Ciboulette*',
            },
          ],
          frame: { top: 208, height: 24, left: 34, width: 135 },
          cornerPoints: [
            { y: 210, x: 34 },
            { y: 208, x: 169 },
            { y: 230, x: 169 },
            { y: 232, x: 34 },
          ],
          text: 'Ciboulette*',
        },
      ],
      cornerPoints: [
        { y: 210, x: 34 },
        { y: 208, x: 169 },
        { y: 230, x: 169 },
        { y: 232, x: 34 },
      ],
      text: 'Ciboulette*',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 255, height: 26, left: 30, width: 145 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
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
              frame: { top: 255, height: 24, left: 124, width: 51 },
              cornerPoints: [
                { y: 257, x: 124 },
                { y: 255, x: 175 },
                { y: 277, x: 175 },
                { y: 279, x: 124 },
              ],
              text: "d'ail",
            },
          ],
          frame: { top: 255, height: 26, left: 30, width: 145 },
          cornerPoints: [
            { y: 259, x: 30 },
            { y: 255, x: 175 },
            { y: 277, x: 175 },
            { y: 281, x: 30 },
          ],
          text: "Gousse d'ail",
        },
      ],
      cornerPoints: [
        { y: 259, x: 30 },
        { y: 255, x: 175 },
        { y: 277, x: 175 },
        { y: 281, x: 30 },
      ],
      text: "Gousse d'ail",
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 300, height: 36, left: 28, width: 204 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 302, height: 34, left: 28, width: 132 },
              cornerPoints: [
                { y: 307, x: 28 },
                { y: 302, x: 160 },
                { y: 331, x: 160 },
                { y: 336, x: 28 },
              ],
              text: 'Gingembre',
            },
            {
              frame: { top: 300, height: 31, left: 168, width: 64 },
              cornerPoints: [
                { y: 303, x: 168 },
                { y: 300, x: 232 },
                { y: 328, x: 232 },
                { y: 331, x: 168 },
              ],
              text: 'frais',
            },
          ],
          frame: { top: 300, height: 36, left: 28, width: 204 },
          cornerPoints: [
            { y: 307, x: 28 },
            { y: 300, x: 232 },
            { y: 329, x: 232 },
            { y: 336, x: 28 },
          ],
          text: 'Gingembre frais',
        },
      ],
      cornerPoints: [
        { y: 307, x: 28 },
        { y: 300, x: 232 },
        { y: 329, x: 232 },
        { y: 336, x: 28 },
      ],
      text: 'Gingembre frais',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 349, height: 36, left: 25, width: 265 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fi' }],
          elements: [
            {
              frame: { top: 353, height: 32, left: 25, width: 71 },
              cornerPoints: [
                { y: 355, x: 25 },
                { y: 353, x: 96 },
                { y: 383, x: 96 },
                { y: 385, x: 25 },
              ],
              text: 'Sauce',
            },
            {
              frame: { top: 353, height: 30, left: 104, width: 50 },
              cornerPoints: [
                { y: 354, x: 104 },
                { y: 353, x: 154 },
                { y: 382, x: 154 },
                { y: 383, x: 104 },
              ],
              text: 'soja',
            },
            {
              frame: { top: 352, height: 30, left: 162, width: 36 },
              cornerPoints: [
                { y: 353, x: 162 },
                { y: 352, x: 198 },
                { y: 381, x: 198 },
                { y: 382, x: 162 },
              ],
              text: '11)',
            },
            {
              frame: { top: 351, height: 30, left: 207, width: 39 },
              cornerPoints: [
                { y: 352, x: 207 },
                { y: 351, x: 246 },
                { y: 380, x: 246 },
                { y: 381, x: 207 },
              ],
              text: '13)',
            },
            {
              frame: { top: 350, height: 30, left: 253, width: 37 },
              cornerPoints: [
                { y: 351, x: 253 },
                { y: 350, x: 290 },
                { y: 379, x: 290 },
                { y: 380, x: 253 },
              ],
              text: '15)',
            },
          ],
          frame: { top: 349, height: 36, left: 25, width: 265 },
          cornerPoints: [
            { y: 355, x: 25 },
            { y: 349, x: 290 },
            { y: 379, x: 290 },
            { y: 385, x: 25 },
          ],
          text: 'Sauce soja 11) 13) 15)',
        },
      ],
      cornerPoints: [
        { y: 355, x: 25 },
        { y: 349, x: 290 },
        { y: 379, x: 290 },
        { y: 385, x: 25 },
      ],
      text: 'Sauce soja 11) 13) 15)',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 402, height: 27, left: 25, width: 228 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 402, height: 27, left: 25, width: 62 },
              cornerPoints: [
                { y: 402, x: 25 },
                { y: 402, x: 87 },
                { y: 429, x: 87 },
                { y: 429, x: 25 },
              ],
              text: 'Huile',
            },
            {
              frame: { top: 402, height: 27, left: 94, width: 30 },
              cornerPoints: [
                { y: 402, x: 94 },
                { y: 402, x: 124 },
                { y: 429, x: 124 },
                { y: 429, x: 94 },
              ],
              text: 'de',
            },
            {
              frame: { top: 402, height: 27, left: 130, width: 94 },
              cornerPoints: [
                { y: 402, x: 130 },
                { y: 402, x: 224 },
                { y: 429, x: 224 },
                { y: 429, x: 130 },
              ],
              text: 'sésame',
            },
            {
              frame: { top: 402, height: 27, left: 230, width: 23 },
              cornerPoints: [
                { y: 402, x: 230 },
                { y: 402, x: 253 },
                { y: 429, x: 253 },
                { y: 429, x: 230 },
              ],
              text: '3)',
            },
          ],
          frame: { top: 402, height: 27, left: 25, width: 228 },
          cornerPoints: [
            { y: 402, x: 25 },
            { y: 402, x: 253 },
            { y: 429, x: 253 },
            { y: 429, x: 25 },
          ],
          text: 'Huile de sésame 3)',
        },
      ],
      cornerPoints: [
        { y: 402, x: 25 },
        { y: 402, x: 253 },
        { y: 429, x: 253 },
        { y: 429, x: 25 },
      ],
      text: 'Huile de sésame 3)',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 449, height: 33, left: 24, width: 183 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 451, height: 31, left: 24, width: 50 },
              cornerPoints: [
                { y: 452, x: 24 },
                { y: 451, x: 74 },
                { y: 481, x: 74 },
                { y: 482, x: 24 },
              ],
              text: 'Filet',
            },
            {
              frame: { top: 451, height: 30, left: 81, width: 29 },
              cornerPoints: [
                { y: 452, x: 81 },
                { y: 451, x: 110 },
                { y: 480, x: 110 },
                { y: 481, x: 81 },
              ],
              text: 'de',
            },
            {
              frame: { top: 449, height: 32, left: 119, width: 88 },
              cornerPoints: [
                { y: 451, x: 119 },
                { y: 449, x: 207 },
                { y: 479, x: 207 },
                { y: 481, x: 119 },
              ],
              text: 'poulet*',
            },
          ],
          frame: { top: 449, height: 33, left: 24, width: 183 },
          cornerPoints: [
            { y: 452, x: 24 },
            { y: 449, x: 207 },
            { y: 479, x: 207 },
            { y: 482, x: 24 },
          ],
          text: 'Filet de poulet*',
        },
      ],
      cornerPoints: [
        { y: 452, x: 24 },
        { y: 449, x: 207 },
        { y: 479, x: 207 },
        { y: 482, x: 24 },
      ],
      text: 'Filet de poulet*',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 499, height: 30, left: 23, width: 133 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'sw' }],
          elements: [
            {
              frame: { top: 499, height: 30, left: 23, width: 104 },
              cornerPoints: [
                { y: 501, x: 23 },
                { y: 499, x: 127 },
                { y: 527, x: 127 },
                { y: 529, x: 23 },
              ],
              text: 'Gomasio',
            },
            {
              frame: { top: 499, height: 28, left: 135, width: 21 },
              cornerPoints: [
                { y: 500, x: 135 },
                { y: 499, x: 156 },
                { y: 526, x: 156 },
                { y: 527, x: 135 },
              ],
              text: '3)',
            },
          ],
          frame: { top: 499, height: 30, left: 23, width: 133 },
          cornerPoints: [
            { y: 501, x: 23 },
            { y: 499, x: 156 },
            { y: 527, x: 156 },
            { y: 529, x: 23 },
          ],
          text: 'Gomasio 3)',
        },
      ],
      cornerPoints: [
        { y: 501, x: 23 },
        { y: 499, x: 156 },
        { y: 527, x: 156 },
        { y: 529, x: 23 },
      ],
      text: 'Gomasio 3)',
    },
  ],
  text: "Riz basmati\nOignon jaune\nCarotte\nPoireau*\nCiboulette*\nGousse d'ail\nGingembre frais\nSauce soja 11) 13) 15)\nHuile de sésame 3)\nFilet de poulet*\nGomasio 3)",
};

export const quantitiesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 12, height: 25, left: 57, width: 65 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          elements: [
            {
              frame: { top: 12, height: 25, left: 57, width: 65 },
              cornerPoints: [
                { y: 12, x: 59 },
                { y: 15, x: 122 },
                { y: 37, x: 120 },
                { y: 34, x: 57 },
              ],
              text: '140g',
            },
          ],
          frame: { top: 12, height: 25, left: 57, width: 65 },
          cornerPoints: [
            { y: 12, x: 59 },
            { y: 15, x: 122 },
            { y: 37, x: 120 },
            { y: 34, x: 57 },
          ],
          text: '140g',
        },
      ],
      cornerPoints: [
        { y: 12, x: 59 },
        { y: 15, x: 122 },
        { y: 37, x: 120 },
        { y: 34, x: 57 },
      ],
      text: '140g',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 54, height: 28, left: 46, width: 83 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 56, height: 26, left: 46, width: 11 },
              cornerPoints: [
                { y: 57, x: 46 },
                { y: 56, x: 57 },
                { y: 81, x: 57 },
                { y: 82, x: 46 },
              ],
              text: '1',
            },
            {
              frame: { top: 54, height: 27, left: 66, width: 63 },
              cornerPoints: [
                { y: 56, x: 66 },
                { y: 54, x: 129 },
                { y: 79, x: 129 },
                { y: 81, x: 66 },
              ],
              text: 'pièce',
            },
          ],
          frame: { top: 54, height: 28, left: 46, width: 83 },
          cornerPoints: [
            { y: 56, x: 46 },
            { y: 54, x: 129 },
            { y: 80, x: 129 },
            { y: 82, x: 46 },
          ],
          text: '1 pièce',
        },
      ],
      cornerPoints: [
        { y: 56, x: 46 },
        { y: 54, x: 129 },
        { y: 80, x: 129 },
        { y: 82, x: 46 },
      ],
      text: '1 pièce',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 103, height: 27, left: 45, width: 85 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 103, height: 27, left: 45, width: 12 },
              cornerPoints: [
                { y: 103, x: 45 },
                { y: 103, x: 57 },
                { y: 130, x: 57 },
                { y: 130, x: 45 },
              ],
              text: '1',
            },
            {
              frame: { top: 103, height: 27, left: 66, width: 64 },
              cornerPoints: [
                { y: 103, x: 66 },
                { y: 103, x: 130 },
                { y: 130, x: 130 },
                { y: 130, x: 66 },
              ],
              text: 'pièce',
            },
          ],
          frame: { top: 103, height: 27, left: 45, width: 85 },
          cornerPoints: [
            { y: 103, x: 45 },
            { y: 103, x: 130 },
            { y: 130, x: 130 },
            { y: 130, x: 45 },
          ],
          text: '1 pièce',
        },
      ],
      cornerPoints: [
        { y: 103, x: 45 },
        { y: 103, x: 130 },
        { y: 130, x: 130 },
        { y: 130, x: 45 },
      ],
      text: '1 pièce',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 149, height: 28, left: 44, width: 85 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
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
          frame: { top: 149, height: 28, left: 44, width: 85 },
          cornerPoints: [
            { y: 149, x: 44 },
            { y: 149, x: 129 },
            { y: 177, x: 129 },
            { y: 177, x: 44 },
          ],
          text: '1 pièce',
        },
      ],
      cornerPoints: [
        { y: 149, x: 44 },
        { y: 149, x: 129 },
        { y: 177, x: 129 },
        { y: 177, x: 44 },
      ],
      text: '1 pièce',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 198, height: 25, left: 67, width: 36 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          elements: [
            {
              frame: { top: 198, height: 25, left: 67, width: 36 },
              cornerPoints: [
                { y: 198, x: 68 },
                { y: 199, x: 103 },
                { y: 223, x: 102 },
                { y: 222, x: 67 },
              ],
              text: '3g',
            },
          ],
          frame: { top: 198, height: 25, left: 67, width: 36 },
          cornerPoints: [
            { y: 198, x: 68 },
            { y: 199, x: 103 },
            { y: 223, x: 102 },
            { y: 222, x: 67 },
          ],
          text: '3g',
        },
      ],
      cornerPoints: [
        { y: 198, x: 68 },
        { y: 199, x: 103 },
        { y: 223, x: 102 },
        { y: 222, x: 67 },
      ],
      text: '3g',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 242, height: 29, left: 42, width: 83 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 243, height: 28, left: 42, width: 10 },
              cornerPoints: [
                { y: 244, x: 42 },
                { y: 243, x: 52 },
                { y: 270, x: 52 },
                { y: 271, x: 42 },
              ],
              text: '1',
            },
            {
              frame: { top: 242, height: 28, left: 62, width: 63 },
              cornerPoints: [
                { y: 243, x: 62 },
                { y: 242, x: 125 },
                { y: 269, x: 125 },
                { y: 270, x: 62 },
              ],
              text: 'pièce',
            },
          ],
          frame: { top: 242, height: 29, left: 42, width: 83 },
          cornerPoints: [
            { y: 243, x: 42 },
            { y: 242, x: 125 },
            { y: 270, x: 125 },
            { y: 271, x: 42 },
          ],
          text: '1 pièce',
        },
      ],
      cornerPoints: [
        { y: 243, x: 42 },
        { y: 242, x: 125 },
        { y: 270, x: 125 },
        { y: 271, x: 42 },
      ],
      text: '1 pièce',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 295, height: 20, left: 54, width: 57 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
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
          frame: { top: 295, height: 20, left: 54, width: 57 },
          cornerPoints: [
            { y: 295, x: 54 },
            { y: 295, x: 111 },
            { y: 315, x: 111 },
            { y: 315, x: 54 },
          ],
          text: '2 cm',
        },
      ],
      cornerPoints: [
        { y: 295, x: 54 },
        { y: 295, x: 111 },
        { y: 315, x: 111 },
        { y: 315, x: 54 },
      ],
      text: '2 cm',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 339, height: 24, left: 48, width: 66 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          elements: [
            {
              frame: { top: 340, height: 23, left: 48, width: 27 },
              cornerPoints: [
                { y: 341, x: 48 },
                { y: 340, x: 75 },
                { y: 362, x: 75 },
                { y: 363, x: 48 },
              ],
              text: '40',
            },
            {
              frame: { top: 340, height: 22, left: 85, width: 29 },
              cornerPoints: [
                { y: 341, x: 85 },
                { y: 340, x: 114 },
                { y: 361, x: 114 },
                { y: 362, x: 85 },
              ],
              text: 'ml',
            },
          ],
          frame: { top: 339, height: 24, left: 48, width: 66 },
          cornerPoints: [
            { y: 341, x: 48 },
            { y: 339, x: 114 },
            { y: 361, x: 114 },
            { y: 363, x: 48 },
          ],
          text: '40 ml',
        },
      ],
      cornerPoints: [
        { y: 341, x: 48 },
        { y: 339, x: 114 },
        { y: 361, x: 114 },
        { y: 363, x: 48 },
      ],
      text: '40 ml',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 390, height: 22, left: 49, width: 66 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
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
          frame: { top: 390, height: 22, left: 49, width: 66 },
          cornerPoints: [
            { y: 390, x: 49 },
            { y: 390, x: 115 },
            { y: 412, x: 115 },
            { y: 412, x: 49 },
          ],
          text: '10 ml',
        },
      ],
      cornerPoints: [
        { y: 390, x: 49 },
        { y: 390, x: 115 },
        { y: 412, x: 115 },
        { y: 412, x: 49 },
      ],
      text: '10 ml',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 436, height: 32, left: 37, width: 87 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
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
          frame: { top: 436, height: 32, left: 37, width: 87 },
          cornerPoints: [
            { y: 440, x: 37 },
            { y: 436, x: 123 },
            { y: 464, x: 124 },
            { y: 468, x: 38 },
          ],
          text: '2 pièce',
        },
      ],
      cornerPoints: [
        { y: 440, x: 37 },
        { y: 436, x: 123 },
        { y: 464, x: 124 },
        { y: 468, x: 38 },
      ],
      text: '2 pièce',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 492, height: 19, left: 58, width: 47 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
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
          frame: { top: 492, height: 19, left: 58, width: 47 },
          cornerPoints: [
            { y: 492, x: 58 },
            { y: 492, x: 105 },
            { y: 511, x: 105 },
            { y: 511, x: 58 },
          ],
          text: '2 cc',
        },
      ],
      cornerPoints: [
        { y: 492, x: 58 },
        { y: 492, x: 105 },
        { y: 511, x: 105 },
        { y: 511, x: 58 },
      ],
      text: '2 cc',
    },
  ],
  text: '140g\n1 pièce\n1 pièce\n1 pièce\n3g\n1 pièce\n2 cm\n40 ml\n10 ml\n2 pièce\n2 cc',
};

export const expectedIngredientNames: FormIngredientElement[] = [
  { name: 'Riz basmati', unit: '' },
  { name: 'Oignon jaune', unit: '' },
  { name: 'Carotte', unit: '' },
  { name: 'Poireau*', unit: '' },
  { name: 'Ciboulette*', unit: '' },
  { name: "Gousse d'ail", unit: '' },
  { name: 'Gingembre frais', unit: '' },
  { name: 'Sauce soja 11) 13) 15)', unit: '' },
  { name: 'Huile de sésame 3)', unit: '' },
  { name: 'Filet de poulet*', unit: '' },
  { name: 'Gomasio 3)', unit: '' },
];

export const expectedQuantities: string[] = [
  '140g',
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
  { name: 'Carotte*', unit: '' },
  { name: 'Poireau*', unit: '' },
  { name: 'Ciboulette*', unit: '' },
  { name: "Gousse d'ail", unit: '' },
  { name: 'Gingembre frais', unit: '' },
  { name: 'Sauce soja 11) 13) 15)', unit: '' },
  { name: 'Huile de sésame 3)', unit: '' },
  { name: 'Filet de poulet', unit: '' },
  { name: 'Gomasio 3)', unit: '' },
];

export const iosQuantitiesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      frame: { top: 13, width: 65, height: 25, left: 57 },
      cornerPoints: [
        { x: 59, y: 13 },
        { x: 121.93336486816406, y: 15.896759986877441 },
        { x: 120.92179870605469, y: 37.87349319458008 },
        { x: 57.988433837890625, y: 34.97673034667969 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 13, width: 43, height: 20, left: 58 },
              text: '140',
              cornerPoints: [
                { x: 59, y: 13 },
                { x: 100.95558166503906, y: 14.931173324584961 },
                { x: 100.12793731689453, y: 32.91213607788086 },
                { x: 58.17235565185547, y: 30.9809627532959 },
              ],
            },
            {
              frame: { top: 18, width: 13, height: 20, left: 109 },
              text: 'g',
              cornerPoints: [
                { x: 110, y: 18 },
                { x: 121.9873046875, y: 18.5517635345459 },
                { x: 121.11367797851562, y: 37.53166961669922 },
                { x: 109.12637329101562, y: 36.97990417480469 },
              ],
            },
          ],
          frame: { top: 13, width: 65, height: 25, left: 57 },
          cornerPoints: [
            { x: 59, y: 13 },
            { x: 121.93336486816406, y: 15.896759986877441 },
            { x: 120.92179870605469, y: 37.87349319458008 },
            { x: 57.988433837890625, y: 34.97673034667969 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '140 g',
        },
      ],
      text: '140 g',
    },
    {
      frame: { top: 55, width: 85, height: 28, left: 46 },
      cornerPoints: [
        { x: 46, y: 56 },
        { x: 129.99526977539062, y: 55.109275817871094 },
        { x: 130.2815704345703, y: 82.10775756835938 },
        { x: 46.28630447387695, y: 82.99848175048828 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 58, width: 12, height: 19, left: 46 },
              text: '1',
              cornerPoints: [
                { x: 46, y: 59 },
                { x: 56.99938201904297, y: 58.883358001708984 },
                { x: 57.190250396728516, y: 76.8823471069336 },
                { x: 46.19086837768555, y: 76.99899291992188 },
              ],
            },
            {
              frame: { top: 55, width: 64, height: 28, left: 67 },
              text: 'pièce',
              cornerPoints: [
                { x: 67, y: 56 },
                { x: 129.9964599609375, y: 55.33195495605469 },
                { x: 130.2827606201172, y: 82.33043670654297 },
                { x: 67.28630065917969, y: 82.99848175048828 },
              ],
            },
          ],
          frame: { top: 55, width: 85, height: 28, left: 46 },
          cornerPoints: [
            { x: 46, y: 56 },
            { x: 129.99526977539062, y: 55.109275817871094 },
            { x: 130.2815704345703, y: 82.10775756835938 },
            { x: 46.28630447387695, y: 82.99848175048828 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: '1 pièce',
        },
      ],
      text: '1 pièce',
    },
    {
      frame: { top: 101, width: 85, height: 28, left: 45 },
      cornerPoints: [
        { x: 45, y: 103 },
        { x: 128.99249267578125, y: 101.87709045410156 },
        { x: 129.34005737304688, y: 127.87477111816406 },
        { x: 45.347564697265625, y: 128.9976806640625 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 105, width: 12, height: 18, left: 45 },
              text: '1',
              cornerPoints: [
                { x: 45, y: 106 },
                { x: 55.99901580810547, y: 105.85295104980469 },
                { x: 56.22627258300781, y: 122.85143280029297 },
                { x: 45.227256774902344, y: 122.99848175048828 },
              ],
            },
            {
              frame: { top: 102, width: 64, height: 27, left: 66 },
              text: 'pièce',
              cornerPoints: [
                { x: 66, y: 103 },
                { x: 128.99436950683594, y: 102.15782165527344 },
                { x: 129.34193420410156, y: 128.15550231933594 },
                { x: 66.34756469726562, y: 128.9976806640625 },
              ],
            },
          ],
          frame: { top: 101, width: 85, height: 28, left: 45 },
          cornerPoints: [
            { x: 45, y: 103 },
            { x: 128.99249267578125, y: 101.87709045410156 },
            { x: 129.34005737304688, y: 127.87477111816406 },
            { x: 45.347564697265625, y: 128.9976806640625 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: '1 pièce',
        },
      ],
      text: '1 pièce',
    },
    {
      frame: { top: 148, width: 86, height: 29, left: 43 },
      cornerPoints: [
        { x: 43, y: 151 },
        { x: 127.95264434814453, y: 148.16310119628906 },
        { x: 128.82040405273438, y: 174.14862060546875 },
        { x: 43.867759704589844, y: 176.9855194091797 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 152, width: 12, height: 19, left: 43 },
              text: '1',
              cornerPoints: [
                { x: 43, y: 153 },
                { x: 53.993873596191406, y: 152.63287353515625 },
                { x: 54.594627380371094, y: 170.6228485107422 },
                { x: 43.60075378417969, y: 170.98997497558594 },
              ],
            },
            {
              frame: { top: 147, width: 65, height: 29, left: 64 },
              text: 'pièce',
              cornerPoints: [
                { x: 64, y: 150 },
                { x: 127.96434020996094, y: 147.86398315429688 },
                { x: 128.83209228515625, y: 173.84950256347656 },
                { x: 64.86775970458984, y: 175.9855194091797 },
              ],
            },
          ],
          frame: { top: 148, width: 86, height: 29, left: 43 },
          cornerPoints: [
            { x: 43, y: 151 },
            { x: 127.95264434814453, y: 148.16310119628906 },
            { x: 128.82040405273438, y: 174.14862060546875 },
            { x: 43.867759704589844, y: 176.9855194091797 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: '1 pièce',
        },
      ],
      text: '1 pièce',
    },
    {
      frame: { top: 197, width: 114, height: 318, left: 19 },
      cornerPoints: [
        { x: 47, y: 197 },
        { x: 132.6556854248047, y: 204.68789672851562 },
        { x: 104.85409545898438, y: 514.4427490234375 },
        { x: 19.198413848876953, y: 506.7548522949219 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 199, width: 36, height: 25, left: 67 },
              text: '3g',
              cornerPoints: [
                { x: 69, y: 199 },
                { x: 102.86387634277344, y: 202.03939819335938 },
                { x: 100.89720153808594, y: 223.95132446289062 },
                { x: 67.0333251953125, y: 220.91192626953125 },
              ],
            },
          ],
          frame: { top: 199, width: 36, height: 25, left: 67 },
          cornerPoints: [
            { x: 69, y: 199 },
            { x: 102.86387634277344, y: 202.03939819335938 },
            { x: 100.89720153808594, y: 223.95132446289062 },
            { x: 67.0333251953125, y: 220.91192626953125 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '3g',
        },
        {
          elements: [
            {
              frame: { top: 247, width: 10, height: 18, left: 42 },
              text: '1',
              cornerPoints: [
                { x: 42, y: 247 },
                { x: 52, y: 247 },
                { x: 52, y: 265 },
                { x: 42, y: 265 },
              ],
            },
            {
              frame: { top: 244, width: 64, height: 27, left: 63 },
              text: 'pièce',
              cornerPoints: [
                { x: 63, y: 244 },
                { x: 127, y: 244 },
                { x: 127, y: 271 },
                { x: 63, y: 271 },
              ],
            },
          ],
          frame: { top: 244, width: 85, height: 27, left: 42 },
          cornerPoints: [
            { x: 42, y: 244 },
            { x: 127, y: 244 },
            { x: 127, y: 271 },
            { x: 42, y: 271 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: '1 pièce',
        },
        {
          elements: [
            {
              frame: { top: 295, width: 13, height: 19, left: 54 },
              text: '2',
              cornerPoints: [
                { x: 55, y: 295 },
                { x: 66.99398040771484, y: 295.3800354003906 },
                { x: 66.42393493652344, y: 313.3710021972656 },
                { x: 54.429954528808594, y: 312.990966796875 },
              ],
            },
            {
              frame: { top: 299, width: 35, height: 17, left: 75 },
              text: 'cm',
              cornerPoints: [
                { x: 76, y: 299 },
                { x: 109.98294830322266, y: 300.0767517089844 },
                { x: 109.5079116821289, y: 315.0692138671875 },
                { x: 75.52496337890625, y: 313.9924621582031 },
              ],
            },
          ],
          frame: { top: 295, width: 56, height: 20, left: 54 },
          cornerPoints: [
            { x: 55, y: 295 },
            { x: 109.972412109375, y: 296.7418212890625 },
            { x: 109.4023666381836, y: 314.7327880859375 },
            { x: 54.429954528808594, y: 312.990966796875 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '2 cm',
        },
        {
          elements: [
            {
              frame: { top: 491, width: 13, height: 20, left: 57 },
              text: '2',
              cornerPoints: [
                { x: 58, y: 491 },
                { x: 69.9991683959961, y: 491.14117431640625 },
                { x: 69.775634765625, y: 510.1398620605469 },
                { x: 57.776466369628906, y: 509.9986877441406 },
              ],
            },
            {
              frame: { top: 495, width: 26, height: 16, left: 78 },
              text: 'cC',
              cornerPoints: [
                { x: 79, y: 495 },
                { x: 103.9982681274414, y: 495.29412841796875 },
                { x: 103.82179260253906, y: 510.2930908203125 },
                { x: 78.82352447509766, y: 509.99896240234375 },
              ],
            },
          ],
          frame: { top: 491, width: 47, height: 20, left: 57 },
          cornerPoints: [
            { x: 58, y: 491 },
            { x: 103.99681854248047, y: 491.54119873046875 },
            { x: 103.77328491210938, y: 510.5398864746094 },
            { x: 57.776466369628906, y: 509.9986877441406 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '2 cC',
        },
      ],
      text: '3g\n1 pièce\n2 cm\n2 cC',
    },
    {
      frame: { top: 341, width: 66, height: 21, left: 48 },
      cornerPoints: [
        { x: 48, y: 341 },
        { x: 114, y: 341 },
        { x: 114, y: 362 },
        { x: 48, y: 362 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 344, width: 28, height: 18, left: 48 },
              text: '40',
              cornerPoints: [
                { x: 48, y: 344 },
                { x: 76, y: 344 },
                { x: 76, y: 362 },
                { x: 48, y: 362 },
              ],
            },
            {
              frame: { top: 341, width: 28, height: 21, left: 86 },
              text: 'ml',
              cornerPoints: [
                { x: 86, y: 341 },
                { x: 114, y: 341 },
                { x: 114, y: 362 },
                { x: 86, y: 362 },
              ],
            },
          ],
          frame: { top: 341, width: 66, height: 21, left: 48 },
          cornerPoints: [
            { x: 48, y: 341 },
            { x: 114, y: 341 },
            { x: 114, y: 362 },
            { x: 48, y: 362 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '40 ml',
        },
      ],
      text: '40 ml',
    },
    {
      frame: { top: 390, width: 66, height: 21, left: 49 },
      cornerPoints: [
        { x: 49, y: 390 },
        { x: 115, y: 390 },
        { x: 115, y: 411 },
        { x: 49, y: 411 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 393, width: 27, height: 18, left: 49 },
              text: '10',
              cornerPoints: [
                { x: 49, y: 393 },
                { x: 76, y: 393 },
                { x: 76, y: 411 },
                { x: 49, y: 411 },
              ],
            },
            {
              frame: { top: 390, width: 29, height: 21, left: 86 },
              text: 'ml',
              cornerPoints: [
                { x: 86, y: 390 },
                { x: 115, y: 390 },
                { x: 115, y: 411 },
                { x: 86, y: 411 },
              ],
            },
          ],
          frame: { top: 390, width: 66, height: 21, left: 49 },
          cornerPoints: [
            { x: 49, y: 390 },
            { x: 115, y: 390 },
            { x: 115, y: 411 },
            { x: 49, y: 411 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '10 ml',
        },
      ],
      text: '10 ml',
    },
    {
      frame: { top: 438, width: 87, height: 29, left: 38 },
      cornerPoints: [
        { x: 38, y: 439 },
        { x: 123.99522399902344, y: 438.09344482421875 },
        { x: 124.29037475585938, y: 466.0918884277344 },
        { x: 38.2951545715332, y: 466.9984436035156 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 442, width: 12, height: 19, left: 38 },
              text: '2',
              cornerPoints: [
                { x: 38, y: 443 },
                { x: 48.9993896484375, y: 442.884033203125 },
                { x: 49.18913269042969, y: 460.8830261230469 },
                { x: 38.18974304199219, y: 460.9989929199219 },
              ],
            },
            {
              frame: { top: 438, width: 65, height: 29, left: 60 },
              text: 'pièce',
              cornerPoints: [
                { x: 60, y: 439 },
                { x: 123.99644470214844, y: 438.3253479003906 },
                { x: 124.29159545898438, y: 466.32379150390625 },
                { x: 60.2951545715332, y: 466.9984436035156 },
              ],
            },
          ],
          frame: { top: 438, width: 87, height: 29, left: 38 },
          cornerPoints: [
            { x: 38, y: 439 },
            { x: 123.99522399902344, y: 438.09344482421875 },
            { x: 124.29037475585938, y: 466.0918884277344 },
            { x: 38.2951545715332, y: 466.9984436035156 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: '2 pièce',
        },
      ],
      text: '2 pièce',
    },
  ],
  text: '140 g\n1 pièce\n1 pièce\n1 pièce\n3g\n1 pièce\n2 cm\n2 cC\n40 ml\n10 ml\n2 pièce',
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
  '2 cC',
];
