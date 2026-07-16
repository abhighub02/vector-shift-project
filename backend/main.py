"""VectorShift pipeline backend.

Exposes a single endpoint, ``POST /pipelines/parse``, which accepts a pipeline
graph from the frontend and reports its size and whether it is a DAG.
"""

from collections import defaultdict, deque
from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

app = FastAPI(
    title="VectorShift Pipeline API",
    description="Parses pipeline graphs built in the frontend node editor.",
    version="1.0.0",
)

# The browser sends cross-origin requests from the Vite dev server, so without
# CORS the fetch in submit.jsx fails before it ever reaches the endpoint.
# Both ports are listed because Vite falls back to 5173 if 3000 is taken.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------- models


class Node(BaseModel):
    """A single node in the pipeline.

    ``extra="allow"`` keeps this forgiving: the frontend can add fields to a
    node's payload without a matching backend change, which matters because the
    node abstraction lets new node types define arbitrary data shapes.
    """

    model_config = ConfigDict(extra="allow")

    id: str
    type: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)


class Edge(BaseModel):
    """A directed connection from one node's handle to another's."""

    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class Pipeline(BaseModel):
    nodes: List[Node] = Field(default_factory=list)
    edges: List[Edge] = Field(default_factory=list)


class ParseResponse(BaseModel):
    """Response shape required by the assessment."""

    num_nodes: int
    num_edges: int
    is_dag: bool


# ------------------------------------------------------------------ dag check


def is_dag(nodes: List[Node], edges: List[Edge]) -> bool:
    """Return True if the graph is a directed acyclic graph.

    Uses Kahn's algorithm: repeatedly remove nodes with no remaining incoming
    edges. If every node can be removed this way, a full topological order
    exists and the graph is acyclic. Any nodes left over are precisely those
    caught in (or reachable only through) a cycle.

    Kahn's is preferred over recursive DFS here because it is iterative — a
    long pipeline can't blow Python's recursion limit — and because the count of
    unvisited nodes falls out of it for free.

    Edge cases this handles correctly:

    * Empty graph — vacuously a DAG.
    * Self-loops (``a -> a``) — the node's in-degree can never reach zero, so it
      is never emitted and the graph is correctly reported cyclic.
    * Parallel duplicate edges — multiplicity is preserved in both the adjacency
      list and the in-degree count, so they cancel out exactly. Two nodes joined
      by two identical edges is still a DAG.
    * Edges naming a node that isn't in ``nodes`` — skipped. A dangling edge is
      frontend state that got out of sync, not a cycle, and indexing on it would
      corrupt the in-degree bookkeeping for real nodes.
    """
    node_ids = {node.id for node in nodes}

    adjacency: Dict[str, List[str]] = defaultdict(list)
    in_degree: Dict[str, int] = {node_id: 0 for node_id in node_ids}

    for edge in edges:
        # Ignore edges pointing at nodes that don't exist in this payload.
        if edge.source not in node_ids or edge.target not in node_ids:
            continue
        adjacency[edge.source].append(edge.target)
        in_degree[edge.target] += 1

    # Seed with every node that has nothing depending on it.
    queue = deque(node_id for node_id, degree in in_degree.items() if degree == 0)

    visited = 0
    while queue:
        current = queue.popleft()
        visited += 1

        for neighbour in adjacency[current]:
            in_degree[neighbour] -= 1
            if in_degree[neighbour] == 0:
                queue.append(neighbour)

    # Any node never emitted is part of, or downstream of, a cycle.
    return visited == len(node_ids)


# ------------------------------------------------------------------ endpoints


@app.get("/")
def read_root():
    """Health check."""
    return {"status": "ok", "service": "VectorShift Pipeline API"}


@app.post("/pipelines/parse", response_model=ParseResponse)
def parse_pipeline(pipeline: Pipeline) -> ParseResponse:
    """Report the node count, edge count, and whether the pipeline is a DAG."""
    return ParseResponse(
        num_nodes=len(pipeline.nodes),
        num_edges=len(pipeline.edges),
        is_dag=is_dag(pipeline.nodes, pipeline.edges),
    )
