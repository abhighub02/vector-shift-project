import { Position } from 'reactflow';
import { FilterIcon } from '../../lib/icons';

/*
 * New node 1 of 5 — Filter.
 *
 * Demonstrates: branching output. Two source handles on the same edge, spaced
 * automatically, plus a field whose visibility depends on a sibling field's
 * value (unary operators take no comparison value).
 */

const UNARY_OPERATORS = ['is empty', 'is not empty'];

export const filterNode = {
  type: 'filter',
  label: 'Filter',
  subtitle: (data) => `${data.operator ?? ''} ${data.value ?? ''}`.trim() || 'Condition',
  icon: FilterIcon,
  group: 'Logic',

  handles: [
    { id: 'input', type: 'target', position: Position.Left, label: 'input' },
    { id: 'true', type: 'source', position: Position.Right, label: 'true' },
    { id: 'false', type: 'source', position: Position.Right, label: 'false' },
  ],

  fields: [
    {
      key: 'operator',
      type: 'select',
      label: 'Operator',
      options: ['equals', 'not equals', 'contains', 'greater than', 'less than', ...UNARY_OPERATORS],
      default: 'contains',
    },
    {
      key: 'value',
      type: 'text',
      label: 'Value',
      placeholder: 'compare against…',
      default: '',
      visibleIf: (data) => !UNARY_OPERATORS.includes(data.operator),
    },
    {
      key: 'caseSensitive',
      type: 'checkbox',
      checkboxLabel: 'Case sensitive',
      default: false,
    },
  ],
};
