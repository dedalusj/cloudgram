/*
It receives the output from the parser and render it thanks to cytoscape.

It defines a single entrypoint, the `render` function.
*/

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

import iconMap from '../icons';
import {getNodesAndEdges} from './transform';
import {fromSetOrDefault} from '../utils';
import {Attributes, CytoscapeEdgeData, CytoscapeNodeData, CytoscapeSvg, Diagram} from '../types';

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

const getData = (e: any): CytoscapeNodeData | CytoscapeEdgeData => e.data();

export const getBackgroundColor = (e: any): string => getData(e).attributes.fill ?? '#eee';
export const getBorderStyle = (e: any): cytoscape.Css.LineStyle => getData(e).attributes.style ?? 'dashed';
export const getBorderWidth = (e: any): number => getData(e).attributes.width ?? 1;
export const getOpacity = (e: any): number => getData(e).attributes.opacity ?? 1.0;
export const getColor = (e: any): string => getData(e).attributes.stroke ?? '#ccc';
export const getEdgeStyle = (e: any): cytoscape.Css.LineStyle => getData(e).attributes.style ?? 'solid';
export const getEdgeWidth = (e: any): number => getData(e).attributes.width ?? 2;

const arrowStyle = (arrow: boolean): cytoscape.Css.ArrowShape => (arrow ? 'triangle' : 'none');
export const getSourceArrowStyle = (e: any): cytoscape.Css.ArrowShape =>
  arrowStyle(getData(e).attributes.bidirectional ?? false);

const getIcon = (node: CytoscapeNodeData): string | undefined =>
  node.provider && node.service ? iconMap[node.provider][node.service] : undefined;
export const getIconForNode = (e: any): string | undefined => getIcon(getData(e) as CytoscapeNodeData);

type VerticalPosition = 'top' | 'center' | 'bottom';
const getVerticalPosition = (p: string): VerticalPosition => {
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

type HorizontalPosition = 'right' | 'center' | 'left';
const getHorizontalPosition = (p: string): HorizontalPosition => {
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

const getLabelPosition = (e: any): string =>
  fromSetOrDefault(labelPositions, (getData(e).attributes.labelPosition ?? N).toLowerCase(), N);
export const getHPosForNode = (e: any): HorizontalPosition => getHorizontalPosition(getLabelPosition(e));
export const getVPosForNode = (e: any): VerticalPosition => getVerticalPosition(getLabelPosition(e));

export const getDirection = (attributes: Attributes): string =>
  fromSetOrDefault(directions, attributes['direction']?.toLowerCase(), TB);

/**
 * Creates and returns a cytoscape object for rendering the graph
 */
export const render = ({elements, attributes}: Diagram): CytoscapeSvg =>
  cytoscape({
    container: document.getElementById('cy'),
    boxSelectionEnabled: false,
    elements: getNodesAndEdges(elements),
    layout: {
      name: 'dagre',
      // @ts-ignore
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
