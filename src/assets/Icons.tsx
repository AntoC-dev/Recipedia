import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { remValue } from '@styles/spacing';

export type dictionaryIcons = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * Shared icon size scale, in density-independent pixels scaled by `remValue`.
 *
 * - `verySmall` — inline badge overlaid on other content; the smallest rung of the
 *   ladder, currently unused but kept so the scale stays continuous
 * - `small` — secondary affordance next to text (e.g. the "previously seen" marker)
 * - `medium` — standard action icon (e.g. buttons, chips, list rows)
 * - `large` — prominent status icon (e.g. tab bar, section headings, provider logos)
 * - `veryLarge` — empty-state and error-state icon
 */
export const iconsSize = {
  verySmall: 12 * remValue,
  small: 16 * remValue,
  medium: 20 * remValue,
  large: 28 * remValue,
  veryLarge: 40 * remValue,
};

export const Icons = {
  checkboxBlankIcon: 'checkbox-blank-outline',
  checkboxFillIcon: 'checkbox-marked',
  plusIcon: 'plus',
  minusIcon: 'minus',
  addFilterIcon: 'filter-plus-outline',
  removeFilterIcon: 'filter-remove',
  tagSearchIcon: 'tag-search-outline',
  filterPlusIcon: 'filter-plus-outline',
  filterMinusIcon: 'filter-remove-outline',
  crossIcon: 'close',
  checkIcon: 'check',
  trashIcon: 'delete',
  homeUnselectedIcon: 'home',
  homeSelectedIcon: 'home-outline',
  shoppingUnselectedIcon: 'cart',
  shoppingSelectedIcon: 'cart-outline',
  menuUnselectedIcon: 'silverware-fork-knife',
  menuSelectedIcon: 'silverware-fork-knife',
  plannerUnselectedIcon: 'calendar',
  plannerSelectedIcon: 'calendar-outline',
  parametersUnselectedIcon: 'cog',
  parametersSelectedIcon: 'cog-outline',
  webIcon: 'web',
  searchIcon: 'magnify',
  cameraIcon: 'camera',
  galleryIcon: 'image-area',
  scanImageIcon: 'line-scan',
  backIcon: 'keyboard-backspace',
  pencilIcon: 'pencil',
  exportIcon: 'export',
  rotateIcon: 'rotate-right',
  flipHorizontalIcon: 'flip-horizontal',
  flipVerticalIcon: 'flip-vertical',
  information: 'information',
  lightDarkTheme: 'theme-light-dark',
  translate: 'translate',
  chevronRight: 'chevron-right',
  chevronLeft: 'chevron-left',
  groupPeople: 'account-group',
  apple: 'food-apple',
  tags: 'tag-multiple',
  imageOff: 'image-off-outline',
  noteOutline: 'note-text-outline',
  noteText: 'note-text',
  commentPlusOutline: 'comment-plus-outline',
  commentEditOutline: 'comment-edit-outline',
  bug: 'bug',
  history: 'history',
  eyeOff: 'eye-off-outline',
  restore: 'restore',
  undo: 'undo',
  import: 'import',
  copy: 'content-copy',
  checkWithCircle: 'check-circle-outline',
  alertWithCircle: 'alert-circle-outline',
} as const satisfies Record<string, dictionaryIcons>;
export type IconName = dictionaryIcons;
