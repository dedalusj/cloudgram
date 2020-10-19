import cytoscape from 'cytoscape';

import {render} from '../src/js/graph';

import {randomNode} from './utils';

jest.mock('cytoscape');

it('should configure cytoscape to render the diagram', () => {
  const nodes = [randomNode(), randomNode(), randomNode(), randomNode()];
  nodes[1]['parent'] = nodes[0].id;
  const edges = [
    {src: nodes[0].id, dst: nodes[1].id},
    {src: nodes[1].id, dst: nodes[2].id},
  ];
  const diagram = {id: 'd', nodes, edges};

  render(diagram);

  const expectedElements = {
    nodes: [
      {
        data: {...nodes[0], label: nodes[0].id},
        selected: false,
        selectable: false,
        locked: false,
        grabbable: false,
      },
      {
        data: {...nodes[1], label: nodes[1].id},
        selected: false,
        selectable: false,
        locked: false,
        grabbable: false,
      },
      {
        data: {...nodes[2], label: nodes[2].id},
        selected: false,
        selectable: false,
        locked: false,
        grabbable: false,
      },
      {
        data: {...nodes[3], label: nodes[3].id},
        selected: false,
        selectable: false,
        locked: false,
        grabbable: false,
      },
    ],
    edges: [
      {
        data: {
          source: edges[0].src,
          target: edges[0].dst,
          id: expect.any(String),
        },
      },
      {
        data: {
          source: edges[1].src,
          target: edges[1].dst,
          id: expect.any(String),
        },
      },
    ],
  };

  expect(cytoscape).toHaveBeenCalledWith({
    boxSelectionEnabled: expect.any(Boolean),
    container: null, // null for testing since the DOM is not present
    elements: expectedElements,
    layout: expect.any(Object),
    style: expect.any(Object),
  });
});
