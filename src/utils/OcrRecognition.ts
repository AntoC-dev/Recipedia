/**
 * OcrRecognition - ML Kit text recognition that corrects its own unreliable reads
 *
 * ML Kit output is sensitive to how the input image was produced and to the size of the text in
 * it. This module gives every OCR caller one entry point, {@link readImageText}, which:
 *
 * 1. Runs a first recognition pass directly on the input file, with no re-encoding.
 * 2. Re-runs recognition on overlapping horizontal strips when ML Kit read the text sideways
 *    (typically a narrow column of short lines merged into one vertical "word").
 * 3. Re-runs recognition on an upscaled copy when the recognized lines are smaller than ML Kit's
 *    documented minimum character size.
 *
 * Retries need pixel dimensions and a cropable source, so the input is rendered lazily, only when a
 * retry is required. Every returned frame and corner point is expressed in the coordinates of the
 * input image, so callers can keep sorting and grouping by position.
 *
 * @see https://developers.google.com/ml-kit/vision/text-recognition/v2/android#input-image-guidelines
 */

import { File } from 'expo-file-system';
import { ImageManipulator, ImageManipulatorContext, SaveFormat } from 'expo-image-manipulator';
import TextRecognition, {
  CornerPoints,
  Frame,
  Point,
  TextBlock,
  TextLine,
  TextRecognitionResult,
} from '@react-native-ml-kit/text-recognition';
import { ImageSize } from '@utils/imageResize';
import { ocrLogger } from '@utils/logger';
import { epochMillis } from '@utils/time';

/** ML Kit input guideline: each character should be at least this many pixels tall. */
export const ML_KIT_MIN_CHARACTER_PX = 16;

/** ML Kit input guideline: characters larger than this many pixels bring no accuracy benefit. */
export const ML_KIT_OPTIMAL_CHARACTER_PX = 24;

/**
 * Longest side, in pixels, an upscaled retry image may have. A 4096 x 4096 RGBA bitmap takes about
 * 64 MB and 4096 is the texture size limit common to mobile GPUs, so staying under it keeps the
 * resize from exhausting native memory on large camera photos.
 */
export const MAX_OCR_RETRY_SIDE_PX = 4096;

/**
 * A line whose frame lies closer than this fraction of its own height to an inner strip edge is
 * considered cut by that edge. ML Kit frames a half-visible line a few pixels inside the edge
 * rather than on it, so a fixed pixel tolerance would not scale with the text size.
 */
const CUT_EDGE_TOLERANCE_RATIO = 0.5;

type OcrImage = ImageSize & { uri: string };

type OcrStrip = { originY: number; height: number };

type Geometry = { frame?: Frame; cornerPoints?: CornerPoints };

type PlacedLine = {
  line: TextLine;
  stripIndex: number;
  groupKey: string;
  edgeDistance: number;
  recognizedLanguages: TextBlock['recognizedLanguages'];
};

async function renderToPng(context: ImageManipulatorContext): Promise<OcrImage> {
  const imageRef = await context.renderAsync();
  try {
    const { uri, width, height } = await imageRef.saveAsync({ format: SaveFormat.PNG });
    ocrLogger.debug('OCR rendered PNG', { uri, width, height });
    return { uri, width, height };
  } finally {
    imageRef.release();
  }
}

async function readImageSize(uri: string): Promise<ImageSize> {
  const imageRef = await ImageManipulator.manipulate(uri).renderAsync();
  const { width, height } = imageRef;
  imageRef.release();
  return { width, height };
}

function deleteRenderedImage(uri: string): void {
  try {
    new File(uri).delete();
  } catch (error) {
    ocrLogger.debug('OCR rendered PNG not deleted', { uri, error: String(error) });
  }
}

/**
 * Renders a manipulation to a lossless PNG, runs a callback on it and always deletes the PNG
 * afterwards. Failing to delete is not fatal since the file lives in the cache directory, which the
 * OS purges eventually.
 */
async function withRenderedPng<T>(
  context: ImageManipulatorContext,
  run: (image: OcrImage) => Promise<T>
): Promise<T> {
  const image = await renderToPng(context);
  try {
    return await run(image);
  } finally {
    deleteRenderedImage(image.uri);
  }
}

/**
 * Tells whether a set of corner points describes text running more vertically than horizontally.
 *
 * ML Kit orders corner points clockwise from the top-left of the text, so the first edge follows
 * the reading direction.
 *
 * @param cornerPoints - Corner points of a recognized line
 * @returns True when the reading direction is closer to vertical than to horizontal
 */
export function isSideways(cornerPoints: CornerPoints): boolean {
  const [start, end] = cornerPoints;
  return Math.abs(end.y - start.y) > Math.abs(end.x - start.x);
}

function linesOf(result: TextRecognitionResult): TextLine[] {
  return result.blocks.flatMap(block => block.lines);
}

/**
 * Tells whether most recognized lines were read sideways.
 *
 * @param result - ML Kit recognition result
 * @returns True when more than half of the lines with corner points run vertically
 */
export function hasSidewaysText(result: TextRecognitionResult): boolean {
  const oriented = linesOf(result).filter(line => line.cornerPoints !== undefined);
  const sideways = oriented.filter(line => isSideways(line.cornerPoints!));
  return sideways.length * 2 > oriented.length;
}

/**
 * Computes the median height of the recognized lines, an estimate of the character size.
 *
 * @param result - ML Kit recognition result
 * @returns Lower median line height in pixels, or undefined when no line has a frame
 */
export function medianLineHeight(result: TextRecognitionResult): number | undefined {
  const heights = linesOf(result)
    .map(line => line.frame?.height)
    .filter((height): height is number => height !== undefined && height > 0)
    .sort((a, b) => a - b);
  return heights[Math.floor((heights.length - 1) / 2)];
}

/**
 * Computes the upscale factor that brings characters to ML Kit's optimal size.
 *
 * @param characterHeight - Estimated character height in pixels, see {@link medianLineHeight}
 * @returns Scale factor greater than 1, or undefined when the characters are unknown or already
 * big enough
 */
export function upscaleFactorFor(characterHeight: number | undefined): number | undefined {
  if (characterHeight === undefined || characterHeight >= ML_KIT_MIN_CHARACTER_PX) {
    return undefined;
  }
  return ML_KIT_OPTIMAL_CHARACTER_PX / characterHeight;
}

/**
 * Clamps an upscale factor so the upscaled image stays within {@link MAX_OCR_RETRY_SIDE_PX}.
 *
 * @param scale - Wanted upscale factor
 * @param image - Dimensions of the image to upscale
 * @returns The factor to apply, or undefined when the clamped factor no longer enlarges the image
 */
export function clampUpscaleFactor(scale: number, image: ImageSize): number | undefined {
  const maxScale = MAX_OCR_RETRY_SIDE_PX / Math.max(image.width, image.height);
  const clamped = Math.min(scale, maxScale);
  return clamped > 1 ? clamped : undefined;
}

/**
 * Splits a tall image into square strips that overlap by half a strip.
 *
 * The strip side equals the image width, so each strip has the aspect ratio ML Kit reads
 * upright text best in. Half-strip overlap guarantees that any line shorter than half a strip
 * lies entirely inside at least one strip.
 *
 * @param image - Image dimensions
 * @returns Strips covering the whole image, a single strip when the image is not taller than wide,
 * or no strip when a dimension is not positive
 */
export function computeStrips(image: ImageSize): OcrStrip[] {
  const side = image.width;
  if (side <= 0 || image.height <= 0) {
    return [];
  }
  if (image.height <= side) {
    return [{ originY: 0, height: image.height }];
  }
  const stride = side / 2;
  const strips: OcrStrip[] = [];
  for (let originY = 0; originY + side < image.height; originY += stride) {
    strips.push({ originY: Math.round(originY), height: Math.round(side) });
  }
  const lastOriginY = image.height - Math.round(side);
  if (strips[strips.length - 1]?.originY !== lastOriginY) {
    strips.push({ originY: lastOriginY, height: Math.round(side) });
  }
  return strips;
}

/**
 * Applies a scale and a vertical offset to every frame and corner point of a recognition result,
 * including its blocks, lines and elements.
 *
 * @param result - Result to transform
 * @param scale - Factor applied to every coordinate
 * @param offsetY - Offset added to the vertical position after scaling
 * @returns The transformed result
 */
export function transformResult(
  result: TextRecognitionResult,
  scale: number,
  offsetY: number
): TextRecognitionResult {
  const mapPoint = ({ x, y }: Point): Point => ({ x: x * scale, y: y * scale + offsetY });
  const mapFrame = ({ top, left, width, height }: Frame): Frame => ({
    top: top * scale + offsetY,
    left: left * scale,
    width: width * scale,
    height: height * scale,
  });
  const mapCorners = ([a, b, c, d]: CornerPoints): CornerPoints => [
    mapPoint(a),
    mapPoint(b),
    mapPoint(c),
    mapPoint(d),
  ];
  const mapGeometry = <T extends Geometry>(item: T): T => ({
    ...item,
    frame: item.frame && mapFrame(item.frame),
    cornerPoints: item.cornerPoints && mapCorners(item.cornerPoints),
  });
  return {
    ...result,
    blocks: result.blocks.map(block => ({
      ...mapGeometry(block),
      lines: block.lines.map(line => ({
        ...mapGeometry(line),
        elements: line.elements.map(element => mapGeometry(element)),
      })),
    })),
  };
}

/**
 * Measures how far a line is from the edges of a strip that cut through the image.
 *
 * @param frame - Frame of the line in full-image coordinates
 * @param strip - Strip the line was recognized in
 * @param imageHeight - Height of the full image
 * @returns Distance in pixels to the nearest inner strip edge, or Infinity when the strip has none
 * near the line
 */
function distanceToCutEdge(frame: Frame, strip: OcrStrip, imageHeight: number): number {
  const stripBottom = strip.originY + strip.height;
  const toTop = strip.originY > 0 ? frame.top - strip.originY : Infinity;
  const toBottom = stripBottom < imageHeight ? stripBottom - (frame.top + frame.height) : Infinity;
  return Math.min(toTop, toBottom);
}

function isNearCutEdge(edgeDistance: number, frame: Frame): boolean {
  return edgeDistance < frame.height * CUT_EDGE_TOLERANCE_RATIO;
}

/**
 * Tells whether another strip contains a line fully and away from its own inner edges, meaning
 * that strip had the chance to read the whole line.
 *
 * @param frame - Frame of the line in full-image coordinates
 * @param stripIndex - Index of the strip the line was recognized in
 * @param strips - All strips of the image
 * @param imageHeight - Height of the full image
 * @returns True when some other strip fully and safely contains the line
 */
function isCoveredByAnotherStrip(
  frame: Frame,
  stripIndex: number,
  strips: OcrStrip[],
  imageHeight: number
): boolean {
  return strips.some((strip, index) => {
    const fitsInStrip =
      frame.top >= strip.originY && frame.top + frame.height <= strip.originY + strip.height;
    return (
      index !== stripIndex &&
      fitsInStrip &&
      !isNearCutEdge(distanceToCutEdge(frame, strip, imageHeight), frame)
    );
  });
}

/**
 * Tells whether two placed lines, from different strips, are the same line seen twice.
 *
 * Lines must overlap horizontally. Two whole lines must each contain the other's vertical center;
 * a line truncated by a strip edge only has to overlap the other vertically, since its frame covers
 * just the visible part of the line.
 *
 * @param a - First placed line
 * @param b - Second placed line
 * @returns True when both describe the same line
 */
function isSameLine(a: PlacedLine, b: PlacedLine): boolean {
  const frameA = a.line.frame!;
  const frameB = b.line.frame!;
  const overlapsHorizontally =
    frameA.left < frameB.left + frameB.width && frameB.left < frameA.left + frameA.width;
  if (!overlapsHorizontally) {
    return false;
  }
  if (isNearCutEdge(a.edgeDistance, frameA) || isNearCutEdge(b.edgeDistance, frameB)) {
    return frameA.top < frameB.top + frameB.height && frameB.top < frameA.top + frameA.height;
  }
  const centerOf = (frame: Frame) => frame.top + frame.height / 2;
  const contains = (frame: Frame, y: number) => y >= frame.top && y <= frame.top + frame.height;
  return contains(frameA, centerOf(frameB)) && contains(frameB, centerOf(frameA));
}

function buildBlock(placed: PlacedLine[]): TextBlock {
  const lines = placed.map(({ line }) => line).sort((a, b) => a.frame!.top - b.frame!.top);
  const top = Math.min(...lines.map(line => line.frame!.top));
  const left = Math.min(...lines.map(line => line.frame!.left));
  const bottom = Math.max(...lines.map(line => line.frame!.top + line.frame!.height));
  const right = Math.max(...lines.map(line => line.frame!.left + line.frame!.width));
  return {
    text: lines.map(line => line.text).join('\n'),
    frame: { top, left, width: right - left, height: bottom - top },
    recognizedLanguages: placed[0]!.recognizedLanguages,
    lines,
  };
}

/**
 * Merges the results recognized in overlapping strips into one result in full-image coordinates.
 *
 * Lines without a frame are dropped since their position, and so their duplicates, cannot be
 * known. A line within half its own height from an inner strip edge
 * may be truncated: it is dropped when another strip fully contains it, and kept otherwise, so a
 * line too tall to fit safely in any strip is never lost. A line seen in two different strips is
 * kept once, the copy farthest from its strip's inner edges, staying in the block of the copy seen
 * first. Two lines of the same strip are never merged, even on the same row. Kept lines stay
 * grouped in the block ML Kit gave them, and blocks are ordered top to bottom.
 *
 * @param stripResults - Recognition result of each strip, paired with its strip
 * @param imageHeight - Height of the full image
 * @returns The merged result
 */
export function mergeStripResults(
  stripResults: { strip: OcrStrip; result: TextRecognitionResult }[],
  imageHeight: number
): TextRecognitionResult {
  const strips = stripResults.map(({ strip }) => strip);
  const kept: PlacedLine[] = [];
  stripResults.forEach(({ strip, result }, stripIndex) => {
    transformResult(result, 1, strip.originY).blocks.forEach((block, blockIndex) => {
      for (const line of block.lines) {
        if (line.frame === undefined) {
          continue;
        }
        const edgeDistance = distanceToCutEdge(line.frame, strip, imageHeight);
        if (
          isNearCutEdge(edgeDistance, line.frame) &&
          isCoveredByAnotherStrip(line.frame, stripIndex, strips, imageHeight)
        ) {
          continue;
        }
        const candidate: PlacedLine = {
          line,
          stripIndex,
          groupKey: `${stripIndex}:${blockIndex}`,
          edgeDistance,
          recognizedLanguages: block.recognizedLanguages,
        };
        const duplicateIndex = kept.findIndex(
          existing => existing.stripIndex !== stripIndex && isSameLine(existing, candidate)
        );
        const duplicate = kept[duplicateIndex];
        if (duplicate === undefined) {
          kept.push(candidate);
        } else if (candidate.edgeDistance > duplicate.edgeDistance) {
          kept[duplicateIndex] = { ...candidate, groupKey: duplicate.groupKey };
        }
      }
    });
  });

  const groups = new Map<string, PlacedLine[]>();
  for (const placed of kept) {
    const group = groups.get(placed.groupKey);
    if (group === undefined) {
      groups.set(placed.groupKey, [placed]);
    } else {
      group.push(placed);
    }
  }
  const blocks = [...groups.values()].map(buildBlock).sort((a, b) => a.frame!.top - b.frame!.top);
  return { text: blocks.map(block => block.text).join('\n'), blocks };
}

/**
 * Recognizes text strip by strip and merges the strips back together.
 *
 * Strips are processed one after the other because each one decodes the full image, so running
 * them concurrently multiplies peak memory.
 *
 * @param image - Rendered image
 * @returns The merged result in full-image coordinates, or undefined when the image cannot be split
 * into more than one strip, since a single strip would only re-read the same image
 */
async function recognizeInStrips(image: OcrImage): Promise<TextRecognitionResult | undefined> {
  const strips = computeStrips(image);
  if (strips.length < 2) {
    return undefined;
  }
  ocrLogger.debug('OCR recognizing in strips', { stripCount: strips.length });
  const stripResults: { strip: OcrStrip; result: TextRecognitionResult }[] = [];
  for (const strip of strips) {
    const context = ImageManipulator.manipulate(image.uri);
    context.crop({ originX: 0, originY: strip.originY, width: image.width, height: strip.height });
    const result = await withRenderedPng(context, ({ uri }) => TextRecognition.recognize(uri));
    stripResults.push({ strip, result });
  }
  return mergeStripResults(stripResults, image.height);
}

async function recognizeUpscaled(
  uri: string,
  size: ImageSize,
  scale: number
): Promise<TextRecognitionResult> {
  const context = ImageManipulator.manipulate(uri);
  context.resize({
    width: Math.round(size.width * scale),
    height: Math.round(size.height * scale),
  });
  const upscaled = await withRenderedPng(context, image => TextRecognition.recognize(image.uri));
  return transformResult(upscaled, 1 / scale, 0);
}

/**
 * Counts the non-whitespace characters of every recognized line, a measure of how much text a pass
 * read. Compared between passes of the same image, so a pass that loses text scores lower.
 *
 * @param result - ML Kit recognition result
 * @returns Number of non-whitespace characters
 */
export function readCharacterCount(result: TextRecognitionResult): number {
  return linesOf(result).reduce((count, line) => count + line.text.replace(/\s/g, '').length, 0);
}

function uprightLineCount(result: TextRecognitionResult): number {
  return linesOf(result).filter(
    line => line.cornerPoints === undefined || !isSideways(line.cornerPoints)
  ).length;
}

/**
 * Decides between a retry and the first pass by comparing how well each one read the image.
 * Strips only replace the first pass when they strictly improve the upright line count, whereas an
 * upscaled copy wins ties since it is the better-sized read of the same text.
 */
function pickBetter(
  name: string,
  retry: TextRecognitionResult,
  retryScore: number,
  firstPass: TextRecognitionResult,
  firstPassScore: number,
  keepRetryOnTie: boolean
): TextRecognitionResult {
  const keepRetry = keepRetryOnTie ? retryScore >= firstPassScore : retryScore > firstPassScore;
  ocrLogger.debug(`OCR ${name} retry compared with first pass`, {
    firstPassScore,
    retryScore,
    kept: keepRetry ? name : 'firstPass',
  });
  return keepRetry ? retry : firstPass;
}

/**
 * Runs the retry that fits the weakness of a first pass.
 *
 * Sideways text takes precedence over undersized text since strips are cropped from the image at
 * its original scale and already restore the reading direction. The upscaled retry reads the
 * original file again rather than a saved copy, and only the size of the image is learned up front
 * so that an image too large to upscale never writes a file.
 *
 * @param uri - URI of the image, with its file scheme
 * @param firstPass - Result of the first pass
 * @param firstPassChars - Non-whitespace character count of the first pass
 * @returns The retry result when it is better, otherwise the first pass
 */
async function retryIfUnreliable(
  uri: string,
  firstPass: TextRecognitionResult,
  firstPassChars: number
): Promise<TextRecognitionResult> {
  if (hasSidewaysText(firstPass)) {
    const stripped = await withRenderedPng(ImageManipulator.manipulate(uri), recognizeInStrips);
    if (stripped === undefined) {
      ocrLogger.debug('OCR image cannot be split into strips, keeping first pass');
      return firstPass;
    }
    const firstPassLines = uprightLineCount(firstPass);
    return pickBetter(
      'strips',
      stripped,
      uprightLineCount(stripped),
      firstPass,
      firstPassLines,
      false
    );
  }

  const characterHeight = medianLineHeight(firstPass);
  const wantedScale = upscaleFactorFor(characterHeight);
  if (wantedScale === undefined) {
    ocrLogger.debug('OCR first pass reliable, no retry needed', {
      medianLineHeight: characterHeight,
    });
    return firstPass;
  }
  const size = await readImageSize(uri);
  const scale = clampUpscaleFactor(wantedScale, size);
  if (scale === undefined) {
    ocrLogger.debug('OCR text below ML Kit minimum size, image too large to upscale', {
      wantedScale,
    });
    return firstPass;
  }
  ocrLogger.debug('OCR text below ML Kit minimum size, retried upscaled', {
    wantedScale,
    scale,
    medianLineHeight: characterHeight,
  });
  const upscaled = await recognizeUpscaled(uri, size, scale);
  return pickBetter(
    'upscaled',
    upscaled,
    readCharacterCount(upscaled),
    firstPass,
    firstPassChars,
    true
  );
}

/**
 * Recognizes text in an image, correcting sideways reads and undersized text.
 *
 * The first pass runs directly on the input file. Only when a retry is needed is the image
 * rendered, to a lossless PNG for the strip retry and to a resized PNG for the upscale retry.
 * Sideways reads are retried on overlapping strips; the strip result is kept only when it reads
 * more upright lines than the first pass. Undersized text is retried on a copy upscaled to ML Kit's
 * optimal character size, capped at {@link MAX_OCR_RETRY_SIDE_PX}; the upscaled result is kept only
 * when it reads at least as many non-whitespace characters as the first pass. A retry that fails
 * never discards the first pass: the failure is logged and the first pass is returned.
 *
 * @param imageUri - URI of the image to recognize
 * @returns The most reliable recognition result, in the input image coordinates
 */
export async function readImageText(imageUri: string): Promise<TextRecognitionResult> {
  const uri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
  const startedAt = epochMillis();
  const firstPass = await TextRecognition.recognize(uri);
  const firstPassChars = readCharacterCount(firstPass);
  ocrLogger.debug('OCR first pass done', {
    uri,
    blocks: firstPass.blocks.length,
    lines: linesOf(firstPass).length,
    characters: firstPassChars,
    durationMs: epochMillis() - startedAt,
  });

  try {
    const result = await retryIfUnreliable(uri, firstPass, firstPassChars);
    ocrLogger.info('OCR image read', {
      keptRetry: result !== firstPass,
      lines: linesOf(result).length,
      durationMs: epochMillis() - startedAt,
    });
    return result;
  } catch (error) {
    ocrLogger.warn('OCR retry failed, keeping first pass', {
      uri,
      error: String(error),
      durationMs: epochMillis() - startedAt,
    });
    return firstPass;
  }
}
