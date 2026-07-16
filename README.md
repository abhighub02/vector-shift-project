# VectorShift — Frontend Technical Assessment

A node-based pipeline builder: drag nodes onto a canvas, wire them together, and
submit the graph to a FastAPI backend that reports its size and whether it forms
a DAG.

## Running it

Two terminals.

**Backend** (http://localhost:8000):

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend** (http://localhost:3000):

```bash
cd frontend
npm i
npm start
```

The frontend targets `http://localhost:8000` by default. To point it elsewhere,
set `VITE_API_BASE` (e.g. `VITE_API_BASE=http://localhost:8001 npm start`).

### Tests

```bash
cd backend && .venv/Scripts/python -m pytest test_main.py -v   # 15 tests
```

## Part 1 — Node abstraction

A node type is a **plain data object**. No React, no styling, no handle
bookkeeping:

```js
export const filterNode = {
  type: 'filter',
  label: 'Filter',
  icon: FilterIcon,
  accent: 'rose',
  group: 'Logic',
  handles: [
    { id: 'input', type: 'target', position: Position.Left,  label: 'input' },
    { id: 'true',  type: 'source', position: Position.Right, label: 'true'  },
    { id: 'false', type: 'source', position: Position.Right, label: 'false' },
  ],
  fields: [
    { key: 'operator', type: 'select', label: 'Operator', options: [...], default: 'contains' },
    { key: 'value',    type: 'text',   label: 'Value',
      visibleIf: (data) => !UNARY_OPERATORS.includes(data.operator) },
  ],
};
```

These pieces make that work, each with one job:

| File | Role |
| --- | --- |
| `nodes/types.js` | **The schema.** JSDoc typedefs for `NodeDefinition`, `HandleSpec`, `FieldSpec`. Read this first before writing a node. |
| `nodes/BaseNode.jsx` | The shared shell — card, header, icon, accent, delete, field + handle rendering. Layout only. |
| `nodes/useNodeHandles.js` | Handle geometry and lifecycle: even spacing, React Flow sync, edge pruning. |
| `nodes/useNodeData.js` | Field-handling logic shared by every node: store-backed edits and deletion. |
| `nodes/fields/index.jsx` | Field registry. Maps a `type` string to a controlled, styled input. |
| `nodes/registry.jsx` | The one place a node type is declared. Produces React Flow's `nodeTypes`, the toolbar, category accents, and default data. |

**Adding a node type is one config object plus one line** in `registry.jsx`. It
then appears on the canvas *and* in the toolbar, correctly styled, with defaults
seeded — no shared component, style, or logic is touched.

Anything in a definition can be a **function of the node's own data** (`label`,
`subtitle`, `handles`, `fields`). That single idea is what makes dynamic nodes
possible without a bespoke component — and it's why Part 3 needed no changes to
the abstraction at all.

Types are JSDoc rather than TypeScript because the assessment specifies
JavaScript. VS Code's TS language service still type-checks and autocompletes
definitions from those annotations.

### The nine node types

The four originals — **Input**, **Output**, **LLM**, **Text** — plus five new ones,
each chosen to exercise a different part of the abstraction rather than to be
interesting on its own:

| Node | Handles | Fields | Demonstrates |
| --- | --- | --- | --- |
| **Filter** | 1 in, **2 out** | dropdown, text, **toggle** | Branching output — two sources on one edge, auto-spaced; a value field that disappears for unary operators. |
| **API Request** | 2 in, **2 out** | dropdown, text, **multi-line**, number | Conditional fields (`Body` exists only for POST/PUT/PATCH); separate `response`/`error` outputs. |
| **Math** | 2 in, 1 out | dropdown, number, **custom JSX** | The escape hatch — a live formula preview no declarative field type could express. |
| **Merge** | **2→6 in** (dynamic), 1 out | number, dropdown, text | Handles driven by a *field value* — the same dynamic-handle mechanism the Text node reaches via parsing. |
| **Note** | **none** | multi-line (auto-resizing) | The degenerate case. An abstraction assuming "every node has I/O" would need a special case; this one just omits a key. |

Between them the nine types exercise every field type in the registry — `text`,
`number`, `select`, `slider`, `checkbox`, `textarea`, `file`, `pills`, `hint`,
`custom` — and handle counts from **zero to dynamic**. The Input node's file
picker only appears when its Type is `File`, which is the conditional-field
mechanism and the file field in one.

## Part 2 — Styling

`styles/theme.css` is a token layer — every color, radius, shadow and spacing
value resolves through it. `nodes.css` contains **no per-node-type rules**:
`BaseNode` maps a node's accent onto `--node-accent`, and the icon, handles,
focus rings, selection glow and header wash all read that one variable.
Restyling all nine node types is one edit.

**Colour is restrained, and it means something.** The accent comes from the
node's *category*, not its type — indigo for Core, violet for Logic, teal for
Integrations, slate for Utility — so the canvas reads at a glance as "data in/out,
logic, external call, annotation", and the toolbar groups share that language.
Giving all nine types their own hue would spend the palette on decoration and
leave colour meaning nothing. A definition can still override with `accent` when
it has a reason to.

Otherwise: soft-cornered cards, shadows carrying the elevation rather than hard
borders, monospace for the things that are literally code (handle labels,
variable chips, templates), and uppercase micro-labels for fields.

## Part 3 — Text node logic

**Resizing.** Width and height are measured differently on purpose
(`lib/useAutoResize.js`): width comes from a **canvas text metric** of the
longest line (the DOM has no useful "natural width" for a textarea), then height
is read back from `scrollHeight` *after* the width is committed, so lines wrapped
at the max width are counted correctly. The card has no fixed width, so the node
grows with the textarea.

**Variables.** `lib/parseVariables.js` extracts `{{ name }}` references. The spec
asks for *valid JavaScript variable names*, so an identifier regex alone isn't
enough — reserved words are filtered too. `{{ 1bad }}`, `{{ has space }}` and
`{{ return }}` are all correctly rejected; `{{ good }}` gets a handle.

Handles then fall out of `handles: (data) => [...]`. Removing a variable that has
an edge attached prunes that edge (`store.js#syncHandles`) — React Flow doesn't
do this itself, and a dangling edge would otherwise still be submitted to the
backend and skew the DAG check.

**On per-keystroke cost — memoized, deliberately not debounced.** A Text node
asks about its variables ~4× per render (subtitle, handles, and the chips' values
and visibility), all with the same string, so `parseVariables` caches on the text
and collapses them to one scan. Debouncing was the other option and is the wrong
tool here: it would put the node's width and handles *behind* the user's typing,
so the box visibly lags and settles after a pause. The fix for "called repeatedly
with identical input" is to not recompute it, not to compute it late. The
remaining work — one regex scan and one text measurement — is microseconds, and
the handle-sync effect is keyed on handle *content*, so typing ordinary prose
never touches React Flow's internals at all.

## Part 4 — Backend integration

`submit.jsx` POSTs `{nodes, edges}` as JSON to `/pipelines/parse`, stripping React
Flow's view state (selection, dimensions) so the payload describes the pipeline
rather than the viewport. The response is shown as a **styled modal** rather than
`window.alert` — node count, edge count, and a clear DAG verdict. Network
failures and non-2xx responses surface inline instead of failing silently.

`main.py` answers `{num_nodes, num_edges, is_dag}`. The DAG check uses **Kahn's
algorithm**: peel off nodes with no remaining incoming edges; if any are left
over, they're in a cycle. It's iterative (a long pipeline can't blow the
recursion limit) and handles self-loops, parallel duplicate edges, and edges
naming unknown nodes. All covered in `test_main.py`.

## Notes / deviations

- **Vite instead of Create React App.** CRA is deprecated and slow on Node 22.
  `npm i` + `npm start` work exactly as the instructions specify.
- **Node type names and handle IDs match the original scaffold** (`customInput`,
  `llm`, `customOutput`, `text`; `${nodeId}-${handleId}`), so this stays
  drop-in comparable with the starter. The starter hard-codes the LLM's two
  input handles at `100/3`/`200/3`; `BaseNode` derives the same positions from
  `(i+1)/(n+1)` for any number of handles.
- **State lives in the store, not in each node's `useState`.** The starter's nodes
  keep edits in local component state, so they never reach the store — meaning
  Part 4 would submit empty `data`. Fields here are controlled by the store.
  Its `updateNodeField` also mutates `node.data` in place; this one replaces the
  touched node immutably so memoization holds.
