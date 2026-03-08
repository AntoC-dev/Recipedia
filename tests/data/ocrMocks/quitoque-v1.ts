/* eslint-disable no-loss-of-precision */
import { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { FormIngredientElement } from '@customTypes/DatabaseElementTypes';

export const iosNamesOcrResult: TextRecognitionResult = {
  text: 'carotte\ncumin (sachet)\nmerguez\nnavet\npommes de terre jaunes (g',
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'it' }],
      frame: { top: 18, width: 154, height: 47, left: 10 },
      cornerPoints: [
        { x: 10, y: 25 },
        { x: 161.85791015625, y: 18.429386138916016 },
        { x: 163.58702087402344, y: 58.39199447631836 },
        { x: 11.729108810424805, y: 64.96260833740234 },
      ],
      text: 'carotte',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'it' }],
          frame: { top: 18, width: 154, height: 47, left: 10 },
          cornerPoints: [
            { x: 10, y: 25 },
            { x: 161.85791015625, y: 18.429386138916016 },
            { x: 163.58702087402344, y: 58.39199447631836 },
            { x: 11.729108810424805, y: 64.96260833740234 },
          ],
          text: 'carotte',
          elements: [
            {
              frame: { top: 18, width: 154, height: 47, left: 10 },
              cornerPoints: [
                { x: 10, y: 25 },
                { x: 161.85791015625, y: 18.429386138916016 },
                { x: 163.58702087402344, y: 58.39199447631836 },
                { x: 11.729108810424805, y: 64.96260833740234 },
              ],
              text: 'carotte',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 72, width: 292, height: 47, left: 16 },
      cornerPoints: [
        { x: 16, y: 81 },
        { x: 306.87176513671875, y: 72.36190795898438 },
        { x: 307.999755859375, y: 110.34516143798828 },
        { x: 17.12799835205078, y: 118.9832534790039 },
      ],
      text: 'cumin (sachet)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 72, width: 292, height: 47, left: 16 },
          cornerPoints: [
            { x: 16, y: 81 },
            { x: 306.87176513671875, y: 72.36190795898438 },
            { x: 307.999755859375, y: 110.34516143798828 },
            { x: 17.12799835205078, y: 118.9832534790039 },
          ],
          text: 'cumin (sachet)',
          elements: [
            {
              frame: { top: 79, width: 122, height: 36, left: 16 },
              cornerPoints: [
                { x: 16, y: 83 },
                { x: 136.94668579101562, y: 79.40821838378906 },
                { x: 137.89657592773438, y: 111.39411926269531 },
                { x: 16.949893951416016, y: 114.98590087890625 },
              ],
              text: 'cumin',
            },
            {
              frame: { top: 72, width: 159, height: 43, left: 150 },
              cornerPoints: [
                { x: 150, y: 77 },
                { x: 306.9308166503906, y: 72.33958435058594 },
                { x: 308.0588073730469, y: 110.32283782958984 },
                { x: 151.12799072265625, y: 114.9832534790039 },
              ],
              text: '(sachet)',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 134, width: 181, height: 47, left: 12 },
      cornerPoints: [
        { x: 12, y: 141 },
        { x: 190.86827087402344, y: 134.13388061523438 },
        { x: 192.40260314941406, y: 174.1044464111328 },
        { x: 13.53432846069336, y: 180.97056579589844 },
      ],
      text: 'merguez',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 134, width: 181, height: 47, left: 12 },
          cornerPoints: [
            { x: 12, y: 141 },
            { x: 190.86827087402344, y: 134.13388061523438 },
            { x: 192.40260314941406, y: 174.1044464111328 },
            { x: 13.53432846069336, y: 180.97056579589844 },
          ],
          text: 'merguez',
          elements: [
            {
              frame: { top: 134, width: 181, height: 47, left: 12 },
              cornerPoints: [
                { x: 12, y: 141 },
                { x: 190.86827087402344, y: 134.13388061523438 },
                { x: 192.40260314941406, y: 174.1044464111328 },
                { x: 13.53432846069336, y: 180.97056579589844 },
              ],
              text: 'merguez',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 190, width: 126, height: 45, left: 1 },
      cornerPoints: [
        { x: 1, y: 195 },
        { x: 124.90086364746094, y: 190.0426483154297 },
        { x: 126.50001525878906, y: 230.0106658935547 },
        { x: 2.5991477966308594, y: 234.968017578125 },
      ],
      text: 'navet',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 190, width: 126, height: 45, left: 1 },
          cornerPoints: [
            { x: 1, y: 195 },
            { x: 124.90086364746094, y: 190.0426483154297 },
            { x: 126.50001525878906, y: 230.0106658935547 },
            { x: 2.5991477966308594, y: 234.968017578125 },
          ],
          text: 'navet',
          elements: [
            {
              frame: { top: 190, width: 126, height: 45, left: 1 },
              cornerPoints: [
                { x: 1, y: 195 },
                { x: 124.90086364746094, y: 190.0426483154297 },
                { x: 126.50001525878906, y: 230.0106658935547 },
                { x: 2.5991477966308594, y: 234.968017578125 },
              ],
              text: 'navet',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'fr' }],
      frame: { top: 243, width: 540, height: 48, left: 8 },
      cornerPoints: [
        { x: 8, y: 253 },
        { x: 546.9141845703125, y: 243.38307189941406 },
        { x: 547.5921630859375, y: 281.37701416015625 },
        { x: 8.67800235748291, y: 290.99395751953125 },
      ],
      text: 'pommes de terre jaunes (g',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 243, width: 540, height: 48, left: 8 },
          cornerPoints: [
            { x: 8, y: 253 },
            { x: 546.9141845703125, y: 243.38307189941406 },
            { x: 547.5921630859375, y: 281.37701416015625 },
            { x: 8.67800235748291, y: 290.99395751953125 },
          ],
          text: 'pommes de terre jaunes (g',
          elements: [
            {
              frame: { top: 257, width: 174, height: 34, left: 8 },
              cornerPoints: [
                { x: 8, y: 261 },
                { x: 180.9724578857422, y: 257.9132995605469 },
                { x: 181.50772094726562, y: 287.90850830078125 },
                { x: 8.53526496887207, y: 290.9952392578125 },
              ],
              text: 'pommes',
            },
            {
              frame: { top: 249, width: 52, height: 32, left: 190 },
              cornerPoints: [
                { x: 190, y: 250 },
                { x: 240.99188232421875, y: 249.09005737304688 },
                { x: 241.54498291015625, y: 280.0851135253906 },
                { x: 190.5531005859375, y: 280.99505615234375 },
              ],
              text: 'de',
            },
            {
              frame: { top: 247, width: 106, height: 34, left: 250 },
              cornerPoints: [
                { x: 250, y: 249 },
                { x: 354.9832763671875, y: 247.12657165527344 },
                { x: 355.5542297363281, y: 279.1214904785156 },
                { x: 250.57095336914062, y: 280.9949035644531 },
              ],
              text: 'terre',
            },
            {
              frame: { top: 244, width: 136, height: 41, left: 362 },
              cornerPoints: [
                { x: 362, y: 247 },
                { x: 496.978515625, y: 244.59130859375 },
                { x: 497.6565246582031, y: 282.58526611328125 },
                { x: 362.6780090332031, y: 284.99395751953125 },
              ],
              text: 'jaunes',
            },
            {
              frame: { top: 243, width: 40, height: 39, left: 508 },
              cornerPoints: [
                { x: 508, y: 244 },
                { x: 546.9937744140625, y: 243.3041534423828 },
                { x: 547.6717529296875, y: 281.298095703125 },
                { x: 508.6780090332031, y: 281.99395751953125 },
              ],
              text: '(g',
            },
          ],
        },
      ],
    },
  ],
};

export const androidNamesOcrResult: TextRecognitionResult = {
  text: 'carotte\ncumin (sachet)\nmerguez\nnavet\npommes de terre jaunes ()',
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 13, height: 108, left: 14, width: 293 },
      cornerPoints: [
        { y: 25, x: 14 },
        { y: 13, x: 304 },
        { y: 109, x: 307 },
        { y: 121, x: 17 },
      ],
      text: 'carotte\ncumin (sachet)',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'it' }],
          frame: { top: 18, height: 42, left: 34, width: 139 },
          cornerPoints: [
            { y: 24, x: 34 },
            { y: 18, x: 172 },
            { y: 54, x: 173 },
            { y: 60, x: 35 },
          ],
          text: 'carotte',
          elements: [
            {
              frame: { top: 18, height: 42, left: 34, width: 139 },
              cornerPoints: [
                { y: 24, x: 34 },
                { y: 18, x: 172 },
                { y: 54, x: 173 },
                { y: 60, x: 35 },
              ],
              text: 'carotte',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 71, height: 50, left: 16, width: 291 },
          cornerPoints: [
            { y: 82, x: 16 },
            { y: 71, x: 306 },
            { y: 110, x: 307 },
            { y: 121, x: 17 },
          ],
          text: 'cumin (sachet)',
          elements: [
            {
              frame: { top: 77, height: 44, left: 16, width: 121 },
              cornerPoints: [
                { y: 82, x: 16 },
                { y: 77, x: 136 },
                { y: 116, x: 137 },
                { y: 121, x: 17 },
              ],
              text: 'cumin',
            },
            {
              frame: { top: 71, height: 45, left: 149, width: 158 },
              cornerPoints: [
                { y: 77, x: 149 },
                { y: 71, x: 306 },
                { y: 110, x: 307 },
                { y: 116, x: 150 },
              ],
              text: '(sachet)',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 133, height: 103, left: 22, width: 171 },
      cornerPoints: [
        { y: 143, x: 22 },
        { y: 133, x: 188 },
        { y: 226, x: 193 },
        { y: 236, x: 27 },
      ],
      text: 'merguez\nnavet',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 135, height: 45, left: 43, width: 146 },
          cornerPoints: [
            { y: 142, x: 43 },
            { y: 135, x: 188 },
            { y: 173, x: 189 },
            { y: 180, x: 44 },
          ],
          text: 'merguez',
          elements: [
            {
              frame: { top: 135, height: 45, left: 43, width: 146 },
              cornerPoints: [
                { y: 142, x: 43 },
                { y: 135, x: 188 },
                { y: 173, x: 189 },
                { y: 180, x: 44 },
              ],
              text: 'merguez',
            },
          ],
        },
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 188, height: 48, left: 25, width: 106 },
          cornerPoints: [
            { y: 195, x: 25 },
            { y: 188, x: 129 },
            { y: 229, x: 131 },
            { y: 236, x: 27 },
          ],
          text: 'navet',
          elements: [
            {
              frame: { top: 188, height: 48, left: 25, width: 106 },
              cornerPoints: [
                { y: 195, x: 25 },
                { y: 188, x: 129 },
                { y: 229, x: 131 },
                { y: 236, x: 27 },
              ],
              text: 'navet',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 236, height: 59, left: 8, width: 545 },
      cornerPoints: [
        { y: 252, x: 8 },
        { y: 236, x: 552 },
        { y: 279, x: 553 },
        { y: 295, x: 9 },
      ],
      text: 'pommes de terre jaunes ()',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'fr' }],
          frame: { top: 236, height: 59, left: 8, width: 545 },
          cornerPoints: [
            { y: 252, x: 8 },
            { y: 236, x: 552 },
            { y: 279, x: 553 },
            { y: 295, x: 9 },
          ],
          text: 'pommes de terre jaunes ()',
          elements: [
            {
              frame: { top: 247, height: 48, left: 8, width: 171 },
              cornerPoints: [
                { y: 252, x: 8 },
                { y: 247, x: 178 },
                { y: 290, x: 179 },
                { y: 295, x: 9 },
              ],
              text: 'pommes',
            },
            {
              frame: { top: 245, height: 44, left: 189, width: 50 },
              cornerPoints: [
                { y: 247, x: 189 },
                { y: 245, x: 238 },
                { y: 287, x: 239 },
                { y: 289, x: 190 },
              ],
              text: 'de',
            },
            {
              frame: { top: 243, height: 45, left: 249, width: 106 },
              cornerPoints: [
                { y: 246, x: 249 },
                { y: 243, x: 354 },
                { y: 285, x: 355 },
                { y: 288, x: 250 },
              ],
              text: 'terre',
            },
            {
              frame: { top: 238, height: 47, left: 361, width: 136 },
              cornerPoints: [
                { y: 242, x: 361 },
                { y: 238, x: 496 },
                { y: 281, x: 497 },
                { y: 285, x: 362 },
              ],
              text: 'jaunes',
            },
            {
              frame: { top: 236, height: 44, left: 507, width: 46 },
              cornerPoints: [
                { y: 238, x: 507 },
                { y: 236, x: 552 },
                { y: 278, x: 553 },
                { y: 280, x: 508 },
              ],
              text: '()',
            },
          ],
        },
      ],
    },
  ],
};

export const quantitiesOcrResult: TextRecognitionResult = {
  text: '400',
  blocks: [
    {
      recognizedLanguages: [{ languageCode: 'und' }],
      frame: { top: 277, height: 35, left: 81, width: 79 },
      cornerPoints: [
        { y: 277, x: 81 },
        { y: 277, x: 160 },
        { y: 312, x: 160 },
        { y: 312, x: 81 },
      ],
      text: '400',
      lines: [
        {
          recognizedLanguages: [{ languageCode: 'und-Latn' }],
          frame: { top: 277, height: 35, left: 81, width: 79 },
          cornerPoints: [
            { y: 277, x: 81 },
            { y: 277, x: 160 },
            { y: 312, x: 160 },
            { y: 312, x: 81 },
          ],
          text: '400',
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
        },
      ],
    },
  ],
};

export const expectedIngredientNames: FormIngredientElement[] = [
  { name: 'carotte', unit: '' },
  { name: 'cumin', unit: 'sachet' },
  { name: 'merguez', unit: '' },
  { name: 'navet', unit: '' },
  { name: 'pommes de terre jaunes', unit: '' },
];

export const expectedQuantities: string[] = ['400'];

export const expectedIosIngredientNames: FormIngredientElement[] = [
  { name: 'carotte', unit: '' },
  { name: 'cumin', unit: 'sachet' },
  { name: 'merguez', unit: '' },
  { name: 'navet', unit: '' },
  { name: 'pommes de terre jaunes (g', unit: '' },
];

export const iosQuantitiesOcrResult: TextRecognitionResult = {
  text: '1\n1\n4\n1\n400',
  blocks: [
    {
      recognizedLanguages: [],
      frame: { top: 47, width: 23, height: 36, left: 118 },
      cornerPoints: [
        { x: 118, y: 50 },
        { x: 135.8307647705078, y: 47.53752899169922 },
        { x: 140.3452911376953, y: 80.22726440429688 },
        { x: 122.51453399658203, y: 82.68974304199219 },
      ],
      text: '1',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 47, width: 23, height: 36, left: 118 },
          cornerPoints: [
            { x: 118, y: 50 },
            { x: 135.8307647705078, y: 47.53752899169922 },
            { x: 140.3452911376953, y: 80.22726440429688 },
            { x: 122.51453399658203, y: 82.68974304199219 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 47, width: 23, height: 36, left: 118 },
              cornerPoints: [
                { x: 118, y: 50 },
                { x: 135.8307647705078, y: 47.53752899169922 },
                { x: 140.3452911376953, y: 80.22726440429688 },
                { x: 122.51453399658203, y: 82.68974304199219 },
              ],
              text: '1',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 106, width: 19, height: 32, left: 115 },
      cornerPoints: [
        { x: 115, y: 106 },
        { x: 134, y: 106 },
        { x: 134, y: 138 },
        { x: 115, y: 138 },
      ],
      text: '1',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 106, width: 19, height: 32, left: 115 },
          cornerPoints: [
            { x: 115, y: 106 },
            { x: 134, y: 106 },
            { x: 134, y: 138 },
            { x: 115, y: 138 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 106, width: 19, height: 32, left: 115 },
              cornerPoints: [
                { x: 115, y: 106 },
                { x: 134, y: 106 },
                { x: 134, y: 138 },
                { x: 115, y: 138 },
              ],
              text: '1',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 162, width: 26, height: 33, left: 109 },
      cornerPoints: [
        { x: 110, y: 162 },
        { x: 134.99765014648438, y: 162.34315490722656 },
        { x: 134.55841064453125, y: 194.3401336669922 },
        { x: 109.5607681274414, y: 193.99697875976562 },
      ],
      text: '4',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 162, width: 26, height: 33, left: 109 },
          cornerPoints: [
            { x: 110, y: 162 },
            { x: 134.99765014648438, y: 162.34315490722656 },
            { x: 134.55841064453125, y: 194.3401336669922 },
            { x: 109.5607681274414, y: 193.99697875976562 },
          ],
          text: '4',
          elements: [
            {
              frame: { top: 162, width: 26, height: 33, left: 109 },
              cornerPoints: [
                { x: 110, y: 162 },
                { x: 134.99765014648438, y: 162.34315490722656 },
                { x: 134.55841064453125, y: 194.3401336669922 },
                { x: 109.5607681274414, y: 193.99697875976562 },
              ],
              text: '4',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 220, width: 22, height: 34, left: 111 },
      cornerPoints: [
        { x: 112, y: 220 },
        { x: 132.99899291992188, y: 220.2058868408203 },
        { x: 132.6754608154297, y: 253.2042999267578 },
        { x: 111.67646789550781, y: 252.9984130859375 },
      ],
      text: '1',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 220, width: 22, height: 34, left: 111 },
          cornerPoints: [
            { x: 112, y: 220 },
            { x: 132.99899291992188, y: 220.2058868408203 },
            { x: 132.6754608154297, y: 253.2042999267578 },
            { x: 111.67646789550781, y: 252.9984130859375 },
          ],
          text: '1',
          elements: [
            {
              frame: { top: 220, width: 22, height: 34, left: 111 },
              cornerPoints: [
                { x: 112, y: 220 },
                { x: 132.99899291992188, y: 220.2058868408203 },
                { x: 132.6754608154297, y: 253.2042999267578 },
                { x: 111.67646789550781, y: 252.9984130859375 },
              ],
              text: '1',
            },
          ],
        },
      ],
    },
    {
      recognizedLanguages: [],
      frame: { top: 276, width: 74, height: 36, left: 81 },
      cornerPoints: [
        { x: 82, y: 276 },
        { x: 154.99246215820312, y: 277.0496826171875 },
        { x: 154.50357055664062, y: 311.0461730957031 },
        { x: 81.5111083984375, y: 309.9964904785156 },
      ],
      text: '400',
      lines: [
        {
          recognizedLanguages: [{ languageCode: '' }],
          frame: { top: 276, width: 74, height: 36, left: 81 },
          cornerPoints: [
            { x: 82, y: 276 },
            { x: 154.99246215820312, y: 277.0496826171875 },
            { x: 154.50357055664062, y: 311.0461730957031 },
            { x: 81.5111083984375, y: 309.9964904785156 },
          ],
          text: '400',
          elements: [
            {
              frame: { top: 276, width: 74, height: 36, left: 81 },
              cornerPoints: [
                { x: 82, y: 276 },
                { x: 154.99246215820312, y: 277.0496826171875 },
                { x: 154.50357055664062, y: 311.0461730957031 },
                { x: 81.5111083984375, y: 309.9964904785156 },
              ],
              text: '400',
            },
          ],
        },
      ],
    },
  ],
};

export const expectedIosQuantities: string[] = ['1', '1', '4', '1', '400'];
