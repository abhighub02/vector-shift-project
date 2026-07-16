import { useEffect, useMemo } from 'react';
import { Position, useUpdateNodeInternals } from 'reactflow';
import { useStore } from '../store';

/**
 * @file Handle geometry and lifecycle for a node.
 *
 * Pulled out of BaseNode so that component is purely presentational: this hook
 * owns everything about *where handles are and when they change*, BaseNode just
 * renders what it returns.
 */

/** Which CSS offset property spaces handles along each edge. */
const OFFSET_PROPERTY = {
  [Position.Left]: 'top',
  [Position.Right]: 'top',
  [Position.Top]: 'left',
  [Position.Bottom]: 'left',
};

/**
 * Lay out a node's handles, and keep React Flow and the edge list in sync as
 * they change.
 *
 * Handles sharing a side are spaced evenly: with n on a side, handle i sits at
 * (i+1)/(n+1) of the way along. Two inputs land at 33%/66% instead of
 * overlapping, and it holds for however many a dynamic node grows to. (The
 * original scaffold hard-coded exactly this for the LLM node's two inputs, at
 * `100/3` and `200/3`.)
 *
 * @param {string} nodeId
 * @param {import('./types').HandleSpec[]} handles  already resolved against data
 * @returns {Array<import('./types').HandleSpec & {fullId: string, offset: string, offsetProperty: string}>}
 */
export const useNodeHandles = (nodeId, handles) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const syncHandles = useStore((state) => state.syncHandles);

  const positioned = useMemo(() => {
    const totals = {};
    for (const handle of handles) {
      totals[handle.position] = (totals[handle.position] || 0) + 1;
    }

    const index = {};
    return handles.map((handle) => {
      index[handle.position] = (index[handle.position] || 0) + 1;
      return {
        ...handle,
        // Namespacing by node id keeps handle ids unique across the canvas and
        // matches the scaffold's `${id}-value` convention.
        fullId: `${nodeId}-${handle.id}`,
        offset: `${(index[handle.position] / (totals[handle.position] + 1)) * 100}%`,
        offsetProperty: OFFSET_PROPERTY[handle.position],
      };
    });
  }, [handles, nodeId]);

  /*
   * A content key over the rendered handles. Node data changes on every
   * keystroke but the handle set usually doesn't, so keying the effect on this
   * string rather than the array's identity means handle bookkeeping only runs
   * when the handles genuinely changed.
   */
  const handleKey = positioned.map((h) => `${h.fullId}@${h.position}@${h.offset}`).join('|');

  // Stable identity for as long as handleKey holds, so the effect below can
  // depend on it without firing on every render.
  const handleIds = useMemo(
    () => positioned.map((h) => h.fullId),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by content, not identity
    [handleKey]
  );

  useEffect(() => {
    // React Flow caches handle geometry per node. A node that adds, removes or
    // moves a handle after mount must say so, or edges anchor to stale
    // coordinates.
    updateNodeInternals(nodeId);

    // Drop any edge still pointing at a handle this node no longer renders.
    syncHandles(nodeId, handleIds);
  }, [nodeId, handleIds, updateNodeInternals, syncHandles]);

  return positioned;
};
