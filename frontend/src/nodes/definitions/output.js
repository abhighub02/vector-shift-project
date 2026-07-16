import { Position } from 'reactflow';
import { OutputIcon } from '../../lib/icons';

/* Pipeline exit point. */
export const outputNode = {
  type: 'customOutput',
  label: 'Output',
  subtitle: (data) => data.outputName || 'Pipeline result',
  icon: OutputIcon,
  group: 'Core',

  handles: [{ id: 'value', type: 'target', position: Position.Left, label: 'value' }],

  fields: [
    {
      key: 'outputName',
      type: 'text',
      label: 'Name',
      placeholder: 'output_1',
      default: 'output_1',
    },
    {
      key: 'outputType',
      type: 'select',
      label: 'Type',
      options: ['Text', 'Image', 'File', 'JSON'],
      default: 'Text',
    },
  ],
};
