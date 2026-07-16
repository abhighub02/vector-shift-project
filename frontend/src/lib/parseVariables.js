/**
 * @file Part 3: extract `{{ variable }}` references from Text node input.
 *
 * The assessment asks specifically for *valid JavaScript variable names*, so an
 * identifier regex alone isn't enough — `{{ return }}` has the shape of an
 * identifier but could never be one. Reserved words are filtered too.
 */

/** Reserved words and literals that are not legal binding identifiers. */
const RESERVED = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally',
  'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null',
  'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof',
  'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'implements',
  'interface', 'package', 'private', 'protected', 'public', 'await',
]);

/**
 * Matches `{{ name }}` with optional inner whitespace.
 *
 * The identifier pattern mirrors the JS spec's ASCII subset: a leading letter,
 * `_` or `$`, then letters, digits, `_` or `$`. Anchoring the group between
 * `\{\{\s*` and `\s*\}\}` means `{{ a b }}` and `{{ 1x }}` fail to match
 * outright rather than matching a fragment of themselves.
 */
const VARIABLE_PATTERN = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g;

/** Shared empty result, so the no-variables case allocates nothing. */
const EMPTY = Object.freeze([]);

/*
 * Memoization, rather than debouncing the caller.
 *
 * A Text node re-renders on every keystroke and asks about its variables about
 * four times per render — for its subtitle, its handles, and the variable chips'
 * values and visibility. Those calls all pass the same string, so caching on the
 * text collapses them to one scan.
 *
 * This is deliberately not a debounce. Debouncing the resize/parse would put the
 * node's width and handles behind the user's typing: the box would visibly lag
 * and settle after a pause, which is worse than the work it saves. The cost here
 * is a small regex scan, and the fix for "called repeatedly with identical
 * input" is to not recompute it — not to compute it late.
 *
 * Bounded so a long editing session can't grow it without limit; the Map's
 * insertion order gives simple FIFO eviction.
 */
const CACHE_LIMIT = 64;
const cache = new Map();

/**
 * The ordered, de-duplicated variable names in a template.
 *
 * Order matters: handles are laid down the node's left edge in first-appearance
 * order, so adding a variable inserts its handle where the reader expects rather
 * than reshuffling the existing ones.
 *
 * The returned array is frozen and shared between callers — treat it as
 * read-only.
 *
 * @param {string} text
 * @returns {readonly string[]}
 */
export const parseVariables = (text) => {
  if (!text || typeof text !== 'string') return EMPTY;

  const cached = cache.get(text);
  if (cached) return cached;

  const found = [];
  const seen = new Set();

  // `matchAll` gives a fresh iterator per call, so the shared regex's lastIndex
  // can't leak between invocations.
  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    const name = match[1];
    if (RESERVED.has(name) || seen.has(name)) continue;
    seen.add(name);
    found.push(name);
  }

  const result = Object.freeze(found);

  if (cache.size >= CACHE_LIMIT) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(text, result);

  return result;
};

/**
 * Is `name` usable as a JavaScript variable?
 * @param {string} name
 * @returns {boolean}
 */
export const isValidVariableName = (name) =>
  /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) && !RESERVED.has(name);
