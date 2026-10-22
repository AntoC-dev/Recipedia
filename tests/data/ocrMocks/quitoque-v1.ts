/* eslint-disable no-loss-of-precision */
import { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { FormIngredientElement } from '@customTypes/DatabaseElementTypes';

export const iosNamesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      frame: { top: 18, width: 154, height: 47, left: 9 },
      cornerPoints: [
        { x: 9, y: 25 },
        { x: 160.86317443847656, y: 18.55195426940918 },
        { x: 162.56002807617188, y: 58.51594543457031 },
        { x: 10.696854591369629, y: 64.9639892578125 },
      ],
      recognizedLanguages: [{ languageCode: 'it' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 18, width: 154, height: 47, left: 9 },
              text: 'carotte',
              cornerPoints: [
                { x: 9, y: 25 },
                { x: 160.86317443847656, y: 18.55195426940918 },
                { x: 162.56002807617188, y: 58.51594543457031 },
                { x: 10.696854591369629, y: 64.9639892578125 },
              ],
            },
          ],
          frame: { top: 18, width: 154, height: 47, left: 9 },
          cornerPoints: [
            { x: 9, y: 25 },
            { x: 160.86317443847656, y: 18.55195426940918 },
            { x: 162.56002807617188, y: 58.51594543457031 },
            { x: 10.696854591369629, y: 64.9639892578125 },
          ],
          recognizedLanguages: [{ languageCode: 'it' }],
          text: 'carotte',
        },
      ],
      text: 'carotte',
    },
    {
      frame: { top: 72, width: 293, height: 49, left: 16 },
      cornerPoints: [
        { x: 16, y: 83 },
        { x: 306.82196044921875, y: 72.82272338867188 },
        { x: 308.15093994140625, y: 110.79947662353516 },
        { x: 17.328990936279297, y: 120.97675323486328 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 78, width: 123, height: 37, left: 16 },
              text: 'cumin',
              cornerPoints: [
                { x: 16, y: 83 },
                { x: 136.92596435546875, y: 78.7682113647461 },
                { x: 138.0451202392578, y: 110.7486343383789 },
                { x: 17.119150161743164, y: 114.98042297363281 },
              ],
            },
            {
              frame: { top: 72, width: 159, height: 44, left: 150 },
              text: '(sachet)',
              cornerPoints: [
                { x: 150, y: 78 },
                { x: 306.9039306640625, y: 72.50917053222656 },
                { x: 308.23291015625, y: 110.48592376708984 },
                { x: 151.32899475097656, y: 115.97675323486328 },
              ],
            },
          ],
          frame: { top: 72, width: 293, height: 49, left: 16 },
          cornerPoints: [
            { x: 16, y: 83 },
            { x: 306.82196044921875, y: 72.82272338867188 },
            { x: 308.15093994140625, y: 110.79947662353516 },
            { x: 17.328990936279297, y: 120.97675323486328 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'cumin (sachet)',
        },
      ],
      text: 'cumin (sachet)',
    },
    {
      frame: { top: 135, width: 175, height: 46, left: 14 },
      cornerPoints: [
        { x: 14, y: 143 },
        { x: 186.8582763671875, y: 135.99891662597656 },
        { x: 188.39608764648438, y: 173.96778869628906 },
        { x: 15.537811279296875, y: 180.9688720703125 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 135, width: 175, height: 46, left: 14 },
              text: 'merguez',
              cornerPoints: [
                { x: 14, y: 143 },
                { x: 186.8582763671875, y: 135.99891662597656 },
                { x: 188.39608764648438, y: 173.96778869628906 },
                { x: 15.537811279296875, y: 180.9688720703125 },
              ],
            },
          ],
          frame: { top: 135, width: 175, height: 46, left: 14 },
          cornerPoints: [
            { x: 14, y: 143 },
            { x: 186.8582763671875, y: 135.99891662597656 },
            { x: 188.39608764648438, y: 173.96778869628906 },
            { x: 15.537811279296875, y: 180.9688720703125 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'merguez',
        },
      ],
      text: 'merguez',
    },
    {
      frame: { top: 190, width: 124, height: 45, left: 1 },
      cornerPoints: [
        { x: 1, y: 195 },
        { x: 122.89807891845703, y: 190.0142059326172 },
        { x: 124.53276824951172, y: 229.9807891845703 },
        { x: 2.634688377380371, y: 234.96658325195312 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 190, width: 124, height: 45, left: 1 },
              text: 'navet',
              cornerPoints: [
                { x: 1, y: 195 },
                { x: 122.89807891845703, y: 190.0142059326172 },
                { x: 124.53276824951172, y: 229.9807891845703 },
                { x: 2.634688377380371, y: 234.96658325195312 },
              ],
            },
          ],
          frame: { top: 190, width: 124, height: 45, left: 1 },
          cornerPoints: [
            { x: 1, y: 195 },
            { x: 122.89807891845703, y: 190.0142059326172 },
            { x: 124.53276824951172, y: 229.9807891845703 },
            { x: 2.634688377380371, y: 234.96658325195312 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: 'navet',
        },
      ],
      text: 'navet',
    },
    {
      frame: { top: 242, width: 540, height: 49, left: 8 },
      cornerPoints: [
        { x: 8, y: 253 },
        { x: 546.90478515625, y: 242.87033081054688 },
        { x: 547.6189575195312, y: 280.8636169433594 },
        { x: 8.714150428771973, y: 290.9932861328125 },
      ],
      recognizedLanguages: [{ languageCode: 'fr' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 257, width: 174, height: 34, left: 8 },
              text: 'pommes',
              cornerPoints: [
                { x: 8, y: 261 },
                { x: 180.96945190429688, y: 257.7487487792969 },
                { x: 181.5332489013672, y: 287.7434387207031 },
                { x: 8.563803672790527, y: 290.99468994140625 },
              ],
            },
            {
              frame: { top: 249, width: 52, height: 33, left: 190 },
              text: 'de',
              cornerPoints: [
                { x: 190, y: 250 },
                { x: 240.99099731445312, y: 249.04153442382812 },
                { x: 241.59239196777344, y: 281.035888671875 },
                { x: 190.6013946533203, y: 281.9943542480469 },
              ],
            },
            {
              frame: { top: 249, width: 106, height: 32, left: 250 },
              text: 'terre',
              cornerPoints: [
                { x: 250, y: 251 },
                { x: 354.9814453125, y: 249.0266876220703 },
                { x: 355.5452575683594, y: 279.0213928222656 },
                { x: 250.5637969970703, y: 280.99468994140625 },
              ],
            },
            {
              frame: { top: 244, width: 136, height: 40, left: 362 },
              text: 'jaunes',
              cornerPoints: [
                { x: 362, y: 247 },
                { x: 496.97613525390625, y: 244.462890625 },
                { x: 497.6714782714844, y: 281.45635986328125 },
                { x: 362.6953430175781, y: 283.99346923828125 },
              ],
            },
            {
              frame: { top: 243, width: 40, height: 38, left: 508 },
              text: '(g',
              cornerPoints: [
                { x: 508, y: 244 },
                { x: 546.9931030273438, y: 243.26705932617188 },
                { x: 547.6884765625, y: 280.2605285644531 },
                { x: 508.6953430175781, y: 280.99346923828125 },
              ],
            },
          ],
          frame: { top: 242, width: 540, height: 49, left: 8 },
          cornerPoints: [
            { x: 8, y: 253 },
            { x: 546.90478515625, y: 242.87033081054688 },
            { x: 547.6189575195312, y: 280.8636169433594 },
            { x: 8.714150428771973, y: 290.9932861328125 },
          ],
          recognizedLanguages: [{ languageCode: 'fr' }],
          text: 'pommes de terre jaunes (g',
        },
      ],
      text: 'pommes de terre jaunes (g',
    },
  ],
  text: 'carotte\ncumin (sachet)\nmerguez\nnavet\npommes de terre jaunes (g',
};

export const androidNamesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 17, height: 43, left: 33, width: 143 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'it' }],
          elements: [
            {
              frame: { top: 17, height: 43, left: 33, width: 143 },
              cornerPoints: [
                { y: 23, x: 33 },
                { y: 17, x: 175 },
                { y: 54, x: 176 },
                { y: 60, x: 34 },
              ],
              text: 'carotte',
            },
          ],
          frame: { top: 17, height: 43, left: 33, width: 143 },
          cornerPoints: [
            { y: 23, x: 33 },
            { y: 17, x: 175 },
            { y: 54, x: 176 },
            { y: 60, x: 34 },
          ],
          text: 'carotte',
        },
      ],
      cornerPoints: [
        { y: 23, x: 33 },
        { y: 17, x: 175 },
        { y: 54, x: 176 },
        { y: 60, x: 34 },
      ],
      text: 'carotte',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 70, height: 53, left: 16, width: 291 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 77, height: 46, left: 16, width: 121 },
              cornerPoints: [
                { y: 82, x: 16 },
                { y: 77, x: 136 },
                { y: 118, x: 137 },
                { y: 123, x: 17 },
              ],
              text: 'cumin',
            },
            {
              frame: { top: 70, height: 48, left: 149, width: 158 },
              cornerPoints: [
                { y: 77, x: 149 },
                { y: 70, x: 306 },
                { y: 111, x: 307 },
                { y: 118, x: 150 },
              ],
              text: '(sachet)',
            },
          ],
          frame: { top: 70, height: 53, left: 16, width: 291 },
          cornerPoints: [
            { y: 82, x: 16 },
            { y: 70, x: 306 },
            { y: 111, x: 307 },
            { y: 123, x: 17 },
          ],
          text: 'cumin (sachet)',
        },
      ],
      cornerPoints: [
        { y: 82, x: 16 },
        { y: 70, x: 306 },
        { y: 111, x: 307 },
        { y: 123, x: 17 },
      ],
      text: 'cumin (sachet)',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 132, height: 104, left: 18, width: 177 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 134, height: 46, left: 36, width: 156 },
              cornerPoints: [
                { y: 141, x: 36 },
                { y: 134, x: 191 },
                { y: 173, x: 192 },
                { y: 180, x: 37 },
              ],
              text: 'merguez',
            },
          ],
          frame: { top: 134, height: 46, left: 36, width: 156 },
          cornerPoints: [
            { y: 141, x: 36 },
            { y: 134, x: 191 },
            { y: 173, x: 192 },
            { y: 180, x: 37 },
          ],
          text: 'merguez',
        },
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          elements: [
            {
              frame: { top: 190, height: 46, left: 21, width: 106 },
              cornerPoints: [
                { y: 197, x: 21 },
                { y: 190, x: 125 },
                { y: 229, x: 127 },
                { y: 236, x: 23 },
              ],
              text: 'navet',
            },
          ],
          frame: { top: 190, height: 46, left: 21, width: 106 },
          cornerPoints: [
            { y: 197, x: 21 },
            { y: 190, x: 125 },
            { y: 229, x: 127 },
            { y: 236, x: 23 },
          ],
          text: 'navet',
        },
      ],
      cornerPoints: [
        { y: 142, x: 18 },
        { y: 132, x: 191 },
        { y: 226, x: 195 },
        { y: 236, x: 22 },
      ],
      text: 'merguez\nnavet',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 238, height: 57, left: 10, width: 543 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          elements: [
            {
              frame: { top: 248, height: 47, left: 10, width: 171 },
              cornerPoints: [
                { y: 254, x: 10 },
                { y: 248, x: 180 },
                { y: 289, x: 181 },
                { y: 295, x: 11 },
              ],
              text: 'pommes',
            },
            {
              frame: { top: 247, height: 42, left: 189, width: 50 },
              cornerPoints: [
                { y: 249, x: 189 },
                { y: 247, x: 238 },
                { y: 287, x: 239 },
                { y: 289, x: 190 },
              ],
              text: 'de',
            },
            {
              frame: { top: 243, height: 45, left: 249, width: 104 },
              cornerPoints: [
                { y: 247, x: 249 },
                { y: 243, x: 352 },
                { y: 284, x: 353 },
                { y: 288, x: 250 },
              ],
              text: 'terre',
            },
            {
              frame: { top: 240, height: 45, left: 361, width: 134 },
              cornerPoints: [
                { y: 244, x: 361 },
                { y: 240, x: 494 },
                { y: 281, x: 495 },
                { y: 285, x: 362 },
              ],
              text: 'jaunes',
            },
            {
              frame: { top: 238, height: 42, left: 507, width: 46 },
              cornerPoints: [
                { y: 240, x: 507 },
                { y: 238, x: 552 },
                { y: 278, x: 553 },
                { y: 280, x: 508 },
              ],
              text: '(g)',
            },
          ],
          frame: { top: 238, height: 57, left: 10, width: 543 },
          cornerPoints: [
            { y: 254, x: 10 },
            { y: 238, x: 552 },
            { y: 279, x: 553 },
            { y: 295, x: 11 },
          ],
          text: 'pommes de terre jaunes (g)',
        },
      ],
      cornerPoints: [
        { y: 254, x: 10 },
        { y: 238, x: 552 },
        { y: 279, x: 553 },
        { y: 295, x: 11 },
      ],
      text: 'pommes de terre jaunes (g)',
    },
  ],
  text: 'carotte\ncumin (sachet)\nmerguez\nnavet\npommes de terre jaunes (g)',
};

export const quantitiesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 221, height: 33, left: 113, width: 19 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          elements: [
            {
              frame: { top: 221, height: 33, left: 113, width: 19 },
              cornerPoints: [
                { y: 221, x: 113 },
                { y: 221, x: 132 },
                { y: 254, x: 132 },
                { y: 254, x: 113 },
              ],
              text: '1',
            },
          ],
          frame: { top: 221, height: 33, left: 113, width: 19 },
          cornerPoints: [
            { y: 221, x: 113 },
            { y: 221, x: 132 },
            { y: 254, x: 132 },
            { y: 254, x: 113 },
          ],
          text: '1',
        },
      ],
      cornerPoints: [
        { y: 221, x: 113 },
        { y: 221, x: 132 },
        { y: 254, x: 132 },
        { y: 254, x: 113 },
      ],
      text: '1',
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 277, height: 35, left: 81, width: 79 },
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          elements: [
            {
              frame: { top: 277, height: 35, left: 81, width: 79 },
              cornerPoints: [
                { y: 277, x: 81 },
                { y: 277, x: 160 },
                { y: 312, x: 160 },
                { y: 312, x: 81 },
              ],
              text: '400',
            },
          ],
          frame: { top: 277, height: 35, left: 81, width: 79 },
          cornerPoints: [
            { y: 277, x: 81 },
            { y: 277, x: 160 },
            { y: 312, x: 160 },
            { y: 312, x: 81 },
          ],
          text: '400',
        },
      ],
      cornerPoints: [
        { y: 277, x: 81 },
        { y: 277, x: 160 },
        { y: 312, x: 160 },
        { y: 312, x: 81 },
      ],
      text: '400',
    },
  ],
  text: '1\n400',
};

export const expectedIngredientNames: FormIngredientElement[] = [
  { name: 'carotte', unit: '' },
  { name: 'cumin', unit: 'sachet' },
  { name: 'merguez', unit: '' },
  { name: 'navet', unit: '' },
  { name: 'pommes de terre jaunes', unit: 'g' },
];

export const expectedQuantities: string[] = ['1', '400'];

export const expectedIosIngredientNames: FormIngredientElement[] = [
  { name: 'carotte', unit: '' },
  { name: 'cumin', unit: 'sachet' },
  { name: 'merguez', unit: '' },
  { name: 'navet', unit: '' },
  { name: 'pommes de terre jaunes (g', unit: '' },
];

export const iosQuantitiesOcrResult: TextRecognitionResult = {
  blocks: [
    {
      frame: { top: 48, width: 24, height: 34, left: 118 },
      cornerPoints: [
        { x: 120, y: 48 },
        { x: 141.97544860839844, y: 49.03901290893555 },
        { x: 140.4641571044922, y: 81.00330352783203 },
        { x: 118.48870849609375, y: 79.96429443359375 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 48, width: 24, height: 34, left: 118 },
              text: '1',
              cornerPoints: [
                { x: 120, y: 48 },
                { x: 141.97544860839844, y: 49.03901290893555 },
                { x: 140.4641571044922, y: 81.00330352783203 },
                { x: 118.48870849609375, y: 79.96429443359375 },
              ],
            },
          ],
          frame: { top: 48, width: 24, height: 34, left: 118 },
          cornerPoints: [
            { x: 120, y: 48 },
            { x: 141.97544860839844, y: 49.03901290893555 },
            { x: 140.4641571044922, y: 81.00330352783203 },
            { x: 118.48870849609375, y: 79.96429443359375 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '1',
        },
      ],
      text: '1',
    },
    {
      frame: { top: 106, width: 19, height: 32, left: 115 },
      cornerPoints: [
        { x: 115, y: 106 },
        { x: 134, y: 106 },
        { x: 134, y: 138 },
        { x: 115, y: 138 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 106, width: 19, height: 32, left: 115 },
              text: '1',
              cornerPoints: [
                { x: 115, y: 106 },
                { x: 134, y: 106 },
                { x: 134, y: 138 },
                { x: 115, y: 138 },
              ],
            },
          ],
          frame: { top: 106, width: 19, height: 32, left: 115 },
          cornerPoints: [
            { x: 115, y: 106 },
            { x: 134, y: 106 },
            { x: 134, y: 138 },
            { x: 115, y: 138 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '1',
        },
      ],
      text: '1',
    },
    {
      frame: { top: 163, width: 24, height: 32, left: 110 },
      cornerPoints: [
        { x: 110, y: 164 },
        { x: 132.9915313720703, y: 163.37579345703125 },
        { x: 133.83285522460938, y: 194.3643798828125 },
        { x: 110.84131622314453, y: 194.98858642578125 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 163, width: 24, height: 32, left: 110 },
              text: '4',
              cornerPoints: [
                { x: 110, y: 164 },
                { x: 132.9915313720703, y: 163.37579345703125 },
                { x: 133.83285522460938, y: 194.3643798828125 },
                { x: 110.84131622314453, y: 194.98858642578125 },
              ],
            },
          ],
          frame: { top: 163, width: 24, height: 32, left: 110 },
          cornerPoints: [
            { x: 110, y: 164 },
            { x: 132.9915313720703, y: 163.37579345703125 },
            { x: 133.83285522460938, y: 194.3643798828125 },
            { x: 110.84131622314453, y: 194.98858642578125 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '4',
        },
      ],
      text: '4',
    },
    {
      frame: { top: 214, width: 69, height: 45, left: 70 },
      cornerPoints: [
        { x: 70, y: 214 },
        { x: 139, y: 214 },
        { x: 139, y: 259 },
        { x: 70, y: 259 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 214, width: 69, height: 45, left: 70 },
              text: '1',
              cornerPoints: [
                { x: 70, y: 214 },
                { x: 139, y: 214 },
                { x: 139, y: 259 },
                { x: 70, y: 259 },
              ],
            },
          ],
          frame: { top: 214, width: 69, height: 45, left: 70 },
          cornerPoints: [
            { x: 70, y: 214 },
            { x: 139, y: 214 },
            { x: 139, y: 259 },
            { x: 70, y: 259 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '1',
        },
      ],
      text: '1',
    },
    {
      frame: { top: 278, width: 75, height: 33, left: 82 },
      cornerPoints: [
        { x: 82, y: 278 },
        { x: 157, y: 278 },
        { x: 157, y: 311 },
        { x: 82, y: 311 },
      ],
      recognizedLanguages: [],
      lines: [
        {
          elements: [
            {
              frame: { top: 278, width: 75, height: 33, left: 82 },
              text: '400',
              cornerPoints: [
                { x: 82, y: 278 },
                { x: 157, y: 278 },
                { x: 157, y: 311 },
                { x: 82, y: 311 },
              ],
            },
          ],
          frame: { top: 278, width: 75, height: 33, left: 82 },
          cornerPoints: [
            { x: 82, y: 278 },
            { x: 157, y: 278 },
            { x: 157, y: 311 },
            { x: 82, y: 311 },
          ],
          recognizedLanguages: [{ languageCode: '' }],
          text: '400',
        },
      ],
      text: '400',
    },
  ],
  text: '1\n1\n4\n1\n400',
};

export const expectedIosQuantities: string[] = ['1', '1', '4', '1', '400'];

/**
 * Servings/time matrix as ML Kit returns it on iOS for the full recto card.
 *
 * Captured on an iPhone 16e simulator against
 * `tests/assets/tajineMerguez/tajineMerguez_Quitoque_Full_Recto.jpg` — on iOS 26.2
 * from the app's own cropped input, on iOS 18.6 by calling
 * `TextRecognition.recognize()` on the file. Both return these same lines. Each
 * line carries a serving count and its own time, unlike the per-column blocks
 * Android returns.
 */
export const iosPersonsAndTimeOcrResult: TextRecognitionResult = {
  blocks: [
    {
      frame: { top: 23, width: 409, height: 63, left: 88 },
      cornerPoints: [
        { x: 90, y: 23 },
        { x: 496.9153137207031, y: 31.30203628540039 },
        { x: 495.8138122558594, y: 85.29080200195312 },
        { x: 88.89849853515625, y: 76.98876190185547 },
      ],
      recognizedLanguages: [{ languageCode: 'sv' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 23, width: 40, height: 55, left: 88 },
              text: '2',
              cornerPoints: [
                { x: 90, y: 23 },
                { x: 127.99209594726562, y: 23.775129318237305 },
                { x: 126.89059448242188, y: 77.7638931274414 },
                { x: 88.89849853515625, y: 76.98876190185547 },
              ],
            },
            {
              frame: { top: 28, width: 126, height: 50, left: 133 },
              text: 'pers.',
              cornerPoints: [
                { x: 134, y: 28 },
                { x: 258.99444580078125, y: 29.17609214782715 },
                { x: 258.5428161621094, y: 77.17396545410156 },
                { x: 133.5483856201172, y: 75.99787902832031 },
              ],
            },
            {
              frame: { top: 30, width: 62, height: 41, left: 329 },
              text: '25',
              cornerPoints: [
                { x: 330, y: 30 },
                { x: 390.997314453125, y: 30.573932647705078 },
                { x: 390.6209716796875, y: 70.57215881347656 },
                { x: 329.6236572265625, y: 69.99822998046875 },
              ],
            },
            {
              frame: { top: 32, width: 88, height: 40, left: 409 },
              text: 'min',
              cornerPoints: [
                { x: 410, y: 32 },
                { x: 496.99615478515625, y: 32.81856155395508 },
                { x: 496.62921142578125, y: 71.81683349609375 },
                { x: 409.633056640625, y: 70.99827575683594 },
              ],
            },
          ],
          frame: { top: 23, width: 409, height: 63, left: 88 },
          cornerPoints: [
            { x: 90, y: 23 },
            { x: 496.9153137207031, y: 31.30203628540039 },
            { x: 495.8138122558594, y: 85.29080200195312 },
            { x: 88.89849853515625, y: 76.98876190185547 },
          ],
          recognizedLanguages: [{ languageCode: 'sv' }],
          text: '2 pers. 25 min',
        },
      ],
      text: '2 pers. 25 min',
    },
    {
      frame: { top: 79, width: 430, height: 210, left: 94 },
      cornerPoints: [
        { x: 103, y: 79 },
        { x: 523.52978515625, y: 98.89258575439453 },
        { x: 514.5521240234375, y: 288.68035888671875 },
        { x: 94.02234649658203, y: 268.78778076171875 },
      ],
      recognizedLanguages: [{ languageCode: 'en' }],
      lines: [
        {
          elements: [
            {
              frame: { top: 91, width: 29, height: 42, left: 100 },
              text: '3',
              cornerPoints: [
                { x: 102, y: 91 },
                { x: 128.9698486328125, y: 92.27577209472656 },
                { x: 127.07981872558594, y: 132.23109436035156 },
                { x: 100.10997009277344, y: 130.955322265625 },
              ],
            },
            {
              frame: { top: 92, width: 131, height: 52, left: 134 },
              text: 'pers.',
              cornerPoints: [
                { x: 135, y: 92 },
                { x: 264.9931335449219, y: 93.33590698242188 },
                { x: 264.47930908203125, y: 143.33326721191406 },
                { x: 134.48619079589844, y: 141.9973602294922 },
              ],
            },
            {
              frame: { top: 95, width: 60, height: 40, left: 335 },
              text: '25',
              cornerPoints: [
                { x: 336, y: 95 },
                { x: 394.99688720703125, y: 95.60629272460938 },
                { x: 394.59613037109375, y: 134.60423278808594 },
                { x: 335.5992431640625, y: 133.99794006347656 },
              ],
            },
            {
              frame: { top: 96, width: 88, height: 40, left: 413 },
              text: 'min',
              cornerPoints: [
                { x: 414, y: 96 },
                { x: 500.99542236328125, y: 96.89402770996094 },
                { x: 500.59466552734375, y: 135.8919677734375 },
                { x: 413.5992431640625, y: 134.99794006347656 },
              ],
            },
          ],
          frame: { top: 79, width: 403, height: 80, left: 100 },
          cornerPoints: [
            { x: 103, y: 79 },
            { x: 502.55322265625, y: 97.90031433105469 },
            { x: 499.6709289550781, y: 158.83218383789062 },
            { x: 100.1176986694336, y: 139.93186950683594 },
          ],
          recognizedLanguages: [{ languageCode: 'en' }],
          text: '3 pers. 25 min',
        },
        {
          elements: [
            {
              frame: { top: 156, width: 37, height: 53, left: 98 },
              text: '4',
              cornerPoints: [
                { x: 98, y: 156 },
                { x: 135, y: 156 },
                { x: 135, y: 209 },
                { x: 98, y: 209 },
              ],
            },
            {
              frame: { top: 156, width: 133, height: 53, left: 138 },
              text: 'pers.',
              cornerPoints: [
                { x: 138, y: 156 },
                { x: 271, y: 156 },
                { x: 271, y: 209 },
                { x: 138, y: 209 },
              ],
            },
            {
              frame: { top: 158, width: 64, height: 44, left: 337 },
              text: '30',
              cornerPoints: [
                { x: 339, y: 158 },
                { x: 400.9599609375, y: 160.22743225097656 },
                { x: 399.4869689941406, y: 201.20095825195312 },
                { x: 337.5270080566406, y: 198.97352600097656 },
              ],
            },
            {
              frame: { top: 160, width: 87, height: 41, left: 418 },
              text: 'min',
              cornerPoints: [
                { x: 418, y: 160 },
                { x: 505, y: 160 },
                { x: 505, y: 201 },
                { x: 418, y: 201 },
              ],
            },
          ],
          frame: { top: 156, width: 407, height: 53, left: 98 },
          cornerPoints: [
            { x: 98, y: 156 },
            { x: 505, y: 156 },
            { x: 505, y: 209 },
            { x: 98, y: 209 },
          ],
          recognizedLanguages: [{ languageCode: 'sv' }],
          text: '4 pers. 30 min',
        },
        {
          elements: [
            {
              frame: { top: 220, width: 26, height: 42, left: 104 },
              text: '5',
              cornerPoints: [
                { x: 105, y: 220 },
                { x: 129.998779296875, y: 220.24742126464844 },
                { x: 129.59300231933594, y: 261.24542236328125 },
                { x: 104.59422302246094, y: 260.99798583984375 },
              ],
            },
            {
              frame: { top: 232, width: 118, height: 39, left: 149 },
              text: 'pers.',
              cornerPoints: [
                { x: 150, y: 232 },
                { x: 266.9942626953125, y: 233.157958984375 },
                { x: 266.6280822753906, y: 270.1561584472656 },
                { x: 149.63380432128906, y: 268.9981994628906 },
              ],
            },
            {
              frame: { top: 221, width: 82, height: 51, left: 333 },
              text: '30',
              cornerPoints: [
                { x: 334, y: 221 },
                { x: 414.99603271484375, y: 221.80166625976562 },
                { x: 414.5011901855469, y: 271.7992248535156 },
                { x: 333.5051574707031, y: 270.99755859375 },
              ],
            },
            {
              frame: { top: 222, width: 99, height: 51, left: 416 },
              text: 'min',
              cornerPoints: [
                { x: 417, y: 222 },
                { x: 514.9951782226562, y: 222.96990966796875 },
                { x: 514.5003051757812, y: 272.96746826171875 },
                { x: 416.5051574707031, y: 271.99755859375 },
              ],
            },
          ],
          frame: { top: 219, width: 411, height: 55, left: 104 },
          cornerPoints: [
            { x: 105, y: 219 },
            { x: 514.9799194335938, y: 223.05780029296875 },
            { x: 514.4850463867188, y: 273.05535888671875 },
            { x: 104.5051498413086, y: 268.99755859375 },
          ],
          recognizedLanguages: [{ languageCode: 'en' }],
          text: '5 pers. 30 min',
        },
      ],
      text: '3 pers. 25 min\n4 pers. 30 min\n5 pers. 30 min',
    },
  ],
  text: '2 pers. 25 min\n3 pers. 25 min\n4 pers. 30 min\n5 pers. 30 min',
};

/** Servings paired with the time printed alongside them on the card. */
export const expectedIosPersonsAndTime = [
  { person: 2, time: 25 },
  { person: 3, time: 25 },
  { person: 4, time: 30 },
  { person: 5, time: 30 },
];
