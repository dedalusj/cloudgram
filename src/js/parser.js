import {createToken, Lexer, CstParser} from 'chevrotain';

export const normalLink = 'normal';
export const normalLinkSymbol = '->';
export const deepLink = 'deep';
export const deepLinkSymbol = '=>';

const idLabel = 'id';
const elementsLabel = 'elements';
const normalIdentifierLabel = 'normal';
const quotedIdentifierLabel = 'quoted';
const linkLabel = 'link';
const serviceLabel = 'service';
const providerLabel = 'provider';
const edgeLabel = 'edge';
const nodeLabel = 'node';

const diagramKeyword = createToken({
  name: 'diagramKeyword',
  pattern: /diagram/,
});
const id = createToken({name: 'id', pattern: /[a-zA-Z][a-zA-Z0-9_\-]*/});
const quotedId = createToken({
  name: 'quotedId',
  pattern: /"[a-zA-Z][a-zA-Z0-9_\- ]*"/,
});
const provider = createToken({name: 'provider', pattern: /(aws|generic)/});
const lBrace = createToken({name: 'lBrace', pattern: /{/});
const rBrace = createToken({name: 'rBrace', pattern: /}/});
const semicolon = createToken({name: 'semicolon', pattern: /;/});
const dot = createToken({name: 'dot', pattern: /\./});
const arrow = createToken({
  name: 'arrow',
  pattern: new RegExp(normalLinkSymbol),
});
const deepArrow = createToken({
  name: 'deepArrow',
  pattern: new RegExp(deepLinkSymbol),
});
const space = createToken({
  name: 'space',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});
const singleLineComment = createToken({
  name: 'singleLineComment',
  pattern: /\/\/.*\n/,
  group: Lexer.SKIPPED,
});

const diagramTokens = [
  space,
  singleLineComment,
  dot,
  lBrace,
  rBrace,
  semicolon,
  arrow,
  deepArrow,
  diagramKeyword,
  provider,
  quotedId,
  id,
];

const DiagramLexer = new Lexer(diagramTokens, {});

lBrace.LABEL = "'{'";
rBrace.LABEL = "'}'";
semicolon.LABEL = "';'";
dot.LABEL = "'.'";
arrow.LABEL = `'${normalLinkSymbol}'`;
deepArrow.LABEL = `'${deepLinkSymbol}'`;

class DiagramParser extends CstParser {
  constructor() {
    super(diagramTokens, {
      recoveryEnabled: true,
    });

    const $ = this;

    $.RULE('diagram', () => {
      $.CONSUME(diagramKeyword);
      $.SUBRULE($.identifier, {LABEL: idLabel});
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
        $.OR([
          {ALT: () => $.SUBRULE($.node, {LABEL: nodeLabel})},
          {ALT: () => $.SUBRULE($.edge, {LABEL: edgeLabel})},
        ]);
      });
      $.CONSUME(rBrace);
    });

    $.RULE('node', () => {
      $.CONSUME(provider, {LABEL: providerLabel});
      $.CONSUME(dot);
      $.CONSUME(id, {LABEL: serviceLabel});
      $.SUBRULE2($.identifier, {LABEL: idLabel});
      $.OPTION(() => {
        $.SUBRULE($.elements, {LABEL: elementsLabel});
      });
    });

    $.RULE('edge', () => {
      $.SUBRULE($.identifier, {LABEL: idLabel});
      $.AT_LEAST_ONE(() => {
        $.SUBRULE($.link, {LABEL: linkLabel});
        $.SUBRULE2($.identifier, {LABEL: idLabel});
      });
      $.CONSUME(semicolon);
    });

    $.RULE('link', () => {
      $.OR([
        {ALT: () => $.CONSUME(arrow, {LABEL: normalLink})},
        {ALT: () => $.CONSUME(deepArrow, {LABEL: deepLink})},
      ]);
    });

    this.performSelfAnalysis();
  }
}

const parser = new DiagramParser();
const BaseCstVisitor = parser.getBaseCstVisitorConstructor();

class DiagramInterpreter extends BaseCstVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  diagram(ctx) {
    const elements = this.visit(ctx[elementsLabel]);
    const id = this.visit(ctx[idLabel]);
    return {
      ...elements,
      id,
    };
  }

  elements(ctx) {
    return {
      nodes: ctx[nodeLabel] ? ctx[nodeLabel].map(n => this.visit(n)) : [],
      edges: ctx[edgeLabel]
        ? ctx[edgeLabel].map(e => this.visit(e)).flat()
        : [],
    };
  }

  edge(ctx) {
    const ids = ctx[idLabel].map(i => this.visit(i));
    const links = ctx[linkLabel].map(l => this.visit(l));
    const edges = [];
    for (let i = 0; i < ids.length - 1; i++) {
      edges.push({src: ids[i], dst: ids[i + 1], connection: links[i]});
    }
    return edges;
  }

  node(ctx) {
    const provider = ctx[providerLabel][0].image;
    const service = ctx[serviceLabel][0].image;
    const id = this.visit(ctx[idLabel]);
    const elements = this.visit(ctx[elementsLabel]);
    return {
      id,
      provider,
      service,
      nodes: elements ? elements.nodes : [],
      edges: elements ? elements.edges : [],
    };
  }

  identifier(ctx) {
    return ctx[quotedIdentifierLabel]
      ? ctx[quotedIdentifierLabel][0].image.slice(1).slice(0, -1)
      : ctx[normalIdentifierLabel][0].image;
  }

  link(ctx) {
    return ctx[deepLink] ? deepLink : normalLink;
  }
}

const interpreter = new DiagramInterpreter();

const convertError = ({message, token: {startLine, endLine, startColumn, endColumn}}) => ({
  message,
  line: {start: startLine, end: endLine},
  column: {start: startColumn, end: endColumn},
});

export const parse = text => {
  const lexResult = DiagramLexer.tokenize(text);
  parser.input = lexResult.tokens;
  const cst = parser.diagram();
  const value = interpreter.visit(cst);

  return {
    parsed: value,
    errors: parser.errors.map(convertError),
  };
};
