import {arrayDiff} from '../src/ts/utils';

it('return missing elements from second list', () => {
  expect(arrayDiff(['1', '2', '3'], ['2', '3'])).toEqual(['1']);
  expect(arrayDiff(['1', '2', '3'], [])).toEqual(['1', '2', '3']);
  expect(arrayDiff(['1', '2', '3'], ['1', '2', '3'])).toEqual([]);
  expect(arrayDiff(['1', '2', '3'], ['1', '2', '3', '4'])).toEqual([]);
  expect(arrayDiff([], ['1', '2', '3', '4'])).toEqual([]);
});
