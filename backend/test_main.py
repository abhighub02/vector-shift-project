"""Tests for the pipeline parser.

Run: .venv/Scripts/python -m pytest test_main.py -v
"""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def parse(nodes, edges):
    """POST a graph built from bare ids and (source, target) pairs."""
    return client.post(
        "/pipelines/parse",
        json={
            "nodes": [{"id": n, "type": "text", "data": {}} for n in nodes],
            "edges": [
                {"id": f"e{i}", "source": s, "target": t}
                for i, (s, t) in enumerate(edges)
            ],
        },
    ).json()


def test_empty_pipeline_is_a_dag():
    assert parse([], []) == {"num_nodes": 0, "num_edges": 0, "is_dag": True}


def test_counts_nodes_and_edges():
    result = parse(["a", "b", "c"], [("a", "b"), ("b", "c")])
    assert result["num_nodes"] == 3
    assert result["num_edges"] == 2


def test_simple_chain_is_a_dag():
    assert parse(["a", "b", "c"], [("a", "b"), ("b", "c")])["is_dag"] is True


def test_disconnected_nodes_are_a_dag():
    assert parse(["a", "b", "c"], [])["is_dag"] is True


def test_diamond_is_a_dag():
    # a -> b, a -> c, b -> d, c -> d. Converging paths are not a cycle.
    edges = [("a", "b"), ("a", "c"), ("b", "d"), ("c", "d")]
    assert parse(["a", "b", "c", "d"], edges)["is_dag"] is True


def test_two_node_cycle_is_not_a_dag():
    assert parse(["a", "b"], [("a", "b"), ("b", "a")])["is_dag"] is False


def test_long_cycle_is_not_a_dag():
    edges = [("a", "b"), ("b", "c"), ("c", "d"), ("d", "a")]
    assert parse(["a", "b", "c", "d"], edges)["is_dag"] is False


def test_self_loop_is_not_a_dag():
    assert parse(["a"], [("a", "a")])["is_dag"] is False


def test_cycle_in_one_component_taints_whole_pipeline():
    # a -> b is fine, but c <-> d cycles.
    edges = [("a", "b"), ("c", "d"), ("d", "c")]
    assert parse(["a", "b", "c", "d"], edges)["is_dag"] is False


def test_parallel_duplicate_edges_are_still_a_dag():
    # Two identical a -> b edges. In-degree must be decremented once per edge,
    # or b would never be emitted and this would report a false cycle.
    result = parse(["a", "b"], [("a", "b"), ("a", "b")])
    assert result["num_edges"] == 2
    assert result["is_dag"] is True


def test_edge_to_unknown_node_is_ignored_for_dag():
    # A dangling edge is stale frontend state, not a cycle. It still counts.
    result = parse(["a"], [("a", "ghost")])
    assert result["num_edges"] == 1
    assert result["is_dag"] is True


def test_node_data_is_accepted_with_arbitrary_shape():
    # The node abstraction lets any node type define its own data keys.
    response = client.post(
        "/pipelines/parse",
        json={
            "nodes": [
                {
                    "id": "text-1",
                    "type": "text",
                    "data": {"text": "{{ a }}", "nested": {"deep": [1, 2]}},
                    "position": {"x": 1.5, "y": -2},
                }
            ],
            "edges": [],
        },
    )
    assert response.status_code == 200
    assert response.json()["num_nodes"] == 1


def test_handles_are_preserved_but_do_not_affect_dag():
    response = client.post(
        "/pipelines/parse",
        json={
            "nodes": [{"id": "a", "type": "text"}, {"id": "b", "type": "text"}],
            "edges": [
                {
                    "id": "e1",
                    "source": "a",
                    "target": "b",
                    "sourceHandle": "a-output",
                    "targetHandle": "b-input",
                }
            ],
        },
    )
    assert response.json() == {"num_nodes": 2, "num_edges": 1, "is_dag": True}


def test_large_chain_does_not_hit_recursion_limits():
    # Kahn's is iterative; a recursive DFS would risk a RecursionError here.
    nodes = [f"n{i}" for i in range(2000)]
    edges = [(f"n{i}", f"n{i + 1}") for i in range(1999)]
    assert parse(nodes, edges)["is_dag"] is True


def test_health_check():
    assert client.get("/").status_code == 200
