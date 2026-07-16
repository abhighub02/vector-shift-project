import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, MarkerType } from 'reactflow';

/*
 * Single source of truth for the pipeline graph.
 *
 * Nodes keep their user-entered state in `data`, which is exactly the shape the
 * backend receives on submit — no separate serialization step to drift out of
 * sync with what's on screen.
 */
export const useStore = create((set, get) => ({
  nodes: [],
  edges: [],

  // Per-type counters, so ids read as `text-1`, `text-2`, `llm-1`.
  nodeCounters: {},

  /**
   * Mint a unique, human-readable id for a new node of `type`.
   */
  getNodeID: (type) => {
    const counters = { ...get().nodeCounters };
    counters[type] = (counters[type] || 0) + 1;
    set({ nodeCounters: counters });
    return `${type}-${counters[type]}`;
  },

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, height: 18, width: 18 },
        },
        get().edges
      ),
    });
  },

  /**
   * Update one field on one node.
   *
   * Only the touched node gets a new object identity; every other node keeps
   * its reference so React can skip re-rendering it. With memoized node
   * components this keeps typing in a Text node from re-rendering the canvas.
   */
  updateNodeField: (nodeId, fieldKey, value) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, [fieldKey]: value } } : node
      ),
    });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      // Drop edges on both sides, otherwise they'd point at a node that's gone.
      edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    });
  },

  /**
   * Reconcile edges against a node's current set of handle ids.
   *
   * Nodes with dynamic handles (Text variables, Merge inputs) can remove a
   * handle that already has an edge attached — deleting `{{ name }}` from a
   * template is the common case. React Flow does not prune those edges itself,
   * so they'd linger as edges anchored to a handle that no longer exists,
   * rendering at the node origin and, worse, still being submitted to the
   * backend as real edges and skewing the DAG check.
   *
   * BaseNode calls this whenever a node's handle set changes.
   *
   * @param {string} nodeId
   * @param {string[]} handleIds  fully-qualified ids currently rendered
   */
  syncHandles: (nodeId, handleIds) => {
    const { edges } = get();
    const valid = new Set(handleIds);

    const remaining = edges.filter((edge) => {
      if (edge.source === nodeId && edge.sourceHandle && !valid.has(edge.sourceHandle)) {
        return false;
      }
      if (edge.target === nodeId && edge.targetHandle && !valid.has(edge.targetHandle)) {
        return false;
      }
      return true;
    });

    // Bail without touching state when nothing was orphaned; this runs on every
    // keystroke in a Text node and must not churn the store.
    if (remaining.length !== edges.length) {
      set({ edges: remaining });
    }
  },

  clearPipeline: () => set({ nodes: [], edges: [] }),
}));
