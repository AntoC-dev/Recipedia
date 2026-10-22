import {
  CornerPoints,
  TextLine,
  TextRecognitionResult,
} from '@react-native-ml-kit/text-recognition';

export type LineSpec = {
  text: string;
  top: number;
  height: number;
  sideways?: boolean;
  left?: number;
  width?: number;
};

export function uprightCorners(top: number, height: number, width = 100): CornerPoints {
  return [
    { x: 0, y: top },
    { x: width, y: top },
    { x: width, y: top + height },
    { x: 0, y: top + height },
  ];
}

export function sidewaysCorners(top: number, height: number, width = 30): CornerPoints {
  return [
    { x: width, y: top },
    { x: width, y: top + height },
    { x: 0, y: top + height },
    { x: 0, y: top },
  ];
}

export function buildLine({
  text,
  top,
  height,
  sideways = false,
  left = 0,
  width,
}: LineSpec): TextLine {
  const lineWidth = width ?? (sideways ? 30 : 100);
  const cornerPoints = sideways ? sidewaysCorners(top, height) : uprightCorners(top, height);
  const frame = { top, left, width: lineWidth, height };
  return {
    text,
    frame,
    cornerPoints,
    recognizedLanguages: [],
    elements: [{ text, frame, cornerPoints }],
  };
}

export function buildResult(lines: LineSpec[]): TextRecognitionResult {
  return {
    text: lines.map(line => line.text).join('\n'),
    blocks: lines.map(spec => {
      const line = buildLine(spec);
      return {
        text: line.text,
        frame: line.frame,
        cornerPoints: line.cornerPoints,
        recognizedLanguages: [],
        lines: [line],
      };
    }),
  };
}

export function buildBlocksResult(blocks: LineSpec[][]): TextRecognitionResult {
  const builtBlocks = blocks.map(specs => {
    const lines = specs.map(buildLine);
    return {
      text: lines.map(line => line.text).join('\n'),
      recognizedLanguages: [],
      lines,
    };
  });
  return { text: builtBlocks.map(block => block.text).join('\n'), blocks: builtBlocks };
}
