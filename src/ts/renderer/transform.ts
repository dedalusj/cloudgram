import {arrayDiff} from '../utils';
import {Element, Node, Group, Edge, CytoscapeNode, CytoscapeEdge, CytoscapeElements} from '../types';

const hasLinkableElements = (el: Element): boolean =>
  el.type === 'group' && el.elements.filter(e => e.type !== 'edge').length > 0;

const getLabel = (el: Element): string | null => el.attributes['label'] ?? null;
const getNodeClasses = (el: Element): string | undefined => (el.type === 'node' ? 'service' : undefined);

/**
 * Creates a cytoscape node from a parser node or group
 */
const processNode = (node: Node | Group): CytoscapeNode => ({
  data: {
    id: node.id,
    label: getLabel(node) ?? node.id,
    parent: node.parent,
    provider: 'provider' in node ? node.provider : null,
    service: 'service' in node ? node.service : null,
    attributes: node.attributes,
  },
  classes: getNodeClasses(node),
  selected: false,
  selectable: false,
  locked: false,
  grabbable: true,
});

/**
 * Creates a cytoscape edge from a parser edge
 */
const processEdge = (edge: Edge): CytoscapeEdge => ({
  data: {
    source: edge.src,
    target: edge.dst,
    id: `${edge.src}-${edge.dst}`,
    label: getLabel(edge) ?? '',
    attributes: {...edge.attributes, bidirectional: edge.bidirectionalLink},
  },
});

// merges two sets of nodes and edges
const mergeNodesAndEdges = (
  {nodes: currentNodes, edges: currentEdges}: {nodes: (Node | Group)[]; edges: Edge[]},
  {nodes: newNodes, edges: newEdges}: {nodes: (Node | Group)[]; edges: Edge[]}
) => ({
  nodes: [...currentNodes, ...newNodes],
  edges: [...currentEdges, ...newEdges],
});

/**
 * Takes an element from the parser and divide it into either a node or an edge
 * In case the input element is a group, which contains other element, it will recursively
 * traverse the group children and divide them among nodes and edges
 */
const separateElement = (element: Element): {nodes: (Node | Group)[]; edges: Edge[]} => {
  switch (element.type) {
    case 'node':
      return {nodes: [element], edges: []};
    case 'group':
      return element.elements.map(e => separateElement(e)).reduce(mergeNodesAndEdges, {nodes: [element], edges: []});
    case 'edge':
      return {nodes: [], edges: [element]};
    default:
      throw new Error(`Unknown element`);
  }
};

/**
 * Divides a list of parsed elements into nodes and edges
 */
const separateElements = (elements: Element[]): {nodes: (Node | Group)[]; edges: Edge[]} =>
  elements.map(e => separateElement(e)).reduce(mergeNodesAndEdges, {nodes: [], edges: []});

/**
 * Take a list of nodes and edges and creates nodes for any edge referencing
 * a non-existing node as a source or destination.
 *
 * This is a nicety so that while editing in the editor a typo in the name of
 * node in an edge definition will not cause an error but an empty and well
 * recognisable node will be automatically created
 */
const addMissingNodes = ({
  nodes,
  edges,
}: {
  nodes: (Node | Group)[];
  edges: Edge[];
}): {nodes: (Node | Group)[]; edges: Edge[]} => {
  const edgeSources = edges.map(e => e.src);
  const edgeDestinations = edges.map(e => e.dst);
  const edgeEnds = [...edgeSources, ...edgeDestinations];
  const nodeIds = nodes.map(n => n.id);
  const missingNodes: Node[] = arrayDiff(edgeEnds, nodeIds).map(id => ({
    type: 'node',
    id,
    provider: 'generic',
    service: 'generic',
    attributes: {},
  }));

  return {
    nodes: [...nodes, ...missingNodes],
    edges,
  };
};

/**
 * Remove all duplicate nodes and edges. A node is considered duplicate by its id
 * while an edge is considered duplicate if its source, destination, deepLink and bidirectionalLink
 * type are equal
 */
const removeDuplicates = ({
  nodes,
  edges,
}: {
  nodes: (Node | Group)[];
  edges: Edge[];
}): {nodes: (Node | Group)[]; edges: Edge[]} => {
  const uniqueNodes = nodes.reduce((acc, node) => {
    if (acc.find(n => n.id === node.id)) return acc;
    return [...acc, node];
  }, [] as (Node | Group)[]);

  const uniqueEdges = edges.reduce((acc, edge) => {
    if (
      acc.find(
        e =>
          e.src === edge.src &&
          e.dst === edge.dst &&
          e.deepLink === edge.deepLink &&
          e.bidirectionalLink === edge.bidirectionalLink
      )
    )
      return acc;
    return [...acc, edge];
  }, [] as Edge[]);

  return {
    nodes: uniqueNodes,
    edges: uniqueEdges,
  };
};

/**
 * It traverses the defined edges and for any deep edge, i.e. an edge with deepLink flag equal to true,
 * it substitutes the edge with a list of edges pointing to the children of the destination node if any.
 */
const explodeEdges = ({nodes, edges}: {nodes: (Node | Group)[]; edges: Edge[]}) => {
  const nodesMap = nodes.reduce((acc, n) => ({...acc, [n.id]: n}), {});
  const explodedEdges = edges
    .map(edge => {
      if (!edge.deepLink) return edge;

      const dstNode = nodesMap[edge.dst];
      if (!dstNode || !hasLinkableElements(dstNode)) return edge;

      const nonEdgeSubElements = dstNode.elements.filter(e => e.type !== 'edge');
      const deepEdges: Edge[] = nonEdgeSubElements.map(e => ({
        src: edge.src,
        dst: e.id,
        attributes: edge.attributes,
        bidirectionalLink: edge.bidirectionalLink,
      }));
      return deepEdges;
    })
    .flat();

  return {
    nodes,
    edges: explodedEdges,
  };
};

const preprocessElements = (el: Element[]): {nodes: (Node | Group)[]; edges: Edge[]} =>
  explodeEdges(removeDuplicates(addMissingNodes(separateElements(el))));

/**
 * Transform a list of elements received by the parser into nodes and edges
 * suitable for rendering by cytoscape
 */
export const getNodesAndEdges = (elements: Element[]): CytoscapeElements => {
  const {nodes, edges} = preprocessElements(elements);
  return {
    nodes: nodes.map(processNode),
    edges: edges.map(processEdge),
  };
};
