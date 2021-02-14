// define the main tokens for the syntax and
// creates a chevrotain Lexer from them

import {createToken, Lexer} from 'chevrotain';

const directedArrowSymbol = '->';
const bidirectionalArrowSymbol = '<->';
const deepArrowSymbol = '=>';
const bidirectionalDeepArrowSymbol = '<=>';

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
  pattern: /"[a-zA-Z0-9_\- ,().\/#]*"/,
});
export const provider = createToken({
  name: 'provider',
  pattern: /(aws|k8s|azure|generic)/,
});
export const lBrace = createToken({name: 'lBrace', pattern: /{/});
export const rBrace = createToken({name: 'rBrace', pattern: /}/});
export const lBracket = createToken({name: 'lBracket', pattern: /\[/});
export const rBracket = createToken({name: 'rBracket', pattern: /]/});
export const semicolon = createToken({name: 'semicolon', pattern: /;/});
export const comma = createToken({name: 'comma', pattern: /,/});
export const equal = createToken({name: 'equal', pattern: /=/});
export const dot = createToken({name: 'dot', pattern: /\./});
export const directedArrow = createToken({
  name: 'directedArrow',
  pattern: new RegExp(directedArrowSymbol),
});
export const bidirectionalArrow = createToken({
  name: 'bidirectionalArrow',
  pattern: new RegExp(bidirectionalArrowSymbol),
});
export const deepArrow = createToken({
  name: 'deepArrow',
  pattern: new RegExp(deepArrowSymbol),
});
export const bidirectionalDeepArrow = createToken({
  name: 'bidirectionalDeepArrow',
  pattern: new RegExp(bidirectionalDeepArrowSymbol),
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
  directedArrow,
  bidirectionalArrow,
  deepArrow,
  bidirectionalDeepArrow,
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
directedArrow.LABEL = `'${directedArrowSymbol}'`;
bidirectionalArrow.LABEL = `'${bidirectionalArrowSymbol}'`;
deepArrow.LABEL = `'${deepArrowSymbol}'`;
bidirectionalDeepArrow.LABEL = `'${bidirectionalDeepArrowSymbol}'`;
