import cytoscape from 'cytoscape';

export type Attributes = Record<string, string>;

export type Node = {
  type: 'node';
  id: string;
  provider: string;
  service: string;
  attributes: Attributes;
  parent?: string;
};

export type Edge = {
  type: 'edge';
  src: string;
  dst: string;
  attributes: Attributes;
} & Link;

export type Group = {
  type: 'group';
  id: string;
  elements: Element[];
  attributes: Attributes;
  parent?: string;
};

export type Link = {
  deepLink: boolean;
  bidirectionalLink: boolean;
};

export type Element = Node | Group | Edge;

export type Diagram = {
  id: string;
  elements: Element[];
  attributes: Attributes;
};

export type ParseError = {
  message: string;
  line: {
    start?: number;
    end?: number;
  };
  column: {
    start?: number;
    end?: number;
  };
};

export type ParseOutput = {
  parsed?: Diagram;
  errors: ParseError[];
};

export type CytoscapeNodeData = {
  id: string;
  label: string;
  parent: string | null;
  provider: string | null;
  service: string | null;
  attributes: Record<string, any>;
};

export type CytoscapeNode = {
  data: CytoscapeNodeData;
  classes: string;
  selected: boolean;
  selectable: boolean;
  locked: boolean;
  grabbable: boolean;
};

export type CytoscapeEdgeData = {
  source: string;
  target: string;
  id: string;
  label: string;
  attributes: Record<string, any>;
};

export type CytoscapeEdge = {
  data: CytoscapeEdgeData;
};

export type CytoscapeElements = {
  nodes: CytoscapeNode[];
  edges: CytoscapeEdge[];
};

export interface CytoscapeSvg extends cytoscape.Core {
  svg?: (options: any) => string;
}
