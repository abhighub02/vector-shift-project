import { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeField } from './fields';
import { useNodeHandles } from './useNodeHandles';
import { useNodeData } from './useNodeData';
import { resolveAccent } from './registry';
import { TrashIcon } from '../lib/icons';

/**
 * @file Part 1: the shared node shell.
 *
 * Every node type on the canvas is this component bound to a
 * {@link import('./types').NodeDefinition}. It owns what is the same across all
 * nodes — card, header, icon, accent, delete affordance, field rendering, handle
 * rendering — so a definition only describes what makes it different.
 *
 * The result: a new node type is a declarative object with no React in it, and
 * restyling every node type is an edit here or in nodes.css, not a sweep through
 * N node files.
 *
 * Deliberately thin. Handle geometry lives in useNodeHandles, store wiring in
 * useNodeData; this file is layout.
 */

const isVertical = (position) => position === Position.Left || position === Position.Right;

/**
 * Resolve a definition value that may be a literal or a function of node data.
 * This is what makes any part of a node able to react to its own state.
 *
 * @template T
 * @param {import('./types').Dynamic<T>} value
 * @param {Object} data
 * @returns {T}
 */
const resolve = (value, data) => (typeof value === 'function' ? value(data) : value);

/**
 * @param {{id: string, data: Object, selected: boolean, definition: import('./types').NodeDefinition}} props
 */
const BaseNodeComponent = ({ id, data, selected, definition }) => {
  const handles = useMemo(() => resolve(definition.handles, data) ?? [], [definition, data]);
  const fields = useMemo(() => resolve(definition.fields, data) ?? [], [definition, data]);

  const positioned = useNodeHandles(id, handles);
  const { onFieldChange, onDelete } = useNodeData(id);

  const Icon = definition.icon;
  const title = resolve(definition.label, data);
  const subtitle = resolve(definition.subtitle, data);
  const accent = resolveAccent(definition);

  return (
    <div
      className={`node${selected ? ' is-selected' : ''}`}
      style={{
        // One accent per node category drives the icon, handles, focus rings,
        // selection glow and header wash. Setting it here is why nodes.css
        // needs no per-node-type rules.
        '--node-accent': `var(--hue-${accent})`,
        '--node-accent-soft': `color-mix(in srgb, var(--hue-${accent}) 14%, transparent)`,
        minWidth: definition.width,
      }}
    >
      <header className="node-header">
        {Icon && (
          <span className="node-icon">
            <Icon size={14} />
          </span>
        )}
        <div className="node-title">
          {title}
          {subtitle && <div className="node-subtitle">{subtitle}</div>}
        </div>
        <button
          className="node-delete"
          onClick={onDelete}
          title="Delete node"
          aria-label={`Delete ${title} node`}
        >
          <TrashIcon />
        </button>
      </header>

      <div className="node-body">
        {fields.map((field) => (
          <NodeField key={field.key} field={field} data={data} onChange={onFieldChange} />
        ))}
      </div>

      {positioned.map((handle) => (
        <Handle
          key={handle.fullId}
          id={handle.fullId}
          type={handle.type}
          position={handle.position}
          style={{ [handle.offsetProperty]: handle.offset }}
          isConnectable={handle.isConnectable}
        />
      ))}

      {/* Labels are rendered separately from the Handles so they can sit outside
          the card without enlarging the connection hit area. */}
      {positioned
        .filter((handle) => handle.label && isVertical(handle.position))
        .map((handle) => (
          <span
            key={`${handle.fullId}-label`}
            className={`handle-label is-${handle.position}`}
            style={{ top: handle.offset }}
          >
            {handle.label}
          </span>
        ))}
    </div>
  );
};

/*
 * Memoized: dragging or typing in one node re-renders the flow, and without this
 * every other node on the canvas would re-render with it. Paired with the
 * store's immutable `updateNodeField`, only the edited node actually re-renders.
 */
export const BaseNode = memo(BaseNodeComponent);
