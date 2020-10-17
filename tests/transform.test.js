import {
  flatten,
  transformNodes,
  dedupNodes,
  addMissingNodes,
  explodeEdges,
} from '../src/js/transform';
import {deepLink} from '../src/js/parser';

const randomString = () => Math.random().toString(36).substring(7);

describe('flatten diagrams', () => {
  const subSubNode1 = {id: randomString(), nodes: [], edges: []};
  const subSubNode2 = {id: randomString(), nodes: [], edges: []};
  const subNode1 = {
    id: randomString(),
    nodes: [subSubNode1, subSubNode2],
    edges: [],
  };
  const subNode2 = {id: randomString(), nodes: [], edges: []};
  const node1 = {id: randomString(), nodes: [subNode1], edges: []};
  const node2 = {id: randomString(), nodes: [subNode2], edges: []};

  const edge1 = {src: subSubNode1.id, dst: subSubNode2.id};
  const edge2 = {src: subNode1.id, dst: subNode2.id};
  const edge3 = {src: subNode2.id, dst: subSubNode1.id};
  const edge4 = {src: node1.id, dst: node2.id};

  subNode1.edges = [edge1];
  node1.edges = [edge2];

  const diagram = {
    id: randomString(),
    nodes: [node1, node2],
    edges: [edge3, edge4],
  };

  test('full diagram', () => {
    expect(flatten(diagram)).toEqual({
      id: diagram.id,
      nodes: [
        {
          id: node1.id,
          nodes: [subNode1],
          parent: undefined,
          edges: [edge2],
        },
        {
          id: subNode1.id,
          nodes: [subSubNode1, subSubNode2],
          parent: node1,
          edges: [edge1],
        },
        {
          id: subSubNode1.id,
          nodes: [],
          parent: subNode1,
          edges: [],
        },
        {
          id: subSubNode2.id,
          nodes: [],
          parent: subNode1,
          edges: [],
        },
        {
          id: node2.id,
          nodes: [subNode2],
          parent: undefined,
          edges: [],
        },
        {
          id: subNode2.id,
          nodes: [],
          parent: node2,
          edges: [],
        },
      ],
      edges: [edge3, edge4, edge2, edge1],
    });
  });
});

describe("transform nodes", () => {
  const subSubNode1 = {id: randomString(), nodes: [], edges: []};
  const subSubNode2 = {id: randomString(), nodes: [], edges: []};
  const subNode1 = {
    id: randomString(),
    nodes: [subSubNode1, subSubNode2],
    edges: [],
  };
  const subNode2 = {id: randomString(), nodes: [], edges: []};
  const node1 = {id: randomString(), nodes: [subNode1], edges: []};
  const node2 = {id: randomString(), nodes: [subNode2], edges: []};

  subSubNode1.parent = subNode1;
  subSubNode2.parent = subNode1;
  subNode1.parent = node1;
  subNode2.parent = node2;

  const diagram = {
    id: randomString(),
    nodes: [node1, subNode1, subSubNode1, subSubNode2, node2, subNode2],
    edges: [],
  };

  it("it transform nodes", () => {
    expect(transformNodes(diagram)).toEqual({
      id: diagram.id,
      nodes: [
        {
          id: node1.id,
          children: [subNode1.id],
          parent: undefined,
        },
        {
          id: subNode1.id,
          children: [subSubNode1.id, subSubNode2.id],
          parent: node1.id,
        },
        {
          id: subSubNode1.id,
          children: [],
          parent: subNode1.id,
        },
        {
          id: subSubNode2.id,
          children: [],
          parent: subNode1.id,
        },
        {
          id: node2.id,
          children: [subNode2.id],
          parent: undefined,
        },
        {
          id: subNode2.id,
          children: [],
          parent: node2.id,
        },
      ],
      edges: [],
    });
  });
});

describe('deduplicate nodes', () => {
  test('it removes nodes with duplicate IDs by keeping the latest', () => {
    const nodes = [
      {id: 'a', nodes: [], edges: []},
      {id: 'b', nodes: [{id: 'b1', nodes: [], edges: []}], edges: []},
      {id: 'a', nodes: [{id: 'a1', nodes: [], edges: []}], edges: []},
    ];

    expect(dedupNodes({id: 'd', nodes})).toEqual({
      id: 'd',
      nodes: [nodes[2], nodes[1]],
    });
  });
});

describe('add missing nodes', () => {
  test('it adds generic nodes for each edge without a corresponding node', () => {
    expect(
      addMissingNodes({
        id: 'd',
        nodes: [{id: 'n', nodes: [], edges: []}],
        edges: [
          {src: 'm1', dst: 'n'},
          {src: 'n', dst: 'm1'},
          {src: 'm1', dst: 'm2'},
        ],
      }),
    ).toEqual({
      id: 'd',
      nodes: [
        {id: 'n', nodes: [], edges: []},
        {
          id: 'm1',
          provider: 'generic',
          service: 'unknown',
          nodes: [],
          edges: [],
        },
        {
          id: 'm2',
          provider: 'generic',
          service: 'unknown',
          nodes: [],
          edges: [],
        },
      ],
      edges: [
        {src: 'm1', dst: 'n'},
        {src: 'n', dst: 'm1'},
        {src: 'm1', dst: 'm2'},
      ],
    });
  });
});

describe('explode edges', () => {
  const subNode1 = {id: randomString(), children: [], edges: []};
  const subNode2 = {id: randomString(), children: [], edges: []};
  const node1 = {id: randomString(), children: [], edges: []};
  const node2 = {id: randomString(), children: [subNode1, subNode2], edges: []};

  test('it creates edges to subnodes for deep link connections', () => {
    const edge = {src: node1.id, dst: node2.id, connection: deepLink};

    const diagram = {
      id: randomString(),
      nodes: [node1, node2, subNode1, subNode2],
      edges: [edge],
    };

    expect(explodeEdges(diagram)).toEqual({
      id: diagram.id,
      nodes: diagram.nodes,
      edges: [
        {src: node1.id, dst: subNode1.id},
        {src: node1.id, dst: subNode2.id},
      ],
    });
  });

  test('it ignores deep link connections to nodes without subnodes', () => {
    const node3 = {id: randomString(), children: [], edges: []};
    const edge = {src: node1.id, dst: node3.id, connection: deepLink};

    const diagram = {
      id: randomString(),
      nodes: [node1, node2, node3, subNode1, subNode2],
      edges: [edge],
    };

    expect(explodeEdges(diagram)).toEqual({
      id: diagram.id,
      nodes: diagram.nodes,
      edges: [{src: edge.src, dst: edge.dst}],
    });
  });
});
