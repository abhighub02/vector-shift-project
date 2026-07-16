import { useRef } from 'react';
import { useAutoResize } from '../../lib/useAutoResize';
import { CheckIcon, UploadIcon } from '../../lib/icons';

/*
 * Field registry.
 *
 * A node definition describes its inputs as plain data:
 *
 *   fields: [{ key: 'model', type: 'select', label: 'Model', options: [...] }]
 *
 * ...and the renderer below turns that into a controlled, styled input wired to
 * the store. Adding a new *kind* of input means adding one entry to
 * FIELD_COMPONENTS; every node type can use it immediately.
 *
 * Every interactive element carries `nodrag` so that using the control doesn't
 * also drag the node around the canvas.
 */

const TextField = ({ field, value, onChange }) => (
  <input
    className="input nodrag"
    type="text"
    value={value}
    placeholder={field.placeholder}
    onChange={(e) => onChange(e.target.value)}
  />
);

const NumberField = ({ field, value, onChange }) => (
  <input
    className="input nodrag"
    type="number"
    value={value}
    min={field.min}
    max={field.max}
    step={field.step}
    placeholder={field.placeholder}
    // Keep an empty box empty rather than coercing it to 0 mid-edit, which
    // would fight the user as they clear the field to retype it.
    onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
  />
);

const SelectField = ({ field, value, onChange }) => (
  <select className="select nodrag" value={value} onChange={(e) => onChange(e.target.value)}>
    {field.options.map((option) => {
      const { value: optionValue, label } =
        typeof option === 'string' ? { value: option, label: option } : option;
      return (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      );
    })}
  </select>
);

const SliderField = ({ field, value, onChange }) => (
  <input
    className="slider nodrag"
    type="range"
    value={value}
    min={field.min ?? 0}
    max={field.max ?? 1}
    step={field.step ?? 0.1}
    onChange={(e) => onChange(Number(e.target.value))}
  />
);

const CheckboxField = ({ field, value, onChange }) => (
  <label className="checkbox nodrag">
    <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
    <span className="checkbox-box">
      <CheckIcon size={10} />
    </span>
    <span className="checkbox-label">{field.checkboxLabel ?? field.label}</span>
  </label>
);

/*
 * File picker.
 *
 * Stores the file's *name*, not the File object: node data is serialized to JSON
 * and POSTed to the backend, and a File would silently stringify to `{}`. A real
 * upload would put the bytes somewhere and keep a reference here.
 */
const FileField = ({ field, value, onChange }) => (
  <label className="file-field nodrag">
    <input
      type="file"
      accept={field.accept}
      onChange={(e) => onChange(e.target.files?.[0]?.name ?? '')}
    />
    <span className="file-button">
      <UploadIcon size={12} />
      Choose
    </span>
    <span className="file-name" title={value || undefined}>
      {value || 'No file selected'}
    </span>
  </label>
);

/* Fixed-height multi-line input. */
const PlainTextarea = ({ field, value, onChange }) => (
  <textarea
    className={`textarea nodrag nowheel${field.mono ? ' is-mono' : ''}`}
    value={value}
    rows={field.rows ?? 3}
    placeholder={field.placeholder}
    style={{ height: 'auto', overflowY: 'auto' }}
    onChange={(e) => onChange(e.target.value)}
  />
);

/* Grows with its content — see useAutoResize. Part 3's resizing Text node. */
const AutoTextarea = ({ field, value, onChange }) => {
  const ref = useRef(null);
  useAutoResize(ref, value, {
    minWidth: field.minWidth,
    maxWidth: field.maxWidth,
    minHeight: field.minHeight,
    maxHeight: field.maxHeight,
  });

  return (
    <textarea
      ref={ref}
      className={`textarea nodrag nowheel${field.mono ? ' is-mono' : ''}`}
      value={value}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

// Split into two components rather than branching inside one, so the autosizing
// hook is never conditionally called.
const TextareaField = (props) =>
  props.field.autoResize ? <AutoTextarea {...props} /> : <PlainTextarea {...props} />;

/* Read-only chips derived from node data, e.g. the Text node's variables. */
const PillsField = ({ field, data }) => {
  const values = field.values(data);
  if (!values.length) return null;

  return (
    <div className="pill-row">
      {values.map((pill) => (
        <span key={pill} className="pill">
          {pill}
        </span>
      ))}
    </div>
  );
};

/* Static helper text. */
const HintField = ({ field, data }) => (
  <div className="field-hint">
    {typeof field.text === 'function' ? field.text(data) : field.text}
  </div>
);

/**
 * The field type registry.
 *
 * Adding a new kind of input is one entry here; every node type can use it
 * immediately. See {@link import('../types').FieldSpec} for the schema.
 */
const FIELD_COMPONENTS = {
  text: TextField,
  number: NumberField,
  select: SelectField,
  slider: SliderField,
  checkbox: CheckboxField,
  textarea: TextareaField,
  file: FileField,
  pills: PillsField,
  hint: HintField,
};

// Field types that render their own label, so NodeField shouldn't add one.
const SELF_LABELING = new Set(['checkbox', 'hint']);

/**
 * Render a single declarative field.
 */
export const NodeField = ({ field, data, onChange }) => {
  // A field can hide itself based on sibling values — e.g. the API node's body
  // field only appears for methods that take one.
  if (field.visibleIf && !field.visibleIf(data)) return null;

  // Escape hatch: a definition can supply arbitrary JSX when a declarative
  // field can't express what it needs.
  if (field.type === 'custom') {
    return field.render({ data, onChange });
  }

  const Component = FIELD_COMPONENTS[field.type];
  if (!Component) {
    console.warn(`[nodes] Unknown field type "${field.type}" for key "${field.key}".`);
    return null;
  }

  const value = data[field.key] ?? field.default ?? '';
  const showLabel = field.label && !SELF_LABELING.has(field.type);

  return (
    <div className="field">
      {showLabel && (
        <label className="field-label">
          <span>{field.label}</span>
          {/* Sliders have no readable value on their own; show the number. */}
          {field.type === 'slider' && <span className="field-value">{value}</span>}
        </label>
      )}
      <Component
        field={field}
        data={data}
        value={value}
        onChange={(next) => onChange(field.key, next)}
      />
    </div>
  );
};
