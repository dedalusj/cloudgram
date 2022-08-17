/*
Define an ACE editor mode and highlighting
rules for the CloudGram syntax
*/

import ace from 'ace-builds';

import {HighlightRules} from './highlighting_rules';

const oop = ace.require('ace/lib/oop');
const TextMode = ace.require('ace/mode/text').Mode;

export const Mode = function () {
  this.HighlightRules = HighlightRules;
};
oop.inherits(Mode, TextMode);

(function () {
  this.$id = 'ace/mode/custom';
}.call(Mode.prototype));
