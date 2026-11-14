import type { ReadOnlyElement } from '@utils/autocompleteFocusMode';

type VerticalRect = { top: number; bottom: number };

export function fakeReadOnlyElement(
  id: string,
  rect: VerticalRect = { top: 0, bottom: 0 },
  parentElement: ReadOnlyElement | null = null,
  isConnected = true
): ReadOnlyElement {
  return {
    id,
    parentElement,
    isConnected,
    getBoundingClientRect: () => rect,
  } as unknown as ReadOnlyElement;
}
