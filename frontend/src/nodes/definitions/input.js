import { Position } from 'reactflow';
import { InputIcon } from '../../lib/icons';

/*
 * Pipeline entry point. One of the four node types from the original scaffold,
 * rewritten as a definition.
 */
export const inputNode = {
  type: 'customInput',
  label: 'Input',
  subtitle: (data) => data.inputName || 'Pipeline entry',
  icon: InputIcon,
  group: 'Core',

  handles: [{ id: 'value', type: 'source', position: Position.Right, label: 'value' }],

  fields: [
    {
      key: 'inputName',
      type: 'text',
      label: 'Name',
      placeholder: 'input_1',
      default: 'input_1',
    },
    {
      key: 'inputType',
      type: 'select',
      label: 'Type',
      options: ['Text', 'File', 'Number', 'JSON'],
      default: 'Text',
    },
    {
      // Only meaningful for a File input, so it only exists for one.
      key: 'file',
      type: 'file',
      label: 'Source file',
      default: '',
      visibleIf: (data) => data.inputType === 'File',
    },
  ],
};
