import {readFileSync} from 'fs';

import 'regenerator-runtime/runtime';
import {glob} from 'glob';

import {parse} from '../src/js/parser.js';

const cloudWireExtension = 'cw';
const expectedResultFilename = filename =>
  filename.replace(`.${cloudWireExtension}`, '.json');

const filesToTest = glob.sync(`fixtures/*.${cloudWireExtension}`, {
  cwd: __dirname,
  nodir: true,
  absolute: true,
});

describe('parses diagrams', () => {
  test.each(filesToTest)('%s', filename => {
    const fileContent = readFileSync(filename);
    const parsed = parse(fileContent.toString());
    const expected = JSON.parse(
      readFileSync(expectedResultFilename(filename)).toString()
    );
    expect(parsed).toEqual(expected);
  });
});
