import { useCallback } from 'react';
import { useStore } from '../store';

/**
 * Field-handling logic shared by every node.
 *
 * Nodes are controlled by the store rather than local `useState`. That matters
 * beyond tidiness: the original scaffold's nodes keep edits in component state,
 * so a user's input never reaches the store — and Part 4 would then submit empty
 * `data` for every node. Routing edits through here is what makes what you see
 * on the canvas and what you send to the backend the same thing.
 *
 * @param {string} nodeId
 * @returns {{onFieldChange: (key: string, value: *) => void, onDelete: (event: Event) => void}}
 */
export const useNodeData = (nodeId) => {
  const updateNodeField = useStore((state) => state.updateNodeField);
  const deleteNode = useStore((state) => state.deleteNode);

  const onFieldChange = useCallback(
    (key, value) => updateNodeField(nodeId, key, value),
    [nodeId, updateNodeField]
  );

  const onDelete = useCallback(
    (event) => {
      // Without this the click also selects the node underneath, which then
      // no longer exists.
      event.stopPropagation();
      deleteNode(nodeId);
    },
    [nodeId, deleteNode]
  );

  return { onFieldChange, onDelete };
};
