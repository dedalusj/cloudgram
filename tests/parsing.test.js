import {readFileSync} from 'fs';
import {promisify} from 'util';

import 'regenerator-runtime/runtime';
import {glob} from 'glob';

import {parse} from '../src/js/parser.js';

const archDrawExtension = 'ad';
const globPromise = promisify(glob);
const findDiagrams = () =>
  globPromise(`fixtures/*.${archDrawExtension}`, {
    cwd: __dirname,
    nodir: true,
    absolute: true,
  });
const expectedResultFilename = filename =>
  filename.replace(`.${archDrawExtension}`, '.json');

test('parses diagrams', async () => {
  const filenames = await findDiagrams();
  filenames.forEach(filename => {
    const fileContent = readFileSync(filename);
    const parsed = parse(fileContent.toString());
    const expected = JSON.parse(
      readFileSync(expectedResultFilename(filename)).toString(),
    );
    expect(parsed).toEqual(expected);
  });
});
