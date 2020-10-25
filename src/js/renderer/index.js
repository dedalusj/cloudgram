import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

import iconMap from '../icons';

import {getNodesAndEdges} from './transform';
import {get, getOr} from '../utils';

cytoscape.use(dagre);

const TB = 'tb';
const LR = 'lr';
const directions = new Set([TB, LR]);

const getDirection = attributes => {
  const direction = get(['direction'])(attributes);
  return direction && directions.has(direction.toLowerCase()) ? direction.toLowerCase() : TB;
};

const styleFn = fn => e => fn(e.data());
const getBackgroundColor = getOr(['attributes', 'fill'], '#eee');
const getBorderStyle = getOr(['attributes', 'style'], 'dashed');
const getBorderWidth = getOr(['attributes', 'width'], 1);
const getOpacity = getOr(['attributes', 'opacity'], 1.0);
const getColor = getOr(['attributes', 'stroke'], '#ccc');
const getEdgeStyle = getOr(['attributes', 'style'], 'solid');
const getEdgeWidth = getOr(['attributes', 'width'], 2);
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
          shape: 'round-rectangle',
          label: 'data(label)',
        },
      },
      {
        selector: '.service',
        style: {
          height: 80,
          width: 80,
          'background-image': styleFn(imageForNode),
        },
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          width: styleFn(getEdgeWidth),
          'line-color': styleFn(getColor),
          'line-style': styleFn(getEdgeStyle),
          'target-arrow-shape': 'triangle',
          'source-endpoint': 'outside-to-node-or-label',
          'target-endpoint': 'outside-to-node-or-label',
        },
      },
      {
        selector: 'node:parent',
        style: {
          // 'background-image': null,
          'background-color': styleFn(getBackgroundColor),
          'border-color': styleFn(getColor),
          'background-opacity': styleFn(getOpacity),
          'border-style': styleFn(getBorderStyle),
          'border-width': styleFn(getBorderWidth),
          'text-valign': 'top',
          'text-halign': 'center',
        },
      },
    ],
  });
