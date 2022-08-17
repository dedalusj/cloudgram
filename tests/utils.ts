import {Node, Group, Edge, Element, Attributes, CytoscapeNode, CytoscapeEdge} from '../src/ts/types';

export const inputNode = (
  id: string,
  service: string,
  {provider = 'aws', attributes = {}, parent}: {provider?: string; attributes?: Attributes; parent?: string}
): Node => ({
  type: 'node',
  id,
  service,
  provider,
  attributes,
  parent,
});
export const inputGroup = (
  id: string,
  elements: Element[],
  {attributes = {}, parent}: {attributes?: Attributes; parent?: string}
): Group => ({
  type: 'group',
  id,
  attributes,
  elements: elements.map(el => (el.type === 'edge' ? el : {...el, parent: id})),
  parent,
});
export const inputEdge = (
  src: string,
  dst: string,
  deepLink = false,
  bidirectionalLink = false,
  attributes: Attributes = {}
): Edge => ({
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
  parent,
  classes = 'service',
}: {
  id: string;
  label?: string;
  provider?: string;
  service: string;
  attributes?: Record<string, any>;
  parent?: string;
  classes?: string;
}): CytoscapeNode => ({
  data: {id, label, provider, service, attributes, parent},
  selected: false,
  selectable: false,
  locked: false,
  grabbable: true,
  classes: classes === '' ? undefined : classes,
});
export const expectedEdge = ({
  source,
  target,
  id,
  attributes = {bidirectional: false},
  label = '',
}: {
  source: string;
  target: string;
  id: string;
  attributes?: Record<string, any>;
  label?: string;
}): CytoscapeEdge => ({
  data: {source, target, id, attributes, label},
});
