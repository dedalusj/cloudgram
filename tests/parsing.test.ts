import {readFileSync} from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

import 'regenerator-runtime/runtime';
import glob from 'glob';

import {parse} from '../src/ts/parser';

const fileExtension = 'cw';
const expectedResultFilename = filename => filename.replace(`.${fileExtension}`, '.json');

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const filesToTest = glob.sync(`fixtures/*.${fileExtension}`, {
  cwd: dirname,
  nodir: true,
  absolute: true,
});

describe('parses diagrams', () => {
  test.each(filesToTest)('%s', filename => {
    const fileContent = readFileSync(filename);
    const parsed = parse(fileContent.toString());
    const expected = JSON.parse(readFileSync(expectedResultFilename(filename)).toString());
    expect(parsed).toEqual(expected);
  });
});
