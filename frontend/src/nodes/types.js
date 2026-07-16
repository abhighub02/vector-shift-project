/**
 * @file Schema for node definitions.
 *
 * This is the contract between a node definition and the shared machinery that
 * renders it. It's the one file to read before writing a new node type.
 *
 * These are JSDoc typedefs rather than TypeScript because the assessment
 * specifies JavaScript/React. Editors that run the TS language service (VS Code
 * does by default) still get completion and type-checking on definitions from
 * these annotations, which is most of the value of types without the toolchain.
 *
 * Several properties accept `T | (data) => T` — a literal, or a function of the
 * node's own data. That single idea is what lets nodes be dynamic (the Text
 * node's `{{ variable }}` handles, Merge's variable input count) without any
 * bespoke component.
 */

/**
 * @template T
 * @typedef {T | ((data: Object) => T)} Dynamic
 * Either a fixed value, or one derived from the node's current `data`.
 */

/**
 * @typedef {Object} HandleSpec
 * A connection point on a node.
 *
 * @property {string} id
 *   Unique within the node. Namespaced to `${nodeId}-${id}` when rendered, which
 *   matches the original scaffold's handle-id convention.
 * @property {'source' | 'target'} type
 *   `source` starts an edge, `target` receives one.
 * @property {import('reactflow').Position} position
 *   Which edge of the card the handle sits on. Handles sharing a side are spaced
 *   evenly down/along it automatically — no manual offsets.
 * @property {string} [label]
 *   Shown beside the handle. Left/right handles only.
 * @property {boolean} [isConnectable]
 */

/**
 * @typedef {Object} FieldSpec
 * One input in a node's body. See `fields/index.jsx` for the type registry.
 *
 * @property {string} key
 *   Where the value lives in the node's `data`, and what's sent to the backend.
 * @property {'text'|'number'|'select'|'slider'|'checkbox'|'textarea'|'file'|'pills'|'hint'|'custom'} type
 * @property {string} [label]
 *   Omitted for `checkbox`/`hint`, which label themselves.
 * @property {*} [default]
 *   Seeded into `data` when the node is created, so a node submits the values it
 *   visibly shows even if the user never touches it.
 * @property {string} [placeholder]
 * @property {(data: Object) => boolean} [visibleIf]
 *   Hide the field unless this passes — lets one field react to another
 *   (API's `Body` only exists for methods that carry one).
 *
 * @property {Array<string | {value: string, label: string}>} [options]  `select` only.
 * @property {number} [min]   `number` / `slider`.
 * @property {number} [max]   `number` / `slider`.
 * @property {number} [step]  `number` / `slider`.
 * @property {string} [checkboxLabel]  `checkbox` only; defaults to `label`.
 * @property {string} [accept]  `file` only; the accept attribute.
 * @property {boolean} [mono]   `textarea` only; monospace the content.
 * @property {number} [rows]    `textarea` only; ignored when `autoResize`.
 * @property {boolean} [autoResize]
 *   `textarea` only. Grow the field — and so the node — to fit its content.
 * @property {number} [minWidth]   `autoResize` only.
 * @property {number} [maxWidth]   `autoResize` only; text soft-wraps past it.
 * @property {number} [minHeight]  `autoResize` only.
 * @property {number} [maxHeight]  `autoResize` only; scrolls past it.
 * @property {(data: Object) => string[]} [values]  `pills` only.
 * @property {Dynamic<string>} [text]  `hint` only.
 * @property {(props: {data: Object, onChange: Function}) => JSX.Element} [render]
 *   `custom` only. The escape hatch for anything the declarative types can't say.
 */

/**
 * @typedef {Object} NodeDefinition
 * A complete node type. Register it in `registry.jsx` and it gains a canvas
 * component, a toolbar entry, and seeded defaults — nothing else to wire up.
 *
 * @property {string} type
 *   Stable id used by React Flow and sent to the backend. Don't rename casually.
 * @property {Dynamic<string>} label      Title shown in the header and toolbar.
 * @property {Dynamic<string>} [subtitle] Secondary header line.
 * @property {(props: {size?: number}) => JSX.Element} [icon]
 *   Inherits the node's accent via `currentColor`.
 * @property {string} [group]
 *   Toolbar grouping, and the source of the node's accent color unless
 *   `accent` overrides it. See GROUP_ACCENTS in `registry.jsx`.
 * @property {string} [accent]
 *   Escape hatch: a `--hue-*` name to override the group's color. Prefer
 *   inheriting the group so the palette stays restrained.
 * @property {number} [width]  Minimum card width in px.
 * @property {Dynamic<HandleSpec[]>} [handles]
 *   Omit for a node with no connections (see the Note node).
 * @property {Dynamic<FieldSpec[]>} [fields]
 */

export {};
