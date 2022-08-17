import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';
import {writeFileSync} from 'fs';

import chevrotain from 'chevrotain';

import {parser} from '../src/ts/parser/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serializedGrammar = parser.getSerializedGastProductions();
const htmlText = chevrotain.createSyntaxDiagramsCode(serializedGrammar);
const targetFile = resolve(__dirname, '../src/grammar_diagram.html');

writeFileSync(targetFile, htmlText);
