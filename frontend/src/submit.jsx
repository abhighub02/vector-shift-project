import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from './store';
import { CheckIcon, AlertIcon, CloseIcon, SubmitIcon } from './lib/icons';

/*
 * Part 4: submit the pipeline to the backend and report what came back.
 *
 * The endpoint is configurable so the app can point at a deployed backend
 * without a code change; it falls back to the local uvicorn default.
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

/**
 * Reduce a React Flow node to what the backend actually needs.
 *
 * React Flow decorates nodes with view state (selected, dragging, computed
 * dimensions, absolute positions). None of it describes the pipeline, and
 * sending it would mean the request body changes depending on whether a node
 * happened to be selected when the user hit Submit.
 */
const serializeNode = (node) => ({
  id: node.id,
  type: node.type,
  data: node.data,
  position: node.position,
});

const serializeEdge = (edge) => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  sourceHandle: edge.sourceHandle,
  targetHandle: edge.targetHandle,
});

/* The "alert": a modal summarising the backend's analysis. */
const ResultModal = ({ result, onClose }) => {
  // Escape to dismiss — a modal that can only be closed by mouse is a trap for
  // keyboard users.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const { num_nodes: numNodes, num_edges: numEdges, is_dag: isDag } = result;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="result-title"
        // Clicks inside the card must not reach the backdrop's close handler.
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div className={`modal-badge ${isDag ? 'is-valid' : 'is-invalid'}`}>
            {isDag ? <CheckIcon size={18} /> : <AlertIcon size={18} />}
          </div>
          <div>
            <h2 className="modal-title" id="result-title">
              Pipeline analysed
            </h2>
            <p className="modal-subtitle">
              {numNodes === 0
                ? 'The canvas is empty — add some nodes to build a pipeline.'
                : `Your pipeline has ${numNodes} node${numNodes === 1 ? '' : 's'} and ${numEdges} connection${
                    numEdges === 1 ? '' : 's'
                  }.`}
            </p>
          </div>
        </header>

        <div className="modal-body">
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-value">{numNodes}</div>
              <div className="stat-label">Nodes</div>
            </div>
            <div className="stat">
              <div className="stat-value">{numEdges}</div>
              <div className="stat-label">Edges</div>
            </div>
          </div>

          <div className="dag-row">
            <div className={`dag-icon ${isDag ? 'is-valid' : 'is-invalid'}`}>
              {isDag ? <CheckIcon size={14} /> : <AlertIcon size={14} />}
            </div>
            <div>
              <div className="dag-text">{isDag ? 'Valid DAG' : 'Not a DAG'}</div>
              <div className="dag-detail">
                {isDag
                  ? 'No cycles — this pipeline can execute.'
                  : 'A cycle was found; execution would loop forever.'}
              </div>
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="btn" onClick={onClose} autoFocus>
            <CloseIcon size={14} />
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};

export const SubmitButton = () => {
  const { nodes, edges } = useStore(
    useShallow((state) => ({ nodes: state.nodes, edges: state.edges }))
  );

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/pipelines/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.map(serializeNode),
          edges: edges.map(serializeEdge),
        }),
      });

      // fetch only rejects on network failure; a 4xx/5xx still resolves, so the
      // status has to be checked explicitly or we'd parse an error page as data.
      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status} ${response.statusText}`);
      }

      setResult(await response.json());
    } catch (caught) {
      setError(
        caught instanceof TypeError
          ? `Couldn't reach the backend at ${API_BASE}. Is uvicorn running?`
          : caught.message
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [nodes, edges]);

  return (
    <>
      <div className="submit-bar">
        {error && (
          <div className="submit-error" role="alert">
            <AlertIcon size={14} />
            {error}
          </div>
        )}
        <button className="btn btn-primary" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? <span className="spinner" /> : <SubmitIcon size={14} />}
          {isSubmitting ? 'Analysing…' : 'Submit Pipeline'}
        </button>
      </div>

      {result && <ResultModal result={result} onClose={() => setResult(null)} />}
    </>
  );
};
