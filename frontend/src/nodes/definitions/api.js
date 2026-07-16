import { Position } from 'reactflow';
import { ApiIcon } from '../../lib/icons';

/*
 * New node 2 of 5 — API request.
 *
 * Demonstrates: conditional fields and multiple typed outputs. The body field
 * only exists for methods that carry one, and the node forks into `response`
 * and `error` so a pipeline can handle failure explicitly.
 */

const METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH'];

export const apiNode = {
  type: 'api',
  label: 'API Request',
  subtitle: (data) => `${data.method ?? 'GET'} ${data.url || 'no URL set'}`,
  icon: ApiIcon,
  group: 'Integrations',
  width: 260,

  handles: [
    { id: 'trigger', type: 'target', position: Position.Left, label: 'trigger' },
    { id: 'body', type: 'target', position: Position.Left, label: 'body' },
    { id: 'response', type: 'source', position: Position.Right, label: 'response' },
    { id: 'error', type: 'source', position: Position.Right, label: 'error' },
  ],

  fields: [
    {
      key: 'method',
      type: 'select',
      label: 'Method',
      options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      default: 'GET',
    },
    {
      key: 'url',
      type: 'text',
      label: 'URL',
      placeholder: 'https://api.example.com/v1/items',
      default: '',
    },
    {
      key: 'payload',
      type: 'textarea',
      label: 'Body',
      mono: true,
      rows: 3,
      placeholder: '{ "key": "value" }',
      default: '',
      visibleIf: (data) => METHODS_WITH_BODY.includes(data.method),
    },
    {
      key: 'timeout',
      type: 'number',
      label: 'Timeout (s)',
      min: 1,
      max: 300,
      default: 30,
    },
  ],
};
