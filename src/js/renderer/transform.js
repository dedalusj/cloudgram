import {arrayDiff, get, pluck, uniqBy} from '../utils';

const pluckId = pluck('id');
const pluckSrc = pluck('src');
const pluckDst = pluck('dst');

const isGroupElement = el => el['type'] === 'group';
const isNodeElement = el => el['type'] === 'node';
const isLinkElement = el => el['type'] === 'link';
const hasLinkableElements = el => el['elements'] && el['elements'].filter(e => !isLinkElement(e)).length;

const getNodeLabel = get(['attributes', 'label']);
const getNodeClasses = el => (isNodeElement(el) ? ['service'] : []);

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
  grabbable: false,
});

const processEdge = ({src, dst, attributes}) => ({
  data: {
    source: src,
    target: dst,
    id: `${src}-${dst}`,
    attributes,
  },
});

const mergeNodesAndEdges = ({nodes: currentNodes, edges: currentEdges}, {nodes: newNodes, edges: newEdges}) => ({
  nodes: [...currentNodes, ...newNodes],
  edges: [...currentEdges, ...newEdges],
});

const separateElement = element => {
  switch (element['type']) {
    case 'node':
      return {nodes: [element], edges: []};
    case 'group':
      return element['elements'].map(e => separateElement(e)).reduce(mergeNodesAndEdges, {nodes: [element], edges: []});
    case 'link':
      return {nodes: [], edges: [element]};
    default:
      throw new Error(`Unknown element ${element['type']}`);
  }
};

const separateElements = elements =>
  elements.map(e => separateElement(e)).reduce(mergeNodesAndEdges, {nodes: [], edges: []});

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

const removeDuplicates = ({nodes, edges}) => ({
  nodes: uniqBy(nodes),
  edges: uniqBy(edges, ({src, dst, childrenPassThrough}) => `${src}-${dst}-${childrenPassThrough}`),
});

const explodeEdges = ({nodes, edges}) => {
  const nodesMap = nodes.reduce((acc, n) => ({...acc, [n['id']]: n}), {});
  return {
    nodes,
    edges: edges
      .map(({src, dst, childrenPassThrough, attributes = {}}) =>
        !childrenPassThrough || !isGroupElement(nodesMap[dst]) || !hasLinkableElements(nodesMap[dst])
          ? {src, dst, attributes}
          : nodesMap[dst]['elements'].filter(el => !isLinkElement(el)).map(({id}) => ({src, dst: id, attributes}))
      )
      .flat(),
  };
};

export const getNodesAndEdges = elements => {
  const {nodes, edges} = explodeEdges(removeDuplicates(addMissingNodes(separateElements(elements))));
  return {
    nodes: nodes.map(processNode),
    edges: edges.map(processEdge),
  };
};
