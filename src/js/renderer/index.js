import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

import iconMap from '../icons';

import {getNodesAndEdges} from './transform';
import {get} from '../utils';

cytoscape.use(dagre);

const TB = 'tb';
const LR = 'lr';
const directions = new Set([TB, LR]);

const getDirection = attributes => {
  const direction = get(['direction'])(attributes);
  return direction && directions.has(direction.toLowerCase()) ? direction.toLowerCase() : TB;
};
const imageForNode = ({provider, service}) => iconMap[provider][service];

export const render = ({elements, attributes}) =>
  cytoscape({
    container: document.getElementById('cy'),
    boxSelectionEnabled: false,
    elements: getNodesAndEdges(elements),
    layout: {
      name: 'dagre',
      rankDir: getDirection(attributes),
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
