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

import {lexer} from './lexer';
import {parser} from './parser';
import {interpreter} from './interpreter';
import {IToken} from '@chevrotain/types';
import {Diagram, ParseError, ParseOutput} from '../types';

interface ParserError {
  message: string;
  token: IToken;
  previousToken?: IToken;
}

const convertError = ({message, token, previousToken}: ParserError): ParseError => ({
  message,
  // some errors, like the EOF token errors, don't have line and column info so fallback
  // to using the line and column from last recognised token
  line: {
    start: token.startLine || previousToken.startLine,
    end: token.endLine || previousToken.endLine,
  },
  column: {
    start: token.startColumn || previousToken.startColumn,
    end: token.endColumn || previousToken.endColumn,
  },
});

// parse a Cloudgram document
export const parse = (text: string): ParseOutput => {
  const lexResult = lexer.tokenize(text);
  parser.input = lexResult.tokens;
  const cst = parser.diagram();
  const parsed: Diagram | undefined = parser.errors.length === 0 ? interpreter.visit(cst) : undefined;

  return {
    parsed,
    errors: parser.errors.map(convertError),
  };
};
