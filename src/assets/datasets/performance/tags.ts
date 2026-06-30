import { tagTableElement } from '@customTypes/DatabaseElementTypes';
import { generatePerformanceTags } from '@assets/datasets/performance/generate';

/**
 * Curated anchor tags preserved for E2E flows that tap them by exact text
 * (e.g. "Breakfast"). These keep their stable ids at the front of the pool;
 * the deterministically generated bulk is appended after them.
 */
const curatedTags: tagTableElement[] = [
  { id: 1, name: 'Italian' },
  { id: 2, name: 'Dinner' },
  { id: 3, name: 'Mexican' },
  { id: 4, name: 'Lunch' },
  { id: 5, name: 'Breakfast' },
  { id: 6, name: 'Dessert' },
  { id: 7, name: 'Healthy' },
  { id: 8, name: 'Soup' },
  { id: 9, name: 'Quick Meal' },
  { id: 10, name: 'Seafood' },
  { id: 11, name: 'Japanese' },
  { id: 12, name: 'Vegetarian' },
  { id: 13, name: 'Chocolate' },
  { id: 14, name: 'Salad' },
  { id: 15, name: 'Indian' },
  { id: 16, name: 'Comfort Food' },
  { id: 17, name: 'Light' },
  { id: 18, name: 'Spicy' },
  { id: 19, name: 'Sweet' },
  { id: 20, name: 'Savory' },
];

const GENERATED_TAG_COUNT = 280;

/**
 * Performance tag pool: curated anchors followed by a deterministic bulk,
 * totalling roughly 300 tags to populate the Tags settings and filter
 * accordions at power-user scale.
 */
export const performanceTags: tagTableElement[] = [
  ...curatedTags,
  ...generatePerformanceTags(GENERATED_TAG_COUNT, curatedTags.length + 1),
];
