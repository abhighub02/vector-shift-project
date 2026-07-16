import { Position } from 'reactflow';
import { LLMIcon } from '../../lib/icons';

/*
 * Language model call.
 *
 * Shows the abstraction handling multiple inputs on one side: BaseNode spaces
 * `system` and `prompt` down the left edge automatically.
 */
export const llmNode = {
  type: 'llm',
  label: 'LLM',
  subtitle: (data) => data.model,
  icon: LLMIcon,
  group: 'Core',
  width: 240,

  handles: [
    { id: 'system', type: 'target', position: Position.Left, label: 'system' },
    { id: 'prompt', type: 'target', position: Position.Left, label: 'prompt' },
    { id: 'response', type: 'source', position: Position.Right, label: 'response' },
  ],

  fields: [
    {
      key: 'model',
      type: 'select',
      label: 'Model',
      options: [
        { value: 'claude-opus-4-8', label: 'Claude Opus 4.8' },
        { value: 'claude-sonnet-5', label: 'Claude Sonnet 5' },
        { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
      ],
      default: 'claude-sonnet-5',
    },
    {
      key: 'temperature',
      type: 'slider',
      label: 'Temperature',
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.7,
    },
    {
      key: 'maxTokens',
      type: 'number',
      label: 'Max tokens',
      min: 1,
      max: 64000,
      step: 256,
      default: 4096,
    },
  ],
};
