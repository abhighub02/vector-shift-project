import { useLayoutEffect } from 'react';

/*
 * Part 3: grow a textarea (and therefore its node) to fit its content.
 *
 * Width and height are handled differently on purpose:
 *
 *   Width  — measured from the *longest line* using a canvas text metric. The
 *            DOM can't tell us the natural width of a textarea's content
 *            (unlike scrollHeight, there is no useful scrollWidth for wrapped
 *            soft-wrapped text), so we measure the string directly against the
 *            element's real computed font.
 *   Height — read back from scrollHeight *after* the width is applied, so that
 *            lines wrapped by the clamped max width are counted correctly.
 *
 * The order matters: measuring height before committing width would count wraps
 * against the old width and leave the box a row short while typing.
 */

// One shared canvas for all measurements; creating one per keystroke is wasteful.
let measureContext = null;

const getMeasureContext = () => {
  if (!measureContext) {
    measureContext = document.createElement('canvas').getContext('2d');
  }
  return measureContext;
};

/*
 * Build a CSS font shorthand from computed styles. We avoid the `font`
 * shorthand property directly because it computes to an empty string in some
 * browsers when longhands were set individually (as our stylesheet does).
 */
const getFontString = (styles) =>
  `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} / ${styles.lineHeight} ${styles.fontFamily}`;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Size a textarea to its content on every value change.
 *
 * @param {React.RefObject<HTMLTextAreaElement>} ref
 * @param {string} value            current text, drives re-measurement
 * @param {object} [options]
 * @param {number} [options.minWidth]   floor, keeps small nodes from collapsing
 * @param {number} [options.maxWidth]   ceiling, beyond which text soft-wraps
 * @param {number} [options.minHeight]  floor for an empty textarea
 * @param {number} [options.maxHeight]  ceiling, beyond which the textarea scrolls
 */
export const useAutoResize = (
  ref,
  value,
  { minWidth = 200, maxWidth = 460, minHeight = 34, maxHeight = 400 } = {}
) => {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const styles = window.getComputedStyle(el);
    const ctx = getMeasureContext();
    ctx.font = getFontString(styles);

    // Horizontal chrome the text can't occupy: padding + borders.
    const horizontalInset =
      parseFloat(styles.paddingLeft) +
      parseFloat(styles.paddingRight) +
      parseFloat(styles.borderLeftWidth) +
      parseFloat(styles.borderRightWidth);

    // Measure against the placeholder when empty so the box doesn't collapse
    // below the width of its own hint text.
    const source = value || el.placeholder || '';
    const widest = source
      .split('\n')
      .reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0);

    // +2px absorbs sub-pixel metric rounding, which otherwise makes the last
    // character nudge the caret onto a new line.
    const width = clamp(Math.ceil(widest + horizontalInset + 2), minWidth, maxWidth);
    el.style.width = `${width}px`;

    // Now that the final width is committed, scrollHeight reflects real wrapping.
    el.style.height = 'auto';
    const height = clamp(el.scrollHeight, minHeight, maxHeight);
    el.style.height = `${height}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [ref, value, minWidth, maxWidth, minHeight, maxHeight]);
};
