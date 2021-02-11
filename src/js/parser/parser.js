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
} from './labels.js';

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
} from './lexer.js';

class DiagramParser extends CstParser {
  constructor() {
    super(tokensList, {
      recoveryEnabled: true,
    });

    const $ = this;

    $.RULE('diagram', () => {
      $.CONSUME(diagramKeyword);
      $.SUBRULE($.identifier, {LABEL: idLabel});
      $.OPTION(() => {
        $.SUBRULE($.attrList, {LABEL: attrListLabel});
      });
      $.SUBRULE($.elements, {LABEL: elementsLabel});
    });

    $.RULE('identifier', () => {
      $.OR([
        {ALT: () => $.CONSUME(id, {LABEL: normalIdentifierLabel})},
        {ALT: () => $.CONSUME(quotedId, {LABEL: quotedIdentifierLabel})},
      ]);
    });

    $.RULE('elements', () => {
      $.CONSUME(lBrace);
      $.MANY(() => {
        $.SUBRULE($.element, {LABEL: elementLabel});
      });
      $.CONSUME(rBrace);
    });

    $.RULE('element', () => {
      $.OR([
        {ALT: () => $.SUBRULE($.node, {LABEL: nodeLabel})},
        {ALT: () => $.SUBRULE($.edge, {LABEL: edgeLabel})},
        {ALT: () => $.SUBRULE($.group, {LABEL: groupLabel})},
      ]);
    });

    $.RULE('node', () => {
      $.CONSUME(provider, {LABEL: providerLabel});
      $.CONSUME(dot);
      $.CONSUME(id, {LABEL: serviceLabel});
      $.SUBRULE2($.identifier, {LABEL: idLabel});
      $.OPTION(() => {
        $.SUBRULE($.attrList, {LABEL: attrListLabel});
      });
      $.CONSUME(semicolon);
    });

    $.RULE('edge', () => {
      $.SUBRULE($.identifier, {LABEL: idLabel});
      $.AT_LEAST_ONE(() => {
        $.SUBRULE($.link, {LABEL: linkLabel});
        $.SUBRULE2($.identifier, {LABEL: idLabel});
      });
      $.OPTION(() => {
        $.SUBRULE($.attrList, {LABEL: attrListLabel});
      });
      $.CONSUME(semicolon);
    });

    $.RULE('group', () => {
      $.CONSUME(groupKeyword);
      $.SUBRULE($.identifier, {LABEL: idLabel});
      $.OPTION(() => {
        $.SUBRULE($.attrList, {LABEL: attrListLabel});
      });
      $.SUBRULE($.elements, {LABEL: elementsLabel});
    });

    $.RULE('attrList', () => {
      $.CONSUME(lBracket);
      $.MANY_SEP({
        SEP: comma,
        DEF: () => $.SUBRULE($.attribute, {LABEL: attrLabel}),
      });
      $.CONSUME(rBracket);
    });

    $.RULE('attribute', () => {
      $.CONSUME(id, {LABEL: attrNameLabel});
      $.CONSUME(equal);
      $.SUBRULE($.identifier, {LABEL: attrValueLabel});
    });

    $.RULE('link', () => {
      $.OR([
        {ALT: () => $.CONSUME(directedArrow, {LABEL: directedArrowLabel})},
        {ALT: () => $.CONSUME(bidirectionalArrow, {LABEL: bidirectionalArrowLabel})},
        {ALT: () => $.CONSUME(deepArrow, {LABEL: deepArrowLabel})},
        {ALT: () => $.CONSUME(bidirectionalDeepArrow, {LABEL: bidirectionalDeepArrowLabel})},
      ]);
    });

    this.performSelfAnalysis();
  }
}

export const parser = new DiagramParser();
