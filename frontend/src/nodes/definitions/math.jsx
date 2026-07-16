import { Position } from 'reactflow';
import { MathIcon } from '../../lib/icons';

/*
 * New node 3 of 5 — Math.
 *
 * Demonstrates: the `custom` field escape hatch. The live formula preview isn't
 * an input at all, so no declarative field type could express it — a definition
 * can drop to JSX for one field without giving up the shell.
 */

const SYMBOLS = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  power: '^',
  modulo: '%',
};

export const mathNode = {
  type: 'math',
  label: 'Math',
  subtitle: (data) => `a ${SYMBOLS[data.operation] ?? '+'} b`,
  icon: MathIcon,
  group: 'Logic',

  handles: [
    { id: 'a', type: 'target', position: Position.Left, label: 'a' },
    { id: 'b', type: 'target', position: Position.Left, label: 'b' },
    { id: 'result', type: 'source', position: Position.Right, label: 'result' },
  ],

  fields: [
    {
      key: 'operation',
      type: 'select',
      label: 'Operation',
      options: [
        { value: 'add', label: 'Add (a + b)' },
        { value: 'subtract', label: 'Subtract (a − b)' },
        { value: 'multiply', label: 'Multiply (a × b)' },
        { value: 'divide', label: 'Divide (a ÷ b)' },
        { value: 'power', label: 'Power (a ^ b)' },
        { value: 'modulo', label: 'Modulo (a % b)' },
      ],
      default: 'add',
    },
    {
      key: 'precision',
      type: 'number',
      label: 'Decimal places',
      min: 0,
      max: 10,
      default: 2,
    },
    {
      key: 'formula',
      type: 'custom',
      render: ({ data }) => (
        <div className="field">
          <span className="field-label">Preview</span>
          <div className="pill-row">
            <span className="pill">
              result = a {SYMBOLS[data.operation] ?? '+'} b
            </span>
          </div>
        </div>
      ),
    },
  ],
};
