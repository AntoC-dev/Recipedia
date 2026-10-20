import TextRecognition, {
  CornerPoints,
  TextRecognitionResult,
} from '@react-native-ml-kit/text-recognition';
import { ImageManipulator } from 'expo-image-manipulator';
import {
  mockImageRef,
  mockManipulatorContext,
  setMockImageDimensions,
} from '@mocks/deps/expo-image-manipulator-mock';
import {
  buildBlocksResult,
  buildLine,
  buildResult,
  sidewaysCorners,
  uprightCorners,
} from '@data/ocrMocks/builders';
import { mockFileDelete } from '@mocks/deps/expo-file-system-mock';
import { ocrLogger } from '@utils/logger';
import {
  clampUpscaleFactor,
  computeStrips,
  hasSidewaysText,
  isSideways,
  MAX_OCR_RETRY_SIDE_PX,
  medianLineHeight,
  mergeStripResults,
  ML_KIT_MIN_CHARACTER_PX,
  ML_KIT_OPTIMAL_CHARACTER_PX,
  readCharacterCount,
  readImageText,
  transformResult,
  upscaleFactorFor,
} from '@utils/OcrRecognition';

jest.mock('expo-file-system', () =>
  require('@mocks/deps/expo-file-system-mock').expoFileSystemMock()
);

const mockRecognize = TextRecognition.recognize as jest.Mock;
const mockSaveAsync = mockImageRef.saveAsync as jest.Mock;

function linesTextOf(result: TextRecognitionResult): string[] {
  return result.blocks.flatMap(block => block.lines.map(line => line.text));
}

function savedImage(uri: string, width: number, height: number) {
  return { uri, width, height };
}

function deletedFileNames(): string[] {
  return mockFileDelete.mock.calls.map(([uri]: [string]) => uri.split('/').pop() ?? uri).sort();
}

describe('OcrRecognition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileDelete.mockReset();
    setMockImageDimensions(200, 200);
    mockSaveAsync.mockResolvedValue(savedImage('file://normalized.png', 200, 200));
  });

  describe('isSideways', () => {
    test('is false for text read left to right', () => {
      expect(isSideways(uprightCorners(0, 20))).toBe(false);
    });

    test('is true for text read top to bottom', () => {
      expect(isSideways(sidewaysCorners(0, 190))).toBe(true);
    });

    test('is false for a line exactly on the diagonal', () => {
      const diagonal: CornerPoints = [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 40, y: 60 },
        { x: -10, y: 10 },
      ];

      expect(isSideways(diagonal)).toBe(false);
    });

    test('is false for a slightly tilted line', () => {
      const tilted: CornerPoints = [
        { x: 0, y: 0 },
        { x: 100, y: 20 },
        { x: 95, y: 45 },
        { x: -5, y: 25 },
      ];

      expect(isSideways(tilted)).toBe(false);
    });
  });

  describe('hasSidewaysText', () => {
    test('is true when most lines are sideways', () => {
      const result = buildResult([
        { text: 'HHH', top: 19, height: 193, sideways: true },
        { text: 'III', top: 300, height: 193, sideways: true },
        { text: '1', top: 600, height: 20 },
      ]);

      expect(hasSidewaysText(result)).toBe(true);
    });

    test('is false when most lines are upright', () => {
      const result = buildResult([
        { text: '1', top: 0, height: 20 },
        { text: '200', top: 40, height: 20 },
        { text: 'HHH', top: 80, height: 190, sideways: true },
      ]);

      expect(hasSidewaysText(result)).toBe(false);
    });

    test('is false when exactly half of the lines are sideways', () => {
      const result = buildResult([
        { text: '1', top: 0, height: 20 },
        { text: 'HHH', top: 80, height: 190, sideways: true },
      ]);

      expect(hasSidewaysText(result)).toBe(false);
    });

    test('is false for an empty result', () => {
      expect(hasSidewaysText({ text: '', blocks: [] })).toBe(false);
    });

    test('ignores lines without corner points', () => {
      const result = buildResult([{ text: 'HHH', top: 0, height: 190, sideways: true }]);
      const lineWithoutCorners = { ...buildLine({ text: '1', top: 0, height: 20 }) };
      delete lineWithoutCorners.cornerPoints;
      result.blocks.push({ text: '1', recognizedLanguages: [], lines: [lineWithoutCorners] });
      result.blocks.push({ text: '2', recognizedLanguages: [], lines: [lineWithoutCorners] });

      expect(hasSidewaysText(result)).toBe(true);
    });
  });

  describe('medianLineHeight', () => {
    test('returns the middle height of an odd number of lines', () => {
      const result = buildResult([
        { text: 'a', top: 0, height: 30 },
        { text: 'b', top: 40, height: 10 },
        { text: 'c', top: 80, height: 20 },
      ]);

      expect(medianLineHeight(result)).toBe(20);
    });

    test('returns the lower middle height of an even number of lines', () => {
      const result = buildResult([
        { text: 'a', top: 0, height: 12 },
        { text: 'b', top: 40, height: 40 },
      ]);

      expect(medianLineHeight(result)).toBe(12);
    });

    test('is undefined when no line has a frame', () => {
      const line = buildLine({ text: 'a', top: 0, height: 10 });
      delete line.frame;

      expect(
        medianLineHeight({
          text: 'a',
          blocks: [{ text: 'a', recognizedLanguages: [], lines: [line] }],
        })
      ).toBeUndefined();
    });

    test('ignores zero-height frames', () => {
      const result = buildResult([
        { text: 'a', top: 0, height: 0 },
        { text: 'b', top: 40, height: 18 },
      ]);

      expect(medianLineHeight(result)).toBe(18);
    });
  });

  describe('upscaleFactorFor', () => {
    test('scales undersized text to the optimal character size', () => {
      expect(upscaleFactorFor(12)).toBe(ML_KIT_OPTIMAL_CHARACTER_PX / 12);
    });

    test('is undefined at the minimum character size', () => {
      expect(upscaleFactorFor(ML_KIT_MIN_CHARACTER_PX)).toBeUndefined();
    });

    test('is undefined without any measurable line', () => {
      expect(upscaleFactorFor(undefined)).toBeUndefined();
    });
  });

  describe('clampUpscaleFactor', () => {
    test('keeps the wanted factor when the upscaled image fits the budget', () => {
      expect(clampUpscaleFactor(2, { width: 1000, height: 1500 })).toBe(2);
    });

    test('caps the factor so the longest side reaches the budget', () => {
      const factor = clampUpscaleFactor(3, { width: 2000, height: 1000 });

      expect(factor).toBe(MAX_OCR_RETRY_SIDE_PX / 2000);
    });

    test('is undefined when the image already reaches the budget', () => {
      expect(clampUpscaleFactor(3, { width: MAX_OCR_RETRY_SIDE_PX, height: 100 })).toBeUndefined();
    });

    test('is undefined when the image exceeds the budget', () => {
      expect(clampUpscaleFactor(3, { width: 4032, height: 6000 })).toBeUndefined();
    });
  });

  describe('readCharacterCount', () => {
    test('counts non-whitespace characters of every line', () => {
      const result = buildBlocksResult([
        [
          { text: '1 pièce', top: 0, height: 20 },
          { text: ' 200 g ', top: 30, height: 20 },
        ],
        [{ text: 'a\tb', top: 60, height: 20 }],
      ]);

      expect(readCharacterCount(result)).toBe(6 + 4 + 2);
    });

    test('is zero for an empty result', () => {
      expect(readCharacterCount({ text: '', blocks: [] })).toBe(0);
    });
  });

  describe('computeStrips', () => {
    test('returns the whole image when it is not taller than wide', () => {
      expect(computeStrips({ width: 300, height: 200 })).toEqual([{ originY: 0, height: 200 }]);
      expect(computeStrips({ width: 200, height: 200 })).toEqual([{ originY: 0, height: 200 }]);
    });

    test('splits a tall image into half-overlapping square strips ending at the bottom', () => {
      expect(computeStrips({ width: 200, height: 500 })).toEqual([
        { originY: 0, height: 200 },
        { originY: 100, height: 200 },
        { originY: 200, height: 200 },
        { originY: 300, height: 200 },
      ]);
    });

    test('rounds strip positions when the width is odd', () => {
      expect(computeStrips({ width: 217, height: 500 })).toEqual([
        { originY: 0, height: 217 },
        { originY: 109, height: 217 },
        { originY: 217, height: 217 },
        { originY: 283, height: 217 },
      ]);
    });

    test('adds a bottom-aligned strip when the image is barely taller than wide', () => {
      expect(computeStrips({ width: 200, height: 250 })).toEqual([
        { originY: 0, height: 200 },
        { originY: 50, height: 200 },
      ]);
    });

    test('does not repeat the last strip when its rounded origin equals the bottom-aligned one', () => {
      expect(computeStrips({ width: 3, height: 5 })).toEqual([
        { originY: 0, height: 3 },
        { originY: 2, height: 3 },
      ]);
    });

    test('returns no strip for a non-positive width', () => {
      expect(computeStrips({ width: 0, height: 500 })).toEqual([]);
      expect(computeStrips({ width: -10, height: 500 })).toEqual([]);
    });

    test('returns no strip for a non-positive height', () => {
      expect(computeStrips({ width: 200, height: 0 })).toEqual([]);
    });

    test('covers the full height of the curry quantities column', () => {
      const strips = computeStrips({ width: 218, height: 946 });
      const lastStrip = strips[strips.length - 1];

      expect(strips[0]).toEqual({ originY: 0, height: 218 });
      expect(lastStrip).toEqual({ originY: 946 - 218, height: 218 });
      strips.slice(1).forEach((strip, index) => {
        expect(strip.originY - (strips[index]?.originY ?? 0)).toBeLessThanOrEqual(109);
      });
    });
  });

  describe('transformResult', () => {
    test('scales and offsets frames and corner points of blocks, lines and elements', () => {
      const result = buildResult([{ text: 'a', top: 10, height: 20 }]);

      const transformed = transformResult(result, 0.5, 100);
      const block = transformed.blocks[0];
      const line = block?.lines[0];

      expect(block?.frame).toEqual({ top: 105, left: 0, width: 50, height: 10 });
      expect(line?.frame).toEqual({ top: 105, left: 0, width: 50, height: 10 });
      expect(line?.elements[0]?.frame).toEqual({ top: 105, left: 0, width: 50, height: 10 });
      expect(line?.cornerPoints).toEqual([
        { x: 0, y: 105 },
        { x: 50, y: 105 },
        { x: 50, y: 115 },
        { x: 0, y: 115 },
      ]);
      expect(transformed.text).toBe('a');
    });

    test('preserves texts and recognized languages', () => {
      const result = buildResult([{ text: 'a', top: 10, height: 20 }]);
      result.blocks[0]!.recognizedLanguages = [{ languageCode: 'fr' }];

      const transformed = transformResult(result, 2, 0);

      expect(transformed.text).toBe('a');
      expect(transformed.blocks[0]?.text).toBe('a');
      expect(transformed.blocks[0]?.recognizedLanguages).toEqual([{ languageCode: 'fr' }]);
      expect(transformed.blocks[0]?.lines[0]?.elements[0]?.text).toBe('a');
    });

    test('keeps items without geometry untouched', () => {
      const line = buildLine({ text: 'a', top: 0, height: 10 });
      delete line.frame;
      delete line.cornerPoints;
      const result = { text: 'a', blocks: [{ text: 'a', recognizedLanguages: [], lines: [line] }] };

      const transformed = transformResult(result, 2, 5);

      expect(transformed.blocks[0]?.lines[0]?.frame).toBeUndefined();
      expect(transformed.blocks[0]?.lines[0]?.cornerPoints).toBeUndefined();
    });
  });

  describe('mergeStripResults', () => {
    const imageHeight = 400;

    test('offsets lines into full-image coordinates and orders them top to bottom', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 200, height: 200 },
            result: buildResult([{ text: '3', top: 50, height: 20 }]),
          },
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([{ text: '1', top: 50, height: 20 }]),
          },
        ],
        imageHeight
      );

      expect(linesTextOf(merged)).toEqual(['1', '3']);
      expect(merged.text).toBe('1\n3');
      expect(merged.blocks[1]?.lines[0]?.frame?.top).toBe(250);
      expect(merged.blocks[1]?.frame?.top).toBe(250);
    });

    test('keeps a line seen in two overlapping strips once', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([{ text: '200', top: 150, height: 20 }]),
          },
          {
            strip: { originY: 100, height: 200 },
            result: buildResult([{ text: '200', top: 50, height: 20 }]),
          },
        ],
        imageHeight
      );

      expect(linesTextOf(merged)).toEqual(['200']);
    });

    test('keeps identical texts read at different positions', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([
              { text: '1', top: 10, height: 20 },
              { text: '1', top: 60, height: 20 },
            ]),
          },
        ],
        200
      );

      expect(linesTextOf(merged)).toEqual(['1', '1']);
    });

    test('drops lines cut by an inner strip edge', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([
              { text: '1', top: 10, height: 20 },
              { text: 'cut', top: 190, height: 10 },
            ]),
          },
          {
            strip: { originY: 100, height: 200 },
            result: buildResult([
              { text: 'cut-top', top: 0, height: 15 },
              { text: '100', top: 95, height: 20 },
            ]),
          },
        ],
        imageHeight
      );

      expect(linesTextOf(merged)).toEqual(['1', '100']);
    });

    test('keeps lines touching the outer edges of the image', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([{ text: 'first', top: 0, height: 20 }]),
          },
          {
            strip: { originY: 200, height: 200 },
            result: buildResult([{ text: 'last', top: 180, height: 20 }]),
          },
        ],
        imageHeight
      );

      expect(linesTextOf(merged)).toEqual(['first', 'last']);
    });

    test('drops lines without a frame since their position is unknown', () => {
      const frameless = buildLine({ text: 'x', top: 0, height: 10 });
      delete frameless.frame;
      const stripResult = {
        text: 'x',
        blocks: [{ text: 'x', recognizedLanguages: [], lines: [frameless] }],
      };

      const merged = mergeStripResults(
        [
          { strip: { originY: 0, height: 200 }, result: stripResult },
          { strip: { originY: 100, height: 200 }, result: stripResult },
        ],
        imageHeight
      );

      expect(merged).toEqual({ text: '', blocks: [] });
    });

    test('keeps two lines of the same row in one strip', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([
              { text: '1', top: 50, height: 20, left: 0, width: 20 },
              { text: 'pièce', top: 50, height: 20, left: 30, width: 60 },
            ]),
          },
        ],
        200
      );

      expect(linesTextOf(merged)).toEqual(['1', 'pièce']);
    });

    test('keeps two identical overlapping lines of the same strip', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([
              { text: 'a', top: 50, height: 20 },
              { text: 'b', top: 50, height: 20 },
            ]),
          },
        ],
        200
      );

      expect(linesTextOf(merged)).toEqual(['a', 'b']);
    });

    test('keeps lines of the same row without horizontal overlap from two strips', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([{ text: 'left', top: 150, height: 20, left: 0, width: 40 }]),
          },
          {
            strip: { originY: 100, height: 200 },
            result: buildResult([{ text: 'right', top: 50, height: 20, left: 60, width: 40 }]),
          },
        ],
        imageHeight
      );

      expect(linesTextOf(merged)).toEqual(['left', 'right']);
    });

    test('keeps the copy farthest from the strip edges when the later strip is more centered', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([{ text: 'near edge', top: 150, height: 20 }]),
          },
          {
            strip: { originY: 100, height: 200 },
            result: buildResult([{ text: 'centered', top: 50, height: 20 }]),
          },
        ],
        imageHeight
      );

      expect(linesTextOf(merged)).toEqual(['centered']);
    });

    test('keeps the copy farthest from the strip edges when the earlier strip is more centered', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([{ text: 'centered', top: 120, height: 20 }]),
          },
          {
            strip: { originY: 100, height: 200 },
            result: buildResult([{ text: 'near edge', top: 20, height: 20 }]),
          },
        ],
        imageHeight
      );

      expect(linesTextOf(merged)).toEqual(['centered']);
    });

    test('drops a line near a cut edge when another strip fully contains it', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([
              { text: 'ok', top: 10, height: 20 },
              { text: 'half cut', top: 175, height: 20 },
            ]),
          },
          { strip: { originY: 100, height: 200 }, result: { text: '', blocks: [] } },
        ],
        imageHeight
      );

      expect(linesTextOf(merged)).toEqual(['ok']);
    });

    test('keeps a line near a cut edge when no other strip fully contains it', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([{ text: 'lonely', top: 175, height: 20 }]),
          },
        ],
        imageHeight
      );

      expect(linesTextOf(merged)).toEqual(['lonely']);
    });

    test('keeps once a line too tall to sit away from the cut edges of any strip', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([{ text: 'tall upper copy', top: 115, height: 60 }]),
          },
          {
            strip: { originY: 100, height: 200 },
            result: buildResult([{ text: 'tall lower copy', top: 15, height: 60 }]),
          },
        ],
        imageHeight
      );

      expect(linesTextOf(merged)).toEqual(['tall upper copy']);
    });

    test('keeps a tall whole line near a cut edge and drops its truncated copy', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([{ text: 'trunc', top: 140, height: 60 }]),
          },
          {
            strip: { originY: 100, height: 200 },
            result: buildResult([{ text: 'whole', top: 40, height: 90 }]),
          },
        ],
        imageHeight
      );

      expect(linesTextOf(merged)).toEqual(['whole']);
    });

    test('keeps a replaced line in the block of the copy seen first', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildBlocksResult([
              [
                { text: '1. Cuire', top: 110, height: 20 },
                { text: 'les pâtes edge', top: 160, height: 20 },
              ],
            ]),
          },
          {
            strip: { originY: 100, height: 200 },
            result: buildResult([{ text: 'les pâtes', top: 60, height: 20 }]),
          },
        ],
        imageHeight
      );

      expect(merged.blocks).toHaveLength(1);
      expect(merged.blocks[0]?.text).toBe('1. Cuire\nles pâtes');
    });

    test('keeps a line outside the cut edge tolerance', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([{ text: 'whole', top: 168, height: 20 }]),
          },
        ],
        imageHeight
      );

      expect(linesTextOf(merged)).toEqual(['whole']);
    });

    test('keeps lines of a block grouped in one block', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 100, height: 200 },
            result: buildBlocksResult([
              [
                { text: '1. Cuire', top: 20, height: 20 },
                { text: 'les pâtes', top: 50, height: 20 },
              ],
              [{ text: '2. Servir', top: 100, height: 20 }],
            ]),
          },
        ],
        imageHeight
      );

      expect(merged.blocks).toHaveLength(2);
      expect(merged.blocks[0]?.text).toBe('1. Cuire\nles pâtes');
      expect(merged.blocks[0]?.lines).toHaveLength(2);
      expect(merged.blocks[0]?.frame).toEqual({ top: 120, left: 0, width: 100, height: 50 });
      expect(merged.blocks[1]?.text).toBe('2. Servir');
      expect(merged.text).toBe('1. Cuire\nles pâtes\n2. Servir');
    });

    test('does not group lines of different strips even with the same block index', () => {
      const merged = mergeStripResults(
        [
          {
            strip: { originY: 0, height: 200 },
            result: buildResult([{ text: 'a', top: 10, height: 20 }]),
          },
          {
            strip: { originY: 200, height: 200 },
            result: buildResult([{ text: 'b', top: 10, height: 20 }]),
          },
        ],
        imageHeight
      );

      expect(merged.blocks.map(block => block.text)).toEqual(['a', 'b']);
    });

    test('preserves the recognized languages of the source block', () => {
      const result = buildResult([{ text: 'a', top: 10, height: 20 }]);
      result.blocks[0]!.recognizedLanguages = [{ languageCode: 'fr' }];

      const merged = mergeStripResults([{ strip: { originY: 0, height: 200 }, result }], 200);

      expect(merged.blocks[0]?.recognizedLanguages).toEqual([{ languageCode: 'fr' }]);
    });

    test('returns an empty result when no strip has text', () => {
      expect(
        mergeStripResults(
          [{ strip: { originY: 0, height: 200 }, result: { text: '', blocks: [] } }],
          200
        )
      ).toEqual({ text: '', blocks: [] });
    });
  });

  describe('readImageText', () => {
    test('recognizes the input file directly, adding the file scheme when missing', async () => {
      const upright = buildResult([{ text: '1', top: 0, height: 20 }]);
      mockRecognize.mockResolvedValueOnce(upright);

      const result = await readImageText('/path/image.jpg');

      expect(mockRecognize).toHaveBeenCalledTimes(1);
      expect(mockRecognize).toHaveBeenCalledWith('file:///path/image.jpg');
      expect(ImageManipulator.manipulate).not.toHaveBeenCalled();
      expect(result).toBe(upright);
    });

    test('renders the original only once a retry is needed', async () => {
      mockRecognize
        .mockResolvedValueOnce(buildResult([{ text: 'HHH', top: 19, height: 193, sideways: true }]))
        .mockResolvedValue(buildResult([{ text: '1', top: 50, height: 20 }]));
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://column.png', 200, 400));

      await readImageText('file://column.jpg');

      expect(mockRecognize).toHaveBeenNthCalledWith(1, 'file://column.jpg');
      expect(ImageManipulator.manipulate).toHaveBeenNthCalledWith(1, 'file://column.jpg');
      expect(ImageManipulator.manipulate).toHaveBeenNthCalledWith(2, 'file://column.png');
    });

    test('retries sideways text on strips and keeps the strips when they read more upright lines', async () => {
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://column.png', 200, 400));
      mockRecognize
        .mockResolvedValueOnce(buildResult([{ text: 'HHH', top: 19, height: 193, sideways: true }]))
        .mockResolvedValueOnce(buildResult([{ text: '1', top: 50, height: 20 }]))
        .mockResolvedValueOnce(buildResult([{ text: '200', top: 50, height: 20 }]))
        .mockResolvedValueOnce(buildResult([{ text: '100', top: 50, height: 20 }]));

      const result = await readImageText('file://column.jpg');

      expect(mockManipulatorContext.crop).toHaveBeenCalledWith({
        originX: 0,
        originY: 0,
        width: 200,
        height: 200,
      });
      expect(mockManipulatorContext.crop).toHaveBeenCalledWith({
        originX: 0,
        originY: 200,
        width: 200,
        height: 200,
      });
      expect(mockRecognize).toHaveBeenCalledTimes(4);
      expect(linesTextOf(result)).toEqual(['1', '200', '100']);
    });

    test('keeps an existing file scheme', async () => {
      mockRecognize.mockResolvedValueOnce({ text: '', blocks: [] });

      await readImageText('file:///path/image.jpg');

      expect(mockRecognize).toHaveBeenCalledWith('file:///path/image.jpg');
    });

    test('prefers strips over upscaling when text is both sideways and small', async () => {
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://column.png', 200, 400));
      const smallSideways = buildResult([{ text: 'HHH', top: 0, height: 10, sideways: true }]);
      mockRecognize.mockResolvedValue(smallSideways);

      await readImageText('file://column.jpg');

      expect(mockManipulatorContext.crop).toHaveBeenCalled();
      expect(mockManipulatorContext.resize).not.toHaveBeenCalled();
    });

    test('propagates a recognition failure', async () => {
      mockRecognize.mockRejectedValueOnce(new Error('ML Kit unavailable'));

      await expect(readImageText('file://image.jpg')).rejects.toThrow('ML Kit unavailable');
    });

    test('keeps the first pass and logs a warning when rendering for a retry fails', async () => {
      const warn = jest.spyOn(ocrLogger, 'warn').mockImplementation(() => undefined);
      const sideways = buildResult([{ text: 'HHH', top: 19, height: 193, sideways: true }]);
      mockRecognize.mockResolvedValueOnce(sideways);
      mockSaveAsync.mockRejectedValueOnce(new Error('unreadable image'));

      const result = await readImageText('file://image.jpg');

      expect(result).toBe(sideways);
      expect(mockImageRef.release).toHaveBeenCalledTimes(1);
      expect(mockRecognize).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith('OCR retry failed, keeping first pass', expect.anything());
    });

    test('keeps the first pass when recognizing a strip fails', async () => {
      const sideways = buildResult([{ text: 'HHH', top: 19, height: 193, sideways: true }]);
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://column.png', 200, 400));
      mockRecognize
        .mockResolvedValueOnce(sideways)
        .mockRejectedValueOnce(new Error('ML Kit unavailable'));

      const result = await readImageText('file://column.jpg');

      expect(result).toBe(sideways);
    });

    test('keeps the first pass when recognizing the upscaled copy fails', async () => {
      const small = buildResult([{ text: 'l00', top: 10, height: 12 }]);
      setMockImageDimensions(100, 50);
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://upscaled.png', 200, 100));
      mockRecognize.mockResolvedValueOnce(small).mockRejectedValueOnce(new Error('out of memory'));

      const result = await readImageText('file://small.jpg');

      expect(result).toBe(small);
    });

    test('processes strips one after the other', async () => {
      const cropCountsAtRecognition: number[] = [];
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://column.png', 200, 500));
      mockRecognize
        .mockResolvedValueOnce(buildResult([{ text: 'HHH', top: 19, height: 193, sideways: true }]))
        .mockImplementation(async () => {
          cropCountsAtRecognition.push(mockManipulatorContext.crop.mock.calls.length);
          return buildResult([{ text: '1', top: 50, height: 20 }]);
        });

      await readImageText('file://column.jpg');

      expect(cropCountsAtRecognition).toEqual([1, 2, 3, 4]);
      expect(
        mockManipulatorContext.crop.mock.calls.map(
          ([region]: [{ originY: number }]) => region.originY
        )
      ).toEqual([0, 100, 200, 300]);
    });

    test('keeps the first pass when the rendered image has no strip', async () => {
      const sideways = buildResult([{ text: 'HHH', top: 19, height: 193, sideways: true }]);
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://empty.png', 0, 0));
      mockRecognize.mockResolvedValueOnce(sideways);

      const result = await readImageText('file://empty.jpg');

      expect(result).toBe(sideways);
      expect(mockRecognize).toHaveBeenCalledTimes(1);
    });

    test('keeps the first pass when strips read no more upright lines', async () => {
      const sideways = buildResult([{ text: 'HHH', top: 19, height: 193, sideways: true }]);
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://column.png', 200, 400));
      mockRecognize
        .mockResolvedValueOnce(sideways)
        .mockResolvedValueOnce(sideways)
        .mockResolvedValueOnce(sideways)
        .mockResolvedValueOnce(sideways);

      const result = await readImageText('file://column.jpg');

      expect(mockRecognize).toHaveBeenCalledTimes(4);
      expect(result).toBe(sideways);
    });

    test('does not re-read a sideways image that cannot be split into several strips', async () => {
      const sideways = buildResult([{ text: 'HHH', top: 19, height: 193, sideways: true }]);
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://wide.png', 400, 200));
      mockRecognize.mockResolvedValueOnce(sideways);

      const result = await readImageText('file://wide.jpg');

      expect(mockRecognize).toHaveBeenCalledTimes(1);
      expect(mockManipulatorContext.crop).not.toHaveBeenCalled();
      expect(result).toBe(sideways);
    });

    test('retries undersized text on an upscaled copy and maps it back', async () => {
      setMockImageDimensions(100, 50);
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://upscaled.png', 200, 100));
      mockRecognize
        .mockResolvedValueOnce(buildResult([{ text: 'l00', top: 10, height: 12 }]))
        .mockResolvedValueOnce(buildResult([{ text: '100', top: 20, height: 24 }]));

      const result = await readImageText('file://small.jpg');

      expect(ImageManipulator.manipulate).toHaveBeenNthCalledWith(1, 'file://small.jpg');
      expect(ImageManipulator.manipulate).toHaveBeenNthCalledWith(2, 'file://small.jpg');
      expect(mockManipulatorContext.resize).toHaveBeenCalledWith({ width: 200, height: 100 });
      expect(mockRecognize).toHaveBeenLastCalledWith('file://upscaled.png');
      expect(linesTextOf(result)).toEqual(['100']);
      expect(result.blocks[0]?.lines[0]?.frame).toEqual({
        top: 10,
        left: 0,
        width: 50,
        height: 12,
      });
    });

    test('caps the upscaled size on a large image', async () => {
      setMockImageDimensions(4032, 3024);
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://upscaled.png', 4096, 3072));
      mockRecognize
        .mockResolvedValueOnce(buildResult([{ text: 'l00', top: 10, height: 8 }]))
        .mockResolvedValueOnce(buildResult([{ text: '100', top: 10, height: 8 }]));

      await readImageText('file://photo.jpg');

      expect(mockManipulatorContext.resize).toHaveBeenCalledWith({
        width: MAX_OCR_RETRY_SIDE_PX,
        height: 3072,
      });
    });

    test('skips the upscale retry when the image already exceeds the budget', async () => {
      const small = buildResult([{ text: 'l00', top: 10, height: 8 }]);
      setMockImageDimensions(5000, 4000);
      mockRecognize.mockResolvedValueOnce(small);

      const result = await readImageText('file://huge.jpg');

      expect(mockManipulatorContext.resize).not.toHaveBeenCalled();
      expect(mockSaveAsync).not.toHaveBeenCalled();
      expect(mockImageRef.release).toHaveBeenCalledTimes(1);
      expect(mockRecognize).toHaveBeenCalledTimes(1);
      expect(result).toBe(small);
    });

    test('keeps the first pass when the upscaled copy reads less text', async () => {
      const small = buildResult([{ text: '100 g', top: 10, height: 12 }]);
      setMockImageDimensions(100, 50);
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://upscaled.png', 200, 100));
      mockRecognize
        .mockResolvedValueOnce(small)
        .mockResolvedValueOnce(buildResult([{ text: '1', top: 20, height: 24 }]));

      const result = await readImageText('file://small.jpg');

      expect(result).toBe(small);
    });

    test('keeps the upscaled copy when it reads more text', async () => {
      setMockImageDimensions(100, 50);
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://upscaled.png', 200, 100));
      mockRecognize
        .mockResolvedValueOnce(buildResult([{ text: '1', top: 10, height: 12 }]))
        .mockResolvedValueOnce(buildResult([{ text: '100 g', top: 20, height: 24 }]));

      const result = await readImageText('file://small.jpg');

      expect(linesTextOf(result)).toEqual(['100 g']);
    });

    test('does not upscale text at a readable size', async () => {
      mockRecognize.mockResolvedValueOnce(buildResult([{ text: '100', top: 10, height: 30 }]));

      await readImageText('file://big.jpg');

      expect(mockManipulatorContext.resize).not.toHaveBeenCalled();
      expect(mockRecognize).toHaveBeenCalledTimes(1);
    });

    test('deletes the rendered image and every strip once the strip retry is done', async () => {
      mockSaveAsync
        .mockResolvedValueOnce(savedImage('file://column.png', 200, 400))
        .mockResolvedValueOnce(savedImage('file://strip-0.png', 200, 200))
        .mockResolvedValueOnce(savedImage('file://strip-1.png', 200, 200))
        .mockResolvedValueOnce(savedImage('file://strip-2.png', 200, 200));
      mockRecognize
        .mockResolvedValueOnce(buildResult([{ text: 'HHH', top: 19, height: 193, sideways: true }]))
        .mockResolvedValue(buildResult([{ text: '1', top: 50, height: 20 }]));

      await readImageText('file://column.jpg');

      expect(deletedFileNames()).toEqual([
        'column.png',
        'strip-0.png',
        'strip-1.png',
        'strip-2.png',
      ]);
    });

    test('deletes the upscaled copy once the upscale retry is done', async () => {
      setMockImageDimensions(100, 50);
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://upscaled.png', 200, 100));
      mockRecognize
        .mockResolvedValueOnce(buildResult([{ text: 'l00', top: 10, height: 12 }]))
        .mockResolvedValueOnce(buildResult([{ text: '100', top: 20, height: 24 }]));

      await readImageText('file://small.jpg');

      expect(deletedFileNames()).toEqual(['upscaled.png']);
    });

    test('deletes the upscaled copy even when recognizing the copy fails', async () => {
      setMockImageDimensions(100, 50);
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://upscaled.png', 200, 100));
      mockRecognize
        .mockResolvedValueOnce(buildResult([{ text: 'l00', top: 10, height: 12 }]))
        .mockRejectedValueOnce(new Error('out of memory'));

      await readImageText('file://small.jpg');

      expect(deletedFileNames()).toEqual(['upscaled.png']);
    });

    test('writes no file when the image is too large to upscale', async () => {
      setMockImageDimensions(5000, 4000);
      mockRecognize.mockResolvedValueOnce(buildResult([{ text: 'l00', top: 10, height: 8 }]));

      await readImageText('file://huge.jpg');

      expect(mockSaveAsync).not.toHaveBeenCalled();
      expect(mockFileDelete).not.toHaveBeenCalled();
    });

    test('deletes the rendered image when it cannot be split into strips', async () => {
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://wide.png', 400, 200));
      mockRecognize.mockResolvedValueOnce(
        buildResult([{ text: 'HHH', top: 19, height: 193, sideways: true }])
      );

      await readImageText('file://wide.jpg');

      expect(mockFileDelete).toHaveBeenCalledWith(expect.stringMatching(/\/wide\.png$/));
    });

    test('keeps the retry result and logs when a rendered image cannot be deleted', async () => {
      const debug = jest.spyOn(ocrLogger, 'debug').mockImplementation(() => undefined);
      mockFileDelete.mockImplementation(() => {
        throw new Error('file locked');
      });
      setMockImageDimensions(100, 50);
      mockSaveAsync.mockResolvedValueOnce(savedImage('file://upscaled.png', 200, 100));
      mockRecognize
        .mockResolvedValueOnce(buildResult([{ text: 'l00', top: 10, height: 12 }]))
        .mockResolvedValueOnce(buildResult([{ text: '100', top: 20, height: 24 }]));

      const result = await readImageText('file://small.jpg');

      expect(linesTextOf(result)).toEqual(['100']);
      expect(debug).toHaveBeenCalledWith('OCR rendered PNG not deleted', {
        uri: 'file://upscaled.png',
        error: 'Error: file locked',
      });
    });
    test('returns an empty first pass as is', async () => {
      mockRecognize.mockResolvedValueOnce({ text: '', blocks: [] });

      const result = await readImageText('file://blank.jpg');

      expect(result).toEqual({ text: '', blocks: [] });
      expect(mockRecognize).toHaveBeenCalledTimes(1);
    });
  });
});
