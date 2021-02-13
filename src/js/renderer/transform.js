import {arrayDiff, get, pluck, uniqBy, pipe, merge} from '../utils';

const pluckId = pluck('id');
const pluckSrc = pluck('src');
const pluckDst = pluck('dst');

const isGroupElement = el => el['type'] === 'group';
const isNodeElement = el => el['type'] === 'node';
const isLinkElement = el => el['type'] === 'link';
const hasLinkableElements = el => el['elements'] && el['elements'].filter(e => !isLinkElement(e)).length;

const getNodeLabel = get(['attributes', 'label']);
const getNodeClasses = el => (isNodeElement(el) ? ['service'] : []);

/**
 * Creates a cytoscape node from a parser node or group
 * @param {Node|Group} node
 * @typedef {{data: {parent: *, provider: (*|null), service: (*|null), attributes: *, id: *, label: *}, classes: ([string]|[]), selectable: boolean, grabbable: boolean, locked: boolean, selected: boolean}} CytoscapeNode
 * @returns {CytoscapeNode}
 */
const processNode = node => ({
  data: {
    id: node['id'],
    label: getNodeLabel(node) !== null ? getNodeLabel(node) : node['id'],
    parent: node['parent'],
    provider: node['provider'] || null,
    service: node['service'] || null,
    attributes: node['attributes'],
  },
  classes: getNodeClasses(node),
  selected: false,
  selectable: false,
  locked: false,
  grabbable: true,
});

/**
 * Creates a cytoscape edge from a parser edge
 * @param {Edge} edge
 * @typedef {{data: {attributes, source, id: string, target}}} CytoscapeEdge
 * @returns {CytoscapeEdge}
 */
const processEdge = ({src, dst, attributes}) => ({
  data: {
    source: src,
    target: dst,
    id: `${src}-${dst}`,
    attributes,
  },
});

// merges two sets of nodes and edges
const mergeNodesAndEdges = ({nodes: currentNodes, edges: currentEdges}, {nodes: newNodes, edges: newEdges}) => ({
  nodes: [...currentNodes, ...newNodes],
  edges: [...currentEdges, ...newEdges],
});

/**
 * Takes an element from the parser and divide it into either a node or an edge
 * In case the input element is a group, which contains other element, it will recursively
 * traverse the group children and divide them among nodes and edges
 * @param {Element} element
 * @returns {{nodes: [Node|Group], edges: [Edge]}}
 */
const separateElement = element => {
  switch (element['type']) {
    case 'node':
      return {nodes: [element], edges: []};
    case 'group':
      return element['elements'].map(e => separateElement(e)).reduce(mergeNodesAndEdges, {nodes: [element], edges: []});
    case 'edge':
      return {nodes: [], edges: [element]};
    default:
      throw new Error(`Unknown element ${element['type']}`);
  }
};

/**
 * Divides a list of parser elements into nodes and edges
 * @param {Array.<Element>} elements
 * @returns {{nodes: [Node|Group], edges: [Edge]}}
 */
const separateElements = elements =>
  elements.map(e => separateElement(e)).reduce(mergeNodesAndEdges, {nodes: [], edges: []});

/**
 * Take a list of nodes and edges and creates nodes for any edge referencing
 * a non existing node as a source or destination.
 *
 * This is a nicety so that while editing in the editor a typo in the name of
 * node in an edge definition will not cause an error but an empty and well
 * recognisable node will be automatically created
 *
 * @param nodes
 * @param edges
 * @returns {{nodes: [Node|Group], edges: [Edge]}}
 */
const addMissingNodes = ({nodes, edges}) => {
  const edgeEnds = [...edges.map(pluckSrc), ...edges.map(pluckDst)];
  const nodesIds = nodes.map(pluckId);
  return {
    nodes: [
      ...nodes,
      ...arrayDiff(edgeEnds, nodesIds).map(id => ({
        type: 'node',
        id,
        parent: null,
        provider: 'generic',
        service: 'generic',
        attributes: {},
      })),
    ],
    edges,
  };
};

/**
 * Remove all duplicate nodes and edges. A node is considered duplicate by its id
 * while an edge is considered duplicate if its source, destination, deepLink and bidirectionalLink
 * type are equal
 * @param {Array.<Node|Group>} nodes
 * @param {Array.<Edge>} edges
 * @returns {{nodes, edges}}
 */
const removeDuplicates = ({nodes, edges}) => ({
  nodes: uniqBy(nodes),
  edges: uniqBy(edges, ({src, dst, deepLink, bidirectionalLink}) => `${src}-${dst}-${deepLink}-${bidirectionalLink}`),
});

/**
 * It traverse the defined edges and for any deep edge, i.e. an edge with deepLink flag equal to true,
 * it substitute the edge with a list of edges pointing to the children of the destination node if any.
 * @param {Array.<Node|Group>} nodes
 * @param {Array.<Edge>} edges
 * @returns {{nodes, edges}}
 */
const explodeEdges = ({nodes, edges}) => {
  const nodesMap = nodes.reduce((acc, n) => ({...acc, [n['id']]: n}), {});
  return {
    nodes,
    edges: edges
      .map(({src, dst, deepLink, bidirectionalLink, attributes = {}}) => {
        attributes = merge(attributes, {bidirectional: bidirectionalLink});
        return !deepLink || !isGroupElement(nodesMap[dst]) || !hasLinkableElements(nodesMap[dst])
          ? {src, dst, attributes}
          : nodesMap[dst]['elements'].filter(el => !isLinkElement(el)).map(({id}) => ({src, dst: id, attributes}));
      })
      .flat(),
  };
};

const preprocessElements = pipe(separateElements, addMissingNodes, removeDuplicates, explodeEdges);

/**
 * Transform a list of elements received by the parser into nodes and edges
 * suitable for rendering by cytoscape
 * @param {Array.<Element>} elements
 * @returns
 */
export const getNodesAndEdges = elements => {
  const {nodes, edges} = preprocessElements(elements);
  return {
    nodes: nodes.map(processNode),
    edges: edges.map(processEdge),
  };
};
