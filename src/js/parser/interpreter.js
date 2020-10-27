import {parser} from './parser.js';

import {
  idLabel,
  elementsLabel,
  elementLabel,
  normalIdentifierLabel,
  quotedIdentifierLabel,
  linkLabel,
  serviceLabel,
  providerLabel,
  groupLabel,
  edgeLabel,
  nodeLabel,
  attrLabel,
  attrNameLabel,
  attrValueLabel,
  attrListLabel,
  deepArrowLabel,
} from './labels.js';

const BaseCstVisitor = parser.getBaseCstVisitorConstructor();

class DiagramInterpreter extends BaseCstVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  diagram(ctx) {
    const elements = this.visit(ctx[elementsLabel]);
    const id = this.visit(ctx[idLabel]);
    const attributes = this.visit(ctx[attrListLabel]) || {};
    return {
      id,
      elements,
      attributes,
    };
  }

  elements(ctx) {
    return ctx[elementLabel] ? ctx[elementLabel].map(n => this.visit(n)).flat() : [];
  }

  element(ctx) {
    if (ctx[nodeLabel]) {
      return this.visit(ctx[nodeLabel]);
    } else if (ctx[edgeLabel]) {
      return this.visit(ctx[edgeLabel]);
    } else if (ctx[groupLabel]) {
      return this.visit(ctx[groupLabel]);
    }
  }

  edge(ctx) {
    const ids = ctx[idLabel].map(i => this.visit(i));
    const links = ctx[linkLabel].map(l => this.visit(l));
    const attributes = this.visit(ctx[attrListLabel]) || {};
    const edges = [];
    for (let i = 0; i < ids.length - 1; i++) {
      edges.push({
        type: 'link',
        src: ids[i],
        dst: ids[i + 1],
        ...links[i],
        attributes,
      });
    }
    return edges;
  }

  node(ctx) {
    const provider = ctx[providerLabel][0].image;
    const service = ctx[serviceLabel][0].image;
    const id = this.visit(ctx[idLabel]);
    const attributes = this.visit(ctx[attrListLabel]) || {};
    return {
      type: 'node',
      id,
      provider,
      service,
      attributes,
      parent: null,
    };
  }

  group(ctx) {
    const id = this.visit(ctx[idLabel][0]);
    const attributes = this.visit(ctx[attrListLabel]) || {};
    const elements = this.visit(ctx[elementsLabel]).map(e => ({
      ...e,
      parent: id,
    }));
    return {
      type: 'group',
      id,
      elements,
      attributes,
      parent: null,
    };
  }

  identifier(ctx) {
    return ctx[quotedIdentifierLabel]
      ? ctx[quotedIdentifierLabel][0].image.slice(1).slice(0, -1)
      : ctx[normalIdentifierLabel][0].image;
  }

  link(ctx) {
    return {childrenPassThrough: ctx.hasOwnProperty(deepArrowLabel)};
  }

  attribute(ctx) {
    const name = ctx[attrNameLabel][0].image;
    const value = this.visit(ctx[attrValueLabel][0]);
    return {[name]: value};
  }

  attrList(ctx) {
    return ctx[attrLabel] ? ctx[attrLabel].map(a => this.visit(a)).reduce((acc, a) => ({...acc, ...a}), {}) : {};
  }
}

export const interpreter = new DiagramInterpreter();
