import {transform, missingNode} from '../src/js/transform';
import {normalLink, deepLink} from '../src/js/parser';

import {randomNode, randomString} from './utils';

describe('transform', () => {
  const createNodes = () => {
    const subSubNode1 = {...randomNode(), nodes: [], edges: []};
    const subSubNode2 = {...randomNode(), nodes: [], edges: []};
    const subNode1 = {
      ...randomNode(),
      nodes: [subSubNode1, subSubNode2],
      edges: [],
    };
    const subNode2 = {...randomNode(), nodes: [], edges: []};
    const node1 = {...randomNode(), nodes: [subNode1], edges: []};
    const node2 = {...randomNode(), nodes: [subNode2], edges: []};

    return {subSubNode1, subSubNode2, subNode1, subNode2, node1, node2};
  };

  it('transform and sanitise a parsed diagram', () => {
    const {
      subSubNode1,
      subSubNode2,
      subNode1,
      subNode2,
      node1,
      node2,
    } = createNodes();

    const subSub1ToSubSub2 = {
      src: subSubNode1.id,
      dst: subSubNode2.id,
      connection: normalLink,
    };
    const sub1ToSub2 = {
      src: subNode1.id,
      dst: subNode2.id,
      connection: normalLink,
    };
    const sub2ToSubSub1 = {
      src: subNode2.id,
      dst: subSubNode1.id,
      connection: normalLink,
    };
    const node1ToNode2 = {src: node1.id, dst: node2.id, connection: normalLink};
    subNode1.edges = [subSub1ToSubSub2];
    node1.edges = [sub1ToSub2];

    const diagramNodes = [node1, node2];
    const diagramEdges = [sub2ToSubSub1, node1ToNode2];

    const input = {
      id: randomString(),
      nodes: diagramNodes,
      edges: diagramEdges,
    };

    const expected = {
      id: input.id,
      nodes: [
        {
          id: node1.id,
          provider: node1.provider,
          service: node1.service,
          parent: undefined,
          children: [subNode1.id],
        },
        {
          id: subNode1.id,
          provider: subNode1.provider,
          service: subNode1.service,
          parent: node1.id,
          children: [subSubNode1.id, subSubNode2.id],
        },
        {
          id: subSubNode1.id,
          provider: subSubNode1.provider,
          service: subSubNode1.service,
          parent: subNode1.id,
          children: [],
        },
        {
          id: subSubNode2.id,
          provider: subSubNode2.provider,
          service: subSubNode2.service,
          parent: subNode1.id,
          children: [],
        },
        {
          id: node2.id,
          provider: node2.provider,
          service: node2.service,
          parent: undefined,
          children: [subNode2.id],
        },
        {
          id: subNode2.id,
          provider: subNode2.provider,
          service: subNode2.service,
          parent: node2.id,
          children: [],
        },
      ],
      edges: [
        {src: sub2ToSubSub1.src, dst: sub2ToSubSub1.dst},
        {src: node1ToNode2.src, dst: node1ToNode2.dst},
        {src: sub1ToSub2.src, dst: sub1ToSub2.dst},
        {src: subSub1ToSubSub2.src, dst: subSub1ToSubSub2.dst},
      ],
    };

    const transformed = transform(input);
    expect(transformed).toEqual(expected);
  });

  it('explodes deep link edges to point to children', () => {
    const {
      subSubNode1,
      subSubNode2,
      subNode1,
      subNode2,
      node1,
      node2,
    } = createNodes();

    // this will not be expanded
    const sub1ToSub2 = {
      src: subNode1.id,
      dst: subNode2.id,
      connection: normalLink,
    };

    // this will be expanded to subSub nodes
    const sub2ToSub1 = {
      src: subNode2.id,
      dst: subNode1.id,
      connection: deepLink,
    };

    // this will be expanded to the sub nodes but not subSub nodes
    const node2ToNode1 = {src: node2.id, dst: node1.id, connection: deepLink};

    const diagramNodes = [node1, node2];
    const diagramEdges = [sub1ToSub2, sub2ToSub1, node2ToNode1];

    const input = {
      id: randomString(),
      nodes: diagramNodes,
      edges: diagramEdges,
    };

    const expected = {
      id: input.id,
      nodes: [
        {
          id: node1.id,
          provider: node1.provider,
          service: node1.service,
          parent: undefined,
          children: [subNode1.id],
        },
        {
          id: subNode1.id,
          provider: subNode1.provider,
          service: subNode1.service,
          parent: node1.id,
          children: [subSubNode1.id, subSubNode2.id],
        },
        {
          id: subSubNode1.id,
          provider: subSubNode1.provider,
          service: subSubNode1.service,
          parent: subNode1.id,
          children: [],
        },
        {
          id: subSubNode2.id,
          provider: subSubNode2.provider,
          service: subSubNode2.service,
          parent: subNode1.id,
          children: [],
        },
        {
          id: node2.id,
          provider: node2.provider,
          service: node2.service,
          parent: undefined,
          children: [subNode2.id],
        },
        {
          id: subNode2.id,
          provider: subNode2.provider,
          service: subNode2.service,
          parent: node2.id,
          children: [],
        },
      ],
      edges: [
        {src: sub1ToSub2.src, dst: sub1ToSub2.dst}, // left untouched
        {src: subNode2.id, dst: subSubNode1.id}, // expanded
        {src: subNode2.id, dst: subSubNode2.id}, // expanded
        {src: node2.id, dst: subNode1.id}, // expanded
      ],
    };

    const transformed = transform(input);
    expect(transformed).toEqual(expected);
  });

  it('leaves deep links to nodes without children untouched', () => {
    const {
      subSubNode1,
      subSubNode2,
      subNode1,
      subNode2,
      node1,
      node2,
    } = createNodes();

    const sub1ToSub2 = {
      src: subNode1.id,
      dst: subNode2.id,
      connection: deepLink,
    };

    const diagramNodes = [node1, node2];
    const diagramEdges = [sub1ToSub2];

    const input = {
      id: randomString(),
      nodes: diagramNodes,
      edges: diagramEdges,
    };

    const expected = {
      id: input.id,
      nodes: [
        {
          id: node1.id,
          provider: node1.provider,
          service: node1.service,
          parent: undefined,
          children: [subNode1.id],
        },
        {
          id: subNode1.id,
          provider: subNode1.provider,
          service: subNode1.service,
          parent: node1.id,
          children: [subSubNode1.id, subSubNode2.id],
        },
        {
          id: subSubNode1.id,
          provider: subSubNode1.provider,
          service: subSubNode1.service,
          parent: subNode1.id,
          children: [],
        },
        {
          id: subSubNode2.id,
          provider: subSubNode2.provider,
          service: subSubNode2.service,
          parent: subNode1.id,
          children: [],
        },
        {
          id: node2.id,
          provider: node2.provider,
          service: node2.service,
          parent: undefined,
          children: [subNode2.id],
        },
        {
          id: subNode2.id,
          provider: subNode2.provider,
          service: subNode2.service,
          parent: node2.id,
          children: [],
        },
      ],
      edges: [
        {src: sub1ToSub2.src, dst: sub1ToSub2.dst}, // left untouched
      ],
    };

    const transformed = transform(input);
    expect(transformed).toEqual(expected);
  });

  it('removes duplicate nodes and edges', () => {
    const {
      subSubNode1,
      subSubNode2,
      subNode1,
      subNode2,
      node1,
      node2,
    } = createNodes();

    const subSub1ToSubSub2 = {
      src: subSubNode1.id,
      dst: subSubNode2.id,
      connection: normalLink,
    };
    const sub1ToSub2 = {
      src: subNode1.id,
      dst: subNode2.id,
      connection: normalLink,
    };
    const sub2ToSubSub1 = {
      src: subNode2.id,
      dst: subSubNode1.id,
      connection: normalLink,
    };
    const node1ToNode2 = {src: node1.id, dst: node2.id, connection: normalLink};
    subNode1.edges = [subSub1ToSubSub2];
    node1.edges = [sub1ToSub2];

    const diagramNodes = [node1, node2, node1]; // duplicate node1 and it's children should be removed
    const diagramEdges = [sub2ToSubSub1, node1ToNode2];

    const input = {
      id: randomString(),
      nodes: diagramNodes,
      edges: diagramEdges,
    };

    const expected = {
      id: input.id,
      nodes: [
        {
          id: node1.id,
          provider: node1.provider,
          service: node1.service,
          parent: undefined,
          children: [subNode1.id],
        },
        {
          id: subNode1.id,
          provider: subNode1.provider,
          service: subNode1.service,
          parent: node1.id,
          children: [subSubNode1.id, subSubNode2.id],
        },
        {
          id: subSubNode1.id,
          provider: subSubNode1.provider,
          service: subSubNode1.service,
          parent: subNode1.id,
          children: [],
        },
        {
          id: subSubNode2.id,
          provider: subSubNode2.provider,
          service: subSubNode2.service,
          parent: subNode1.id,
          children: [],
        },
        {
          id: node2.id,
          provider: node2.provider,
          service: node2.service,
          parent: undefined,
          children: [subNode2.id],
        },
        {
          id: subNode2.id,
          provider: subNode2.provider,
          service: subNode2.service,
          parent: node2.id,
          children: [],
        },
      ],
      edges: [
        {src: sub2ToSubSub1.src, dst: sub2ToSubSub1.dst},
        {src: node1ToNode2.src, dst: node1ToNode2.dst},
        {src: sub1ToSub2.src, dst: sub1ToSub2.dst},
        {src: subSub1ToSubSub2.src, dst: subSub1ToSubSub2.dst},
      ],
    };

    const transformed = transform(input);
    expect(transformed).toEqual(expected);
  });

  it('adds missing nodes for unknown edges', () => {
    const {
      subSubNode1,
      subSubNode2,
      subNode1,
      subNode2,
      node1,
      node2,
    } = createNodes();

    const node1ToUnknown = {
      src: node1.id,
      dst: randomString(),
      connection: normalLink,
    };
    const unknownToNode2 = {
      src: randomString(),
      dst: node2.id,
      connection: normalLink,
    };
    const unknownToUnknown = {
      src: randomString(),
      dst: randomString(),
      connection: normalLink,
    };
    const node2ToUnknownDup = {
      src: node2.id,
      dst: node1ToUnknown.dst,
      connection: normalLink,
    };

    const diagramNodes = [node1, node2];
    const diagramEdges = [
      node1ToUnknown,
      unknownToNode2,
      unknownToUnknown,
      node2ToUnknownDup,
    ];

    const input = {
      id: randomString(),
      nodes: diagramNodes,
      edges: diagramEdges,
    };

    const expected = {
      id: input.id,
      nodes: [
        {
          id: node1.id,
          provider: node1.provider,
          service: node1.service,
          parent: undefined,
          children: [subNode1.id],
        },
        {
          id: subNode1.id,
          provider: subNode1.provider,
          service: subNode1.service,
          parent: node1.id,
          children: [subSubNode1.id, subSubNode2.id],
        },
        {
          id: subSubNode1.id,
          provider: subSubNode1.provider,
          service: subSubNode1.service,
          parent: subNode1.id,
          children: [],
        },
        {
          id: subSubNode2.id,
          provider: subSubNode2.provider,
          service: subSubNode2.service,
          parent: subNode1.id,
          children: [],
        },
        {
          id: node2.id,
          provider: node2.provider,
          service: node2.service,
          parent: undefined,
          children: [subNode2.id],
        },
        {
          id: subNode2.id,
          provider: subNode2.provider,
          service: subNode2.service,
          parent: node2.id,
          children: [],
        },
        {
          id: unknownToNode2.src,
          provider: missingNode.provider,
          service: missingNode.service,
          parent: undefined,
          children: [],
        },
        {
          id: unknownToUnknown.src,
          provider: missingNode.provider,
          service: missingNode.service,
          parent: undefined,
          children: [],
        },
        {
          id: node1ToUnknown.dst,
          provider: missingNode.provider,
          service: missingNode.service,
          parent: undefined,
          children: [],
        },
        {
          id: unknownToUnknown.dst,
          provider: missingNode.provider,
          service: missingNode.service,
          parent: undefined,
          children: [],
        },
      ],
      edges: [
        {src: node1ToUnknown.src, dst: node1ToUnknown.dst},
        {src: unknownToNode2.src, dst: unknownToNode2.dst},
        {src: unknownToUnknown.src, dst: unknownToUnknown.dst},
        {src: node2ToUnknownDup.src, dst: node2ToUnknownDup.dst},
      ],
    };

    const transformed = transform(input);
    expect(transformed).toEqual(expected);
  });
});
