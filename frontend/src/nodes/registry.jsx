import { BaseNode } from './BaseNode';

import { inputNode } from './definitions/input';
import { outputNode } from './definitions/output';
import { llmNode } from './definitions/llm';
import { textNode } from './definitions/text';
import { filterNode } from './definitions/filter';
import { apiNode } from './definitions/api';
import { mathNode } from './definitions/math';
import { mergeNode } from './definitions/merge';
import { noteNode } from './definitions/note';

/*
 * The node registry.
 *
 * This is the single place a node type is declared. Registering a definition
 * here gives you, for free:
 *
 *   - a React Flow node component (BaseNode bound to the definition)
 *   - an entry in the toolbar, in the right group, with the right icon/accent
 *   - correct default data for newly dropped nodes
 *
 * Adding a tenth node type is: write a definition file, add it to NODE_DEFINITIONS.
 * There is no other file to touch.
 */

/** @type {import('./types').NodeDefinition[]} */
const NODE_DEFINITIONS = [
  // The four node types from the original assessment scaffold.
  inputNode,
  outputNode,
  llmNode,
  textNode,
  // Five new types, added to demonstrate the abstraction. Each is a single
  // declarative file with no React and no styling of its own.
  filterNode,
  apiNode,
  mathNode,
  mergeNode,
  noteNode,
];

/**
 * One accent per node *category*, not per node type.
 *
 * Colour is doing a job here: it groups nodes by what they're for, so a glance
 * at the canvas reads as "data in/out, logic, external call, annotation". Giving
 * all nine types their own hue would spend the whole palette on decoration and
 * leave colour meaning nothing — the toolbar groups and the canvas now share one
 * visual language.
 *
 * A definition can still override with `accent` when it has a reason to.
 */
const GROUP_ACCENTS = {
  Core: 'indigo',
  Logic: 'violet',
  Integrations: 'teal',
  Utility: 'slate',
};

/**
 * The accent hue for a definition: its own `accent`, else its group's.
 * @param {import('./types').NodeDefinition} definition
 * @returns {string} a `--hue-*` name
 */
export const resolveAccent = (definition) =>
  definition.accent ?? GROUP_ACCENTS[definition.group] ?? 'indigo';

/**
 * Bind a definition to the shared shell, producing a React Flow node component.
 *
 * React Flow passes { id, data, selected }; we close over the definition so the
 * component signature stays the one React Flow expects.
 */
const createNodeComponent = (definition) => {
  const NodeComponent = (props) => <BaseNode {...props} definition={definition} />;
  // Named for a legible React DevTools tree — otherwise every node shows as
  // the same anonymous component.
  NodeComponent.displayName = `${definition.type}Node`;
  return NodeComponent;
};

/** Lookup by type, e.g. definition metadata needed outside of rendering. */
export const nodeDefinitions = Object.fromEntries(
  NODE_DEFINITIONS.map((definition) => [definition.type, definition])
);

/** The `nodeTypes` map handed to <ReactFlow />. Built once at module scope,
 *  since passing a fresh object each render remounts every node. */
export const nodeTypes = Object.fromEntries(
  NODE_DEFINITIONS.map((definition) => [definition.type, createNodeComponent(definition)])
);

/**
 * Toolbar contents, grouped by each definition's `group`.
 *
 * Derived from the same list, so the toolbar can never drift out of sync with
 * what's actually registered.
 */
export const toolbarGroups = NODE_DEFINITIONS.reduce((groups, definition) => {
  const name = definition.group ?? 'General';
  (groups[name] ??= []).push(definition);
  return groups;
}, {});

/**
 * Initial `data` for a freshly dropped node: every field's declared default.
 *
 * Seeding defaults up front (rather than falling back at render time) means the
 * data sent to the backend describes the node exactly as it appears, even for
 * fields the user never touched.
 */
export const getDefaultData = (type) => {
  const definition = nodeDefinitions[type];
  if (!definition) return {};

  // `fields` may be a function of data; at creation time there is no data yet,
  // so resolve it against an empty object to collect the static defaults.
  const fields = typeof definition.fields === 'function' ? definition.fields({}) : definition.fields;

  const data = {};
  for (const field of fields ?? []) {
    if (field.default !== undefined) {
      data[field.key] = field.default;
    }
  }
  return data;
};
