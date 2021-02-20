export const inputNode = (id, service, {provider = 'aws', attributes = {}, parent = null}) => ({
  type: 'node',
  id,
  service,
  provider,
  attributes,
  parent,
});
export const inputGroup = (id, elements, {attributes = {}, parent = null}) => ({
  type: 'group',
  id,
  attributes,
  elements: elements.map(({type, ...rest}) => (type === 'link' ? {type, ...rest} : {type, ...rest, parent: id})),
  parent,
});
export const inputEdge = (src, dst, deepLink = false, bidirectionalLink = false, attributes = {}) => ({
  type: 'edge',
  src,
  dst,
  deepLink,
  bidirectionalLink,
  attributes,
});
export const expectedNode = ({
  id,
  label = id,
  provider = 'aws',
  service,
  attributes = {},
  parent = null,
  classes = ['service'],
}) => ({
  data: {id, label, provider, service, attributes, parent},
  selected: false,
  selectable: false,
  locked: false,
  grabbable: true,
  classes,
});
export const expectedEdge = ({source, target, id, attributes = {bidirectional: false}, label = null}) => ({
  data: {source, target, id, attributes, label},
});
