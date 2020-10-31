import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

import iconMap from '../icons';

import {getNodesAndEdges} from './transform.js';
import {get, getOr, pipe, inSetOr, toLowerCase} from '../utils';

cytoscape.use(dagre);

const TB = 'tb';
const LR = 'lr';
const directions = new Set([TB, LR]);

const N = 'n';
const S = 's';
const E = 'e';
const W = 'w';
const NE = `${N}${E}`;
const NW = `${N}${W}`;
const SE = `${S}${E}`;
const SW = `${S}${W}`;
const labelPositions = new Set([N, S, E, W, NE, NW, SE, SW]);

const getData = e => e.data();

export const getBackgroundColor = pipe(getData, getOr(['attributes', 'fill'], '#eee'));
export const getBorderStyle = pipe(getData, getOr(['attributes', 'style'], 'dashed'));
export const getBorderWidth = pipe(getData, getOr(['attributes', 'width'], 1));
export const getOpacity = pipe(getData, getOr(['attributes', 'opacity'], 1.0));
export const getColor = pipe(getData, getOr(['attributes', 'stroke'], '#ccc'));
export const getEdgeStyle = pipe(getData, getOr(['attributes', 'style'], 'solid'));
export const getEdgeWidth = pipe(getData, getOr(['attributes', 'width'], 2));

const getIcon = ({provider, service}) => iconMap[provider][service];
export const getIconForNode = pipe(getData, getIcon);

export const getDirection = pipe(get(['direction']), toLowerCase, inSetOr(directions, TB));

const getVerticalPosition = p => {
  switch (p) {
    case N:
    case NE:
    case NW:
      return 'top';
    case E:
    case W:
      return 'center';
    case S:
    case SE:
    case SW:
      return 'bottom';
  }
};
const getHorizontalPosition = p => {
  switch (p) {
    case NE:
    case E:
    case SE:
      return 'left';
    case N:
    case S:
      return 'center';
    case NW:
    case W:
    case SW:
      return 'right';
  }
};
const getLabelPosition = pipe(
  getData,
  getOr(['attributes', 'labelPosition'], N),
  toLowerCase,
  inSetOr(labelPositions, N)
);
export const getHPosForNode = pipe(getLabelPosition, getHorizontalPosition);
export const getVPosForNode = pipe(getLabelPosition, getVerticalPosition);

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
          'text-valign': getVPosForNode,
          'text-halign': getHPosForNode,
        },
      },
      {
        selector: '.service',
        style: {
          height: 80,
          width: 80,
          'background-image': getIconForNode,
          'background-opacity': 0.0,
        },
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          width: getEdgeWidth,
          'line-color': getColor,
          'line-style': getEdgeStyle,
          'target-arrow-shape': 'triangle',
          'source-endpoint': 'outside-to-node-or-label',
          'target-endpoint': 'outside-to-node-or-label',
        },
      },
      {
        selector: 'node:parent',
        style: {
          'background-color': getBackgroundColor,
          'border-color': getColor,
          'background-opacity': getOpacity,
          'border-style': getBorderStyle,
          'border-width': getBorderWidth,
          'text-valign': getVPosForNode,
          'text-halign': getHPosForNode,
        },
      },
    ],
  });
