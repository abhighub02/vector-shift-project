import { Position } from 'reactflow';
import { MergeIcon } from '../../lib/icons';

/*
 * New node 4 of 5 — Merge.
 *
 * Demonstrates: dynamic handles driven by a field. Raising "Inputs" grows the
 * node's target handles from 2 to 6; lowering it removes them, and BaseNode's
 * edge pruning cleans up any connections left dangling.
 *
 * This is the same mechanism the Text node uses for `{{ variables }}`, reached
 * from a completely different input — which is what makes it worth having in
 * the abstraction rather than special-cased in the Text node.
 */

const MIN_INPUTS = 2;
const MAX_INPUTS = 6;

const clampInputs = (value) => {
  const count = Number(value);
  if (!Number.isFinite(count)) return MIN_INPUTS;
  return Math.min(Math.max(Math.trunc(count), MIN_INPUTS), MAX_INPUTS);
};

export const mergeNode = {
  type: 'merge',
  label: 'Merge',
  subtitle: (data) => `${clampInputs(data.inputCount)} inputs · ${data.strategy ?? 'concat'}`,
  icon: MergeIcon,
  group: 'Logic',

  handles: (data) => [
    ...Array.from({ length: clampInputs(data.inputCount) }, (_, index) => ({
      id: `input-${index + 1}`,
      type: 'target',
      position: Position.Left,
      label: `in ${index + 1}`,
    })),
    { id: 'output', type: 'source', position: Position.Right, label: 'merged' },
  ],

  fields: [
    {
      key: 'inputCount',
      type: 'number',
      label: 'Inputs',
      min: MIN_INPUTS,
      max: MAX_INPUTS,
      step: 1,
      default: 2,
    },
    {
      key: 'strategy',
      type: 'select',
      label: 'Strategy',
      options: [
        { value: 'concat', label: 'Concatenate' },
        { value: 'array', label: 'Collect into array' },
        { value: 'object', label: 'Merge objects' },
      ],
      default: 'concat',
    },
    {
      key: 'separator',
      type: 'text',
      label: 'Separator',
      placeholder: '\\n',
      default: '\\n',
      visibleIf: (data) => (data.strategy ?? 'concat') === 'concat',
    },
  ],
};
