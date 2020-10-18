import {drop, pluck, arrayDiff, uniqBy, renameProp} from '../src/js/utils';

test('drop[ a value from object', () => {
  expect(drop('a')({a: 1, b: 2})).toEqual({b: 2});
  expect(drop('c')({a: 1, b: 2})).toEqual({a: 1, b: 2});
});

test('pluck a value from object', () => {
  expect(pluck('a')({a: 1, b: 2})).toEqual(1);
  expect(pluck('c')({a: 1, b: 2})).toEqual(undefined);
});

test('return missing elements from second list', () => {
  expect(arrayDiff([1, 2, 3], [2, 3])).toEqual([1]);
  expect(arrayDiff([1, 2, 3], [])).toEqual([1, 2, 3]);
  expect(arrayDiff([1, 2, 3], [1, 2, 3])).toEqual([]);
  expect(arrayDiff([1, 2, 3], [1, 2, 3, 4])).toEqual([]);
  expect(arrayDiff([], [1, 2, 3, 4])).toEqual([]);
});

describe('unique by', () => {
  test('unique by specified key', () => {
    expect(uniqBy([], 'id')).toEqual([]);
    expect(
      uniqBy(
        [
          {id: 1, a: 2},
          {id: 2, a: 2},
        ],
        'id'
      )
    ).toEqual([
      {id: 1, a: 2},
      {id: 2, a: 2},
    ]);
    expect(
      uniqBy(
        [
          {id: 1, a: 2},
          {id: 1, a: 3},
        ],
        'id'
      )
    ).toEqual([{id: 1, a: 3}]);
    expect(
      uniqBy(
        [
          {id: 1, a: 2},
          {id: 1, a: 3},
        ],
        'unknown'
      )
    ).toEqual([{id: 1, a: 3}]);
  });

  test('it defaults to id as key', () => {
    expect(
      uniqBy([
        {id: 1, a: 2},
        {id: 1, a: 3},
      ])
    ).toEqual([{id: 1, a: 3}]);
  });
});

describe('rename properties', () => {
  test('it renames a property', () => {
    expect(renameProp('old', 'new')({old: 1, untouched: 2})).toEqual({
      new: 1,
      untouched: 2,
    });
  });

  test('it leaves the object unchanged if property is not present', () => {
    expect(renameProp('old', 'new')({unknown: 1, untouched: 2})).toEqual({
      unknown: 1,
      untouched: 2,
    });
  });

  test('it overrides an existing property if clashes with new name', () => {
    expect(renameProp('old', 'new')({old: 1, new: 2})).toEqual({new: 1});
  });
});
