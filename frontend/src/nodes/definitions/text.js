import { Position } from 'reactflow';
import { TextIcon } from '../../lib/icons';
import { parseVariables } from '../../lib/parseVariables';

/*
 * Part 3: the Text node.
 *
 * Both requirements land here without any bespoke node component:
 *
 *   - Resizing is `autoResize` on the textarea field. The card has no fixed
 *     width, so growing the textarea grows the node with it.
 *   - Variable handles come from `handles` being a *function of node data*.
 *     Typing `{{ topic }}` re-derives the handle list on the next render;
 *     BaseNode diffs it, tells React Flow the geometry moved, and prunes edges
 *     for any variable that was removed.
 *
 * The abstraction already supported both, which is the point — no other node
 * type had to know about any of it.
 */
export const textNode = {
  type: 'text',
  label: 'Text',
  subtitle: (data) => {
    const count = parseVariables(data.text).length;
    if (!count) return 'Template';
    return `${count} variable${count === 1 ? '' : 's'}`;
  },
  icon: TextIcon,
  group: 'Core',

  // One target handle per distinct `{{ variable }}`, plus the text output.
  handles: (data) => [
    ...parseVariables(data.text).map((name) => ({
      id: name,
      type: 'target',
      position: Position.Left,
      label: name,
    })),
    { id: 'output', type: 'source', position: Position.Right, label: 'output' },
  ],

  fields: [
    {
      key: 'text',
      type: 'textarea',
      label: 'Text',
      autoResize: true,
      mono: true,
      placeholder: 'Write a haiku about {{ topic }}',
      default: '{{ input }}',
      minWidth: 200,
      maxWidth: 420,
      minHeight: 34,
      maxHeight: 320,
    },
    {
      key: 'variables',
      type: 'pills',
      label: 'Variables',
      values: (data) => parseVariables(data.text),
      // Hide the label along with the chips when there's nothing to show.
      visibleIf: (data) => parseVariables(data.text).length > 0,
    },
  ],
};
