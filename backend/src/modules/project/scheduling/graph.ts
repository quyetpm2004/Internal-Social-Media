export type GraphEdge = { from: number; to: number };

const VISITING = 1;
const VISITED = 2;

function adjacency(edges: GraphEdge[]) {
  const next = new Map<number, number[]>();
  for (const edge of edges) {
    if (!next.has(edge.from)) next.set(edge.from, []);
    if (!next.has(edge.to)) next.set(edge.to, []);
    next.get(edge.from)!.push(edge.to);
  }
  for (const targets of next.values()) targets.sort((a, b) => a - b);
  return next;
}

export function findCycle(edges: GraphEdge[]): number[] | null {
  const next = adjacency(edges);
  const state = new Map<number, number>();
  const nodes = [...next.keys()].sort((a, b) => a - b);

  for (const start of nodes) {
    if (state.has(start)) continue;

    const path: number[] = [start];
    const cursor: number[] = [0];
    state.set(start, VISITING);

    while (path.length > 0) {
      const node = path[path.length - 1];
      const targets = next.get(node)!;
      const index = cursor[cursor.length - 1];

      if (index >= targets.length) {
        state.set(node, VISITED);
        path.pop();
        cursor.pop();
        continue;
      }

      cursor[cursor.length - 1] = index + 1;
      const target = targets[index];
      const targetState = state.get(target);

      if (targetState === VISITING) {
        return [...path.slice(path.indexOf(target)), target];
      }
      if (targetState === VISITED) continue;

      state.set(target, VISITING);
      path.push(target);
      cursor.push(0);
    }
  }

  return null;
}
