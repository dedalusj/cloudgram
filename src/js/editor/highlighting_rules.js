import ace from 'ace-builds';
import {keywords, attributes} from './constants';

const oop = ace.require('ace/lib/oop');
const TextHighlightRules = ace.require('ace/mode/text_highlight_rules').TextHighlightRules;

export const HighlightRules = function () {
  this.$rules = {
    start: [
      {
        token: 'comment',
        regex: /\/\/.*$/,
      },
      {
        token: 'keyword.operator',
        regex: /=>|->|<=>|<->/,
      },
      {
        token: 'punctuation.operator',
        regex: /;/,
      },
      {
        token: 'paren.lparen',
        regex: /{/,
      },
      {
        token: 'paren.rparen',
        regex: /}/,
      },
      {
        token: 'text',
        regex: /"(?:[^"]|"")*"/,
      },
      {
        token: () => ['entity.name.type', 'punctuation.operator', 'entity.name.type'],
        regex: /([a-zA-Z][a-zA-Z0-9_\-]+)(\.)([a-zA-Z][a-zA-Z0-9_\-]+)/,
      },
      {
        token: value =>
          keywords.includes(value.toLowerCase())
            ? 'keyword'
            : attributes.includes(value.toLowerCase())
            ? 'variable'
            : 'text',
        regex: '\\-?[a-zA-Z_][a-zA-Z0-9_\\-]*',
      },
    ],
  };
};

oop.inherits(HighlightRules, TextHighlightRules);
