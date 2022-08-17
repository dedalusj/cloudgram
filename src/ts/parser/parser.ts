import {CstParser} from 'chevrotain';

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
  directedArrowLabel,
  bidirectionalArrowLabel,
  deepArrowLabel,
  bidirectionalDeepArrowLabel,
  dotLabel,
  semicolonLabel,
  equalLabel,
} from './labels';

import {
  tokensList,
  diagramKeyword,
  groupKeyword,
  id,
  quotedId,
  lBrace,
  rBrace,
  lBracket,
  rBracket,
  provider,
  dot,
  semicolon,
  comma,
  equal,
  directedArrow,
  bidirectionalArrow,
  deepArrow,
  bidirectionalDeepArrow,
} from './lexer';

class DiagramParser extends CstParser {
  constructor() {
    super(tokensList, {
      recoveryEnabled: true,
    });
    this.performSelfAnalysis();
  }

  public diagram = this.RULE('diagram', () => {
    this.CONSUME(diagramKeyword);
    this.SUBRULE(this.identifier, {LABEL: idLabel});
    this.OPTION(() => {
      this.SUBRULE(this.attrList, {LABEL: attrListLabel});
    });
    this.SUBRULE(this.elements, {LABEL: elementsLabel});
  });

  public identifier = this.RULE('identifier', () => {
    this.OR([
      {ALT: () => this.CONSUME(id, {LABEL: normalIdentifierLabel})},
      {ALT: () => this.CONSUME(quotedId, {LABEL: quotedIdentifierLabel})},
    ]);
  });

  public elements = this.RULE('elements', () => {
    this.CONSUME(lBrace);
    this.MANY(() => {
      this.SUBRULE(this.element, {LABEL: elementLabel});
    });
    this.CONSUME(rBrace);
  });

  public element = this.RULE('element', () => {
    this.OR([
      {ALT: () => this.SUBRULE(this.node, {LABEL: nodeLabel})},
      {ALT: () => this.SUBRULE(this.edge, {LABEL: edgeLabel})},
      {ALT: () => this.SUBRULE(this.group, {LABEL: groupLabel})},
    ]);
  });

  public node = this.RULE('node', () => {
    this.CONSUME(provider, {LABEL: providerLabel});
    this.CONSUME(dot, {LABEL: dotLabel});
    this.CONSUME(id, {LABEL: serviceLabel});
    this.SUBRULE2(this.identifier, {LABEL: idLabel});
    this.OPTION(() => {
      this.SUBRULE(this.attrList, {LABEL: attrListLabel});
    });
    this.CONSUME(semicolon, {LABEL: semicolonLabel});
  });

  public edge = this.RULE('edge', () => {
    this.SUBRULE(this.identifier, {LABEL: idLabel});
    this.AT_LEAST_ONE(() => {
      this.SUBRULE(this.link, {LABEL: linkLabel});
      this.SUBRULE2(this.identifier, {LABEL: idLabel});
    });
    this.OPTION(() => {
      this.SUBRULE(this.attrList, {LABEL: attrListLabel});
    });
    this.CONSUME(semicolon);
  });

  public group = this.RULE('group', () => {
    this.CONSUME(groupKeyword);
    this.SUBRULE(this.identifier, {LABEL: idLabel});
    this.OPTION(() => {
      this.SUBRULE(this.attrList, {LABEL: attrListLabel});
    });
    this.SUBRULE(this.elements, {LABEL: elementsLabel});
  });

  public attrList = this.RULE('attrList', () => {
    this.CONSUME(lBracket);
    this.MANY_SEP({
      SEP: comma,
      DEF: () => this.SUBRULE(this.attribute, {LABEL: attrLabel}),
    });
    this.CONSUME(rBracket);
  });

  public attribute = this.RULE('attribute', () => {
    this.CONSUME(id, {LABEL: attrNameLabel});
    this.CONSUME(equal, {LABEL: equalLabel});
    this.SUBRULE(this.identifier, {LABEL: attrValueLabel});
  });

  public link = this.RULE('link', () => {
    this.OR([
      {ALT: () => this.CONSUME(directedArrow, {LABEL: directedArrowLabel})},
      {ALT: () => this.CONSUME(bidirectionalArrow, {LABEL: bidirectionalArrowLabel})},
      {ALT: () => this.CONSUME(deepArrow, {LABEL: deepArrowLabel})},
      {ALT: () => this.CONSUME(bidirectionalDeepArrow, {LABEL: bidirectionalDeepArrowLabel})},
    ]);
  });
}

export const parser = new DiagramParser();
