import {lexer} from './lexer';
import {parser} from './parser';
import {interpreter} from './interpreter';

const convertError = ({
  message,
  token: {startLine, endLine, startColumn, endColumn},
  previousToken: {
    startLine: previousStartLine,
    endLine: previousEndLine,
    startColumn: previousStartColumn,
    endColumn: previousEndColumn,
  },
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

export const parse = text => {
  const lexResult = lexer.tokenize(text);
  parser.input = lexResult.tokens;
  const cst = parser.diagram();
  const value = parser.errors.length === 0 ? interpreter.visit(cst) : {};

  return {
    parsed: value,
    errors: parser.errors.map(convertError),
  };
};
