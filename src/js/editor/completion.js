import ace from 'ace-builds';

import icons from '../icons';
import {keywords, attributes} from './constants';

const providers = Object.keys(icons);
const services = Object.values(icons).map(v => Object.keys(v)).flat();
const wordList = [...keywords, ...attributes, ...providers, ...services];

//use high score for static so that it takes precedence over text completion
const staticScore = 1000;

// complete using the known cloud providers and services
export const staticWordCompleter = {
  getCompletions: (editor, session, pos, prefix, callback) => callback(null, wordList.map(word => ({caption: word, value: word, meta: "static", score: staticScore}))),
};

// complete using the current text in the editor so that identifiers are suggested to users
export const textCompleter = ace.require("ace/ext/language_tools").textCompleter;
