import {createToken, Lexer} from 'chevrotain';

const arrowSymbol = '->';
const deepArrowSymbol = '=>';

export const diagramKeyword = createToken({
  name: 'diagramKeyword',
  pattern: /diagram/,
});
export const groupKeyword = createToken({
  name: 'groupKeyword',
  pattern: /group/,
});
export const id = createToken({name: 'id', pattern: /([a-zA-Z][a-zA-Z0-9_\-]*|[-]?[0-9]+(\.[0-9]*)?)/});
export const quotedId = createToken({
  name: 'quotedId',
  pattern: /"[a-zA-Z0-9_\- ,().]*"/,
});
export const provider = createToken({
  name: 'provider',
  pattern: /(aws|k8s|generic)/,
});
export const lBrace = createToken({name: 'lBrace', pattern: /{/});
export const rBrace = createToken({name: 'rBrace', pattern: /}/});
export const lBracket = createToken({name: 'lBracket', pattern: /\[/});
export const rBracket = createToken({name: 'rBracket', pattern: /]/});
export const semicolon = createToken({name: 'semicolon', pattern: /;/});
export const comma = createToken({name: 'comma', pattern: /,/});
export const equal = createToken({name: 'equal', pattern: /=/});
export const dot = createToken({name: 'dot', pattern: /\./});
export const arrow = createToken({
  name: 'arrow',
  pattern: new RegExp(arrowSymbol),
});
export const deepArrow = createToken({
  name: 'deepArrow',
  pattern: new RegExp(deepArrowSymbol),
});
export const space = createToken({
  name: 'space',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});
export const singleLineComment = createToken({
  name: 'singleLineComment',
  pattern: /\/\/.*\n/,
  group: Lexer.SKIPPED,
});

export const tokensList = [
  space,
  singleLineComment,
  dot,
  lBrace,
  rBrace,
  lBracket,
  rBracket,
  semicolon,
  comma,
  arrow,
  deepArrow,
  equal,
  diagramKeyword,
  groupKeyword,
  provider,
  quotedId,
  id,
];

export const lexer = new Lexer(tokensList, {});

diagramKeyword.LABEL = "'diagram'";
groupKeyword.LABEL = "'group'";
lBrace.LABEL = "'{'";
rBrace.LABEL = "'}'";
lBracket.LABEL = "'['";
rBracket.LABEL = "']'";
semicolon.LABEL = "';'";
comma.LABEL = "','";
dot.LABEL = "'.'";
equal.LABEL = "'='";
arrow.LABEL = `'${arrowSymbol}'`;
deepArrow.LABEL = `'${deepArrowSymbol}'`;
