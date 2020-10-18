import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

import iconMap from './icons';

cytoscape.use(dagre);

const createNodes = ({nodes}) =>
  nodes.map(node => ({
    data: {
      id: node['id'],
      label: node['id'],
      parent: node['parent'],
      provider: node['provider'],
      service: node['service'],
    },
    selected: false,
    selectable: false,
    locked: false,
    grabbable: false,
  }));

const createEdges = ({edges}) =>
  edges.map(e => ({
    data: {
      id: `${e['src']}-${e['dst']}`,
      source: e['src'],
      target: e['dst'],
    },
  }));

const imageForNode = ({provider, service}) => iconMap[provider][service];

const elementsConfig = diagram => ({
  nodes: createNodes(diagram),
  edges: createEdges(diagram),
});

export const render = diagram =>
  cytoscape({
    container: document.getElementById('cy'),
    boxSelectionEnabled: false,
    elements: elementsConfig(diagram),
    layout: {
      name: 'dagre',
      rankDir: 'TB',
      spacingFactor: 2,
    },
    style: [
      {
        selector: 'node',
        style: {
          height: 80,
          width: 80,
          shape: 'round-rectangle',
          label: 'data(label)',
          'background-image': e => imageForNode(e.data()),
        },
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          width: 2,
          'target-arrow-shape': 'triangle',
          'source-endpoint': 'outside-to-node-or-label',
          'target-endpoint': 'outside-to-node-or-label',
        },
      },
      {
        selector: ':parent',
        style: {
          'text-valign': 'top',
          'text-halign': 'center',
        },
      },
    ],
  });
