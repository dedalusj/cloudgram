/*
Parser for the CloudGram syntax.

It leverages the chevrotain library for doing the main lifting and define a single
entrypoint, the `parse` method, to abstract away the underlying library.

chevrotain requires three main components to create a parser:
- a Lexer, defined in lexer.js, together with the tokens for the language
- a parser, defined in parser.js
- an interpreter, defined in interpreter.js, that converts the parsed output into a
  format suitable for the rest of the application
*/

import {lexer} from './lexer.js';
import {parser} from './parser.js';
import {interpreter} from './interpreter.js';

const convertError = ({
  message,
  token: {startLine, endLine, startColumn, endColumn} = {},
  previousToken: {
    startLine: previousStartLine,
    endLine: previousEndLine,
    startColumn: previousStartColumn,
    endColumn: previousEndColumn,
  } = {},
}) => ({
  message,
  // some errors, like the EOF token errors, don't have line and column info so fallback
  // to using the line and column from last recognised token
  line: {
    start: startLine || previousStartLine,
    end: endLine || previousEndLine,
  },
  column: {
    start: startColumn || previousStartColumn,
    end: endColumn || previousEndColumn,
  },
});

/**
 * Parse a CloudGram document
 * @param {string} text - document to parse
 * @returns {{parsed: ParsedDocument}, {errors: Object}}
 *
 * @typedef {Object} ParsedDocument
 * @property {string} id
 * @property {Array.<Element>} elements
 * @property {Object.<string,string>} attributes
 *
 * @typedef {Node | Edge | Group} Element
 *
 * @typedef {Object} Node
 * @property {('node')} type
 * @property {string} id
 * @property {string} provider
 * @property {string} service
 * @property {Object.<string, string>} attributes
 * @property {string} parent
 *
 * @typedef {Object} Edge
 * @property {('edge')} type
 * @property {string} src
 * @property {string} dst
 * @property {boolean} deepLink
 * @property {Object.<string, string>} attributes
 *
 * @typedef {Object} Group
 * @property {('group')} type
 * @property {string} id
 * @property {Array.<Element>} elements
 * @property {Object.<string, string>} attributes
 * @property {parent} id
 */
export const parse = text => {
  const lexResult = lexer.tokenize(text);
  parser.input = lexResult.tokens;
  const cst = parser.diagram();
  const parsed = parser.errors.length === 0 ? interpreter.visit(cst) : {};

  return {
    parsed,
    errors: parser.errors.map(convertError),
  };
};
