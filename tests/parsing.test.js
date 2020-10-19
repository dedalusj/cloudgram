import {readFileSync} from 'fs';
import {promisify} from 'util';

import 'regenerator-runtime/runtime';
import {glob} from 'glob';

import {parse} from '../src/js/parser.js';

const cloudWireExtension = 'cw';
const globPromise = promisify(glob);
const findDiagrams = () =>
  globPromise(`fixtures/*.${cloudWireExtension}`, {
    cwd: __dirname,
    nodir: true,
    absolute: true,
  });
const expectedResultFilename = filename =>
  filename.replace(`.${cloudWireExtension}`, '.json');

test('parses diagrams', async () => {
  const filenames = await findDiagrams();
  filenames.forEach(filename => {
    const fileContent = readFileSync(filename);
    const parsed = parse(fileContent.toString());
    const expected = JSON.parse(
      readFileSync(expectedResultFilename(filename)).toString()
    );
    expect(parsed).toEqual(expected);
  });
});
