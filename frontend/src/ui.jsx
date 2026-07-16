import { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import { useShallow } from 'zustand/react/shallow';
import 'reactflow/dist/style.css';

import { useStore } from './store';
import { nodeTypes, nodeDefinitions, getDefaultData, resolveAccent } from './nodes/registry';
import { CanvasIcon } from './lib/icons';

const PROXIMITY_GRID = [16, 16];

const EmptyState = () => (
  <div className="canvas-empty">
    <div className="canvas-empty-icon">
      <CanvasIcon />
    </div>
    <div className="canvas-empty-title">Build a pipeline</div>
    <p className="canvas-empty-hint">
      Drag a node from the toolbar onto the canvas, then connect handles to wire it up.
    </p>
  </div>
);

const Canvas = () => {
  const { screenToFlowPosition } = useReactFlow();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  /*
   * `useShallow` matters here: this selector builds a new object every time the
   * store changes, and without a shallow compare React Flow would re-render on
   * every unrelated store write.
   */
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, getNodeID } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      addNode: state.addNode,
      getNodeID: state.getNodeID,
    }))
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDraggingOver(true);
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDraggingOver(false);

      const type = event.dataTransfer.getData('application/reactflow');
      // Ignore drags that didn't originate from the toolbar (files, text, …).
      if (!type || !nodeDefinitions[type]) return;

      // Convert the drop point from screen space to canvas space, so the node
      // lands under the cursor at any pan/zoom.
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      addNode({
        id: getNodeID(type),
        type,
        position,
        // Defaults come from the definition's fields — see registry.
        data: getDefaultData(type),
      });
    },
    [screenToFlowPosition, addNode, getNodeID]
  );

  return (
    <div className="canvas" onDragOver={onDragOver} onDragLeave={() => setIsDraggingOver(false)}>
      {nodes.length === 0 && !isDraggingOver && <EmptyState />}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        proOptions={{ hideAttribution: true }}
        snapGrid={PROXIMITY_GRID}
        snapToGrid
        // Deliberately no `fitView`: the canvas starts empty, so it would first
        // fire when the user drops their very first node — zooming the canvas to
        // maxZoom and yanking that node away from the cursor they dropped it at.
        // Nodes are already placed under the pointer, so there is nothing to fit.
        // Deleting a node via keyboard should take its edges with it; React Flow
        // handles that itself, and `deleteNode` covers the button path.
        deleteKeyCode={['Backspace', 'Delete']}
        defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#232838" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(11, 13, 20, 0.75)"
          style={{ background: 'var(--surface-raised)' }}
          nodeColor={(node) =>
            nodeDefinitions[node.type] ? `var(--hue-${resolveAccent(nodeDefinitions[node.type])})` : 'var(--hue-indigo)'
          }
        />
      </ReactFlow>
    </div>
  );
};

/*
 * `useReactFlow` (for screenToFlowPosition) requires a provider above it, so the
 * canvas is split from the provider boundary.
 */
export const PipelineUI = () => (
  <ReactFlowProvider>
    <Canvas />
  </ReactFlowProvider>
);
