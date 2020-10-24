import {arrayDiff, get, pluck, uniqBy} from '../utils';

const pluckId = pluck('id');
const pluckSrc = pluck('src');
const pluckDst = pluck('dst');

const getNodeLabel = get(['attributes', 'label']);
const processNode = node => ({
  data: {
    id: node['id'],
    label: getNodeLabel(node) || node['id'],
    parent: node['parent'],
    provider: node['provider'] || null,
    service: node['service'] || null,
  },
  selected: false,
  selectable: false,
  locked: false,
  grabbable: false,
});

const processEdge = ({src, dst}) => ({
  data: {
    source: src,
    target: dst,
    id: `${src}-${dst}`,
  },
});

const separateElement = element => {
  switch (element['type']) {
    case 'node':
      return {nodes: [element], edges: []};
    case 'group':
      return element['elements']
        .map(e => separateElement(e))
        .reduce(
          ({nodes: currentNodes, edges: currentEdges}, {nodes: newNodes, edges: newEdges}) => ({
            nodes: [...currentNodes, ...newNodes],
            edges: [...currentEdges, ...newEdges],
          }),
          {nodes: [element], edges: []}
        );
    case 'link':
      return {nodes: [], edges: [element]};
    default:
      throw new Error(`Unknown element ${element['type']}`);
  }
};

const separateElements = elements =>
  elements
    .map(e => separateElement(e))
    .reduce(
      ({nodes: currentNodes, edges: currentEdges}, {nodes: newNodes, edges: newEdges}) => ({
        nodes: [...currentNodes, ...newNodes],
        edges: [...currentEdges, ...newEdges],
      }),
      {nodes: [], edges: []}
    );

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
      .map(({src, dst, childrenPassThrough}) =>
        !childrenPassThrough || !nodesMap[dst] || !nodesMap[dst]['elements'].length
          ? {src, dst}
          : nodesMap[dst]['elements'].filter(el => el['type'] !== 'link').map(({id}) => ({src, dst: id}))
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
