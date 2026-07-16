import { NoteIcon } from '../../lib/icons';

/*
 * New node 5 of 5 — Note.
 *
 * Demonstrates the floor of the abstraction: a node with *no handles at all*.
 * It never connects to anything and contributes nothing to the DAG — it's a
 * comment pinned to the canvas.
 *
 * Worth including precisely because it's degenerate. A node abstraction that
 * assumed "every node has inputs and outputs" would need a special case here;
 * this one just omits a key.
 */
export const noteNode = {
  type: 'note',
  label: 'Note',
  subtitle: 'Canvas annotation',
  icon: NoteIcon,
  group: 'Utility',
  width: 220,

  // No `handles` key — BaseNode defaults to none.

  fields: [
    {
      key: 'note',
      type: 'textarea',
      autoResize: true,
      placeholder: 'Jot down context for your teammates…',
      default: '',
      minWidth: 196,
      maxWidth: 320,
      minHeight: 60,
    },
  ],
};
