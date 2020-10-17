import {arrayDiff, pluck, uniqBy, renameProp, drop} from './utils';

import {normalLink} from './parser';

const pluckId = pluck('id');
const pluckSrc = pluck('src');
const pluckDst = pluck('dst');

const flattenNodes = ({nodes}, parent = undefined) =>
    nodes.map(n => [{...n, parent}, ...flattenNodes(n, n)]).flat();
const flattenEdges = ({edges, nodes}) =>
  [...edges, ...nodes.map(n => flattenEdges(n))].flat();
export const flatten = ({edges, nodes, ...rest}) => ({
  ...rest,
  edges: flattenEdges({edges, nodes}),
  nodes: flattenNodes({nodes}),
});

const renameSubNodesToChildren = renameProp('nodes', 'children');
const dropEdgesFromNode = drop('edges');
const replaceChildrenWithIds = ({children, ...rest}) => ({
  ...rest,
  children: children.map(pluckId),
});
const replaceParentWithIds = ({parent, ...rest}) => ({
  ...rest,
  parent: parent ? pluckId(parent) : parent,
});
export const transformNodes = ({nodes, ...rest}) => ({
  ...rest,
  nodes: nodes.map(dropEdgesFromNode)
      .map(renameSubNodesToChildren)
      .map(replaceChildrenWithIds)
      .map(replaceParentWithIds),
});

export const dedupNodes = ({nodes, ...rest}) => ({
  ...rest,
  nodes: uniqBy(nodes, 'id'),
});

export const addMissingNodes = ({edges, nodes, ...rest}) => {
  const missingNodeIds = new Set([
    ...arrayDiff(edges.map(pluckSrc), nodes.map(pluckId)),
    ...arrayDiff(edges.map(pluckDst), nodes.map(pluckId)),
  ]);
  const missingNodes = Array.from(missingNodeIds).map(id => ({
    id,
    provider: 'generic',
    service: 'unknown',
    nodes: [],
    edges: [],
  }));
  return {
    ...rest,
    edges,
    nodes: [...nodes, ...missingNodes],
  };
};

export const explodeEdges = ({edges, nodes, ...rest}) => {
  const nodesMap = nodes.reduce((acc, n) => ({...acc, [n['id']]: n}), {});
  return {
    ...rest,
    nodes,
    edges: edges
      .map(({src, dst, connection}) =>
        connection === normalLink ||
        !nodesMap[dst] ||
        !nodesMap[dst]['children'].length
          ? {src, dst}
          : nodesMap[dst]['children'].map(pluckId).map(id => ({src, dst: id})),
      )
      .flat(),
  };
};

export const transform = parsed =>
  explodeEdges(addMissingNodes(dedupNodes(transformNodes(flatten(parsed)))));
