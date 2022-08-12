/*
It receives the output from the parser and render it thanks to cytoscape.

It defines a single entrypoint, the `render` function.
*/

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

import iconMap from '../icons';
import {getNodesAndEdges} from './transform.js';
import {get, getOrDefault, pipe, inSetOrDefault, toLowerCase} from '../utils';

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

export const getBackgroundColor = pipe(getData, getOrDefault(['attributes', 'fill'], '#eee'));
export const getBorderStyle = pipe(getData, getOrDefault(['attributes', 'style'], 'dashed'));
export const getBorderWidth = pipe(getData, getOrDefault(['attributes', 'width'], 1));
export const getOpacity = pipe(getData, getOrDefault(['attributes', 'opacity'], 1.0));
export const getColor = pipe(getData, getOrDefault(['attributes', 'stroke'], '#ccc'));
export const getEdgeStyle = pipe(getData, getOrDefault(['attributes', 'style'], 'solid'));
export const getEdgeWidth = pipe(getData, getOrDefault(['attributes', 'width'], 2));

const arrowStyle = arrow => (arrow ? 'triangle' : 'none');
export const getSourceArrowStyle = pipe(getData, getOrDefault(['attributes', 'bidirectional'], false), arrowStyle);

const getIcon = ({provider, service}) => iconMap[provider][service];
export const getIconForNode = pipe(getData, getIcon);

export const getDirection = pipe(get(['direction']), toLowerCase, inSetOrDefault(directions, TB));

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
      return 'right';
    case N:
    case S:
      return 'center';
    case NW:
    case W:
    case SW:
      return 'left';
  }
};
const getLabelPosition = pipe(
  getData,
  getOrDefault(['attributes', 'labelPosition'], N),
  toLowerCase,
  inSetOrDefault(labelPositions, N)
);
export const getHPosForNode = pipe(getLabelPosition, getHorizontalPosition);
export const getVPosForNode = pipe(getLabelPosition, getVerticalPosition);

/**
 * Creates and returns a cytoscape object for rendering the graph
 * @param {Array.<Element>} elements
 * @param {Object.<string,string>} attributes
 * @returns a cytoscape object rendering the graph
 */
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
          'control-point-step-size': 40,
          width: getEdgeWidth,
          'line-color': getColor,
          'line-style': getEdgeStyle,
          'source-arrow-shape': getSourceArrowStyle,
          'target-arrow-shape': 'triangle',
          'source-endpoint': 'outside-to-node-or-label',
          'target-endpoint': 'outside-to-node-or-label',
        },
      },
      {
        selector: 'edge[label]',
        style: {
          label: 'data(label)',
          'text-rotation': 'autorotate',
          'text-margin-x': 0,
          'text-margin-y': -15,
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
