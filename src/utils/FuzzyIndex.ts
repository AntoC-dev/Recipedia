/**
 * FuzzyIndex - All in-memory fuzzy text search lives here.
 *
 * Two layers:
 *
 *  - **Low-level**: `buildFuzzyIndex` + `fuzzySearchIds` / `fuzzyHasMatch`
 *    operate on a raw `string[]` corpus and return position indices or a
 *    boolean. Use when the caller already has its own object model.
 *
 *  - **Typed-corpus**: `buildItemIndex<T>` + `searchItems` /
 *    `searchItemsDetailed` keep the original objects alongside the index,
 *    apply optional per-name preprocessing, and prioritize exact matches.
 *    This is what hooks like `useTags` / `useIngredients` consume.
 *
 *  - **Phrase preset**: `buildPhraseIndex` builds an index whose entries
 *    match as whole phrases (single token each). Used by OCR to test
 *    whether a recognized line matches any known nutrition label.
 *
 * Tuning of fuzzy thresholds and the choice of preprocessing live with
 * the caller; FuzzyIndex does not know about tags, ingredients, OCR or
 * any domain concept.
 *
 * @module FuzzyIndex
 */

import MiniSearch, { Options as MiniSearchOptions, SearchOptions } from 'minisearch';
import { normalizeKey } from '@utils/NutritionUtils';

type IndexedString = { id: number; text: string };

export type FuzzyIndex = MiniSearch<IndexedString>;

export type FuzzyIndexOptions = {
  /** Max edit distance as a fraction of query token length (see MiniSearch). */
  fuzzy: number;
  /** Match when a query token is a prefix of an indexed token. Default true. */
  prefix?: boolean;
  /** How multi-token queries combine. Default 'OR'. */
  combineWith?: 'OR' | 'AND';
  /** Splits raw text into tokens. Defaults to MiniSearch's whitespace/punctuation split. */
  tokenize?: (text: string) => string[];
  /** Transforms each token before indexing AND searching. Return null to drop. */
  processTerm?: (term: string) => string | null;
  /**
   * Transforms each query token before searching. Falls back to `processTerm`
   * when omitted. Use this to drop noise on the query side (e.g. very short
   * stop-word tokens) without removing tokens from the persisted index.
   */
  processQueryTerm?: (term: string) => string | null;
};

/**
 * Tokenizer that emits the entire input as a single token.
 *
 * Use when the indexed entries are short phrases that must match as a
 * whole, like OCR nutrition labels ("matières grasses"), rather than
 * per-word matches.
 */
export const wholePhraseTokenizer = (text: string): string[] => (text ? [text] : []);

/**
 * Builds a fuzzy search index from an array of strings.
 *
 * Each string is indexed under its array position so the caller can map
 * results back to whatever object it originated from.
 */
export function buildFuzzyIndex(texts: string[], options: FuzzyIndexOptions): FuzzyIndex {
  const searchOptions: SearchOptions = {
    fuzzy: options.fuzzy,
    prefix: options.prefix ?? true,
    combineWith: options.combineWith ?? 'OR',
  };
  if (options.tokenize) searchOptions.tokenize = options.tokenize;
  const queryProcess = options.processQueryTerm ?? options.processTerm;
  if (queryProcess) searchOptions.processTerm = queryProcess;

  const config: MiniSearchOptions<IndexedString> = {
    fields: ['text'],
    storeFields: ['id'],
    idField: 'id',
    searchOptions,
  };
  if (options.tokenize) config.tokenize = options.tokenize;
  if (options.processTerm) config.processTerm = options.processTerm;

  const index = new MiniSearch<IndexedString>(config);
  index.addAll(texts.map((text, id) => ({ id, text })));
  return index;
}

/**
 * Returns the corpus indices of documents matching `query`, in MiniSearch
 * relevance order. Empty array for empty / whitespace-only queries.
 */
export function fuzzySearchIds(index: FuzzyIndex, query: string): number[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return index.search(trimmed).map(r => Number(r.id));
}

/**
 * Boolean shortcut: does any document match this query?
 */
export function fuzzyHasMatch(index: FuzzyIndex, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;
  return index.search(trimmed).length > 0;
}

/**
 * Configuration for `buildItemIndex`.
 *
 * `preprocess` is applied both when indexing each item's name and when
 * a query is later passed to `searchItems` / `searchItemsDetailed`, so
 * the two sides reach the same normalized form (e.g. stripping
 * parentheticals for ingredient queries).
 */
export type ItemIndexConfig<T> = {
  fuzzy: number;
  getName: (item: T) => string;
  preprocess?: (text: string) => string;
};

/**
 * Search index pairing a `FuzzyIndex` with the original corpus.
 *
 * Exposed so callers can hold a single value across renders; treat the
 * fields as opaque and query via `searchItems` / `searchItemsDetailed`.
 * `normalizedNames` is the `normalizeKey`-applied form of each indexed
 * name, precomputed once so exact-match scans don't re-normalize per
 * comparison.
 */
export type ItemSearchIndex<T> = {
  fuzzy: FuzzyIndex;
  corpus: T[];
  normalizedNames: string[];
  preprocess: (text: string) => string;
};

/**
 * Result distinguishing an exact-name match from fuzzy similar matches.
 * Useful for UI flows that need different messaging for the two cases.
 */
export type DetailedSearchResult<T> = {
  exact?: T;
  similar: T[];
};

const identity = (text: string): string => text;

/** Drops 1–2 char query tokens so "de" / "l'" don't prefix-match "Dessert". */
const QUERY_MIN_TOKEN_LEN = 3;

/**
 * Default fuzzy threshold for short, single-token-ish item names (tags,
 * ingredients, pending-item cross-suggestion). At 0.2, a 5-char query
 * tolerates ~1 edit — enough for "tomatoe" → "tomato" without dragging
 * in unrelated words.
 */
export const ITEM_FUZZY = 0.2;

const indexProcessTerm = (term: string): string | null => normalizeKey(term) || null;

const queryProcessTerm = (term: string): string | null => {
  const normalized = normalizeKey(term);
  return normalized.length >= QUERY_MIN_TOKEN_LEN ? normalized : null;
};

/**
 * Builds a typed-corpus fuzzy index. The MiniSearch instance is rebuilt
 * only when this is called, so callers should memoize on the corpus
 * reference (React Compiler does this automatically for hook-level calls).
 */
export function buildItemIndex<T>(corpus: T[], config: ItemIndexConfig<T>): ItemSearchIndex<T> {
  const preprocess = config.preprocess ?? identity;
  const normalizedNames: string[] = new Array(corpus.length);
  const indexedNames: string[] = new Array(corpus.length);
  for (let i = 0; i < corpus.length; i++) {
    const name = preprocess(config.getName(corpus[i]));
    indexedNames[i] = name;
    normalizedNames[i] = normalizeKey(name);
  }
  const fuzzy = buildFuzzyIndex(indexedNames, {
    fuzzy: config.fuzzy,
    processTerm: indexProcessTerm,
    processQueryTerm: queryProcessTerm,
  });
  return { fuzzy, corpus, normalizedNames, preprocess };
}

/**
 * Searches a typed-corpus index. Returns `{ exact, similar }` so callers
 * can distinguish "user typed an existing name" from "user typed
 * something close to existing names".
 */
export function searchItemsDetailed<T>(
  index: ItemSearchIndex<T>,
  query: string
): DetailedSearchResult<T> {
  const processed = index.preprocess(query).trim();
  if (!processed || index.corpus.length === 0) return { similar: [] };

  const normalizedQuery = normalizeKey(processed);
  const exactIdx = index.normalizedNames.indexOf(normalizedQuery);
  if (exactIdx !== -1) return { exact: index.corpus[exactIdx], similar: [] };

  const similar = fuzzySearchIds(index.fuzzy, processed)
    .map(id => index.corpus[id])
    .filter((item): item is T => item !== undefined);
  return { similar };
}

/**
 * Searches a typed-corpus index. Returns a single-item array for an
 * exact match, otherwise the fuzzy/prefix matches in relevance order.
 */
export function searchItems<T>(index: ItemSearchIndex<T>, query: string): T[] {
  const { exact, similar } = searchItemsDetailed(index, query);
  return exact ? [exact] : similar;
}

/**
 * Returns fuzzy/prefix matches from a typed-corpus index, ignoring the
 * exact-match shortcut. Useful when the caller wants to discover items
 * that are *near* a query whose exact form is also indexed (e.g. finding
 * typos of a just-added entry).
 */
export function searchItemsFuzzy<T>(index: ItemSearchIndex<T>, query: string): T[] {
  const processed = index.preprocess(query).trim();
  if (!processed || index.corpus.length === 0) return [];
  return fuzzySearchIds(index.fuzzy, processed)
    .map(id => index.corpus[id])
    .filter((item): item is T => item !== undefined);
}

/**
 * Builds an index whose entries are matched as whole phrases. The
 * caller is expected to feed full strings (e.g. an OCR'd line) to
 * `fuzzyHasMatch` / `fuzzySearchIds` against this index.
 *
 * Tokens are lowercased; queries should be too (or use the same
 * `processTerm`-equivalent upstream).
 */
export function buildPhraseIndex(phrases: string[], fuzzy: number): FuzzyIndex {
  return buildFuzzyIndex(phrases, {
    fuzzy,
    tokenize: wholePhraseTokenizer,
    processTerm: term => term.toLowerCase().trim() || null,
  });
}
