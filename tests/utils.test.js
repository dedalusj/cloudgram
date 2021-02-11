import {pluck, arrayDiff, uniqBy, renameProp, get, getOrDefault, inSetOrDefault, pipe, merge} from '../src/js/utils';

it('pluck a value from object', () => {
  expect(pluck('a')({a: 1, b: 2})).toEqual(1);
  expect(pluck('c')({a: 1, b: 2})).toEqual(undefined);
});

it('return missing elements from second list', () => {
  expect(arrayDiff([1, 2, 3], [2, 3])).toEqual([1]);
  expect(arrayDiff([1, 2, 3], [])).toEqual([1, 2, 3]);
  expect(arrayDiff([1, 2, 3], [1, 2, 3])).toEqual([]);
  expect(arrayDiff([1, 2, 3], [1, 2, 3, 4])).toEqual([]);
  expect(arrayDiff([], [1, 2, 3, 4])).toEqual([]);
});

describe('unique by', () => {
  it('leaves empty array untouched', () => {
    expect(uniqBy([], ({id}) => id)).toEqual([]);
  });

  it('leaves arrays with no duplicates untouched', () => {
    expect(
      uniqBy(
        [
          {id: 1, a: 2},
          {id: 2, a: 2},
        ],
        ({id}) => id
      )
    ).toEqual([
      {id: 1, a: 2},
      {id: 2, a: 2},
    ]);
  });

  it('find unique elements by key keeping the first one', () => {
    expect(
      uniqBy(
        [
          {id: 1, a: 2},
          {id: 1, a: 3},
        ],
        ({id}) => id
      )
    ).toEqual([{id: 1, a: 2}]);
  });

  it('collapses all elements without a key to one', () => {
    expect(
      uniqBy(
        [
          {id: 1, a: 2},
          {id: 1, a: 3},
          {unknown: 2, a: 4},
        ],
        ({unknown}) => unknown
      )
    ).toEqual([
      {id: 1, a: 2},
      {unknown: 2, a: 4},
    ]);
  });

  it('defaults to id as key', () => {
    expect(
      uniqBy([
        {id: 1, a: 2},
        {id: 1, a: 3},
      ])
    ).toEqual([{id: 1, a: 2}]);
  });
});

describe('rename properties', () => {
  it('renames a property', () => {
    expect(renameProp('old', 'new')({old: 1, untouched: 2})).toEqual({
      new: 1,
      untouched: 2,
    });
  });

  it('leaves the object unchanged if property is not present', () => {
    expect(renameProp('old', 'new')({unknown: 1, untouched: 2})).toEqual({
      unknown: 1,
      untouched: 2,
    });
  });

  it('overrides an existing property if clashes with new name', () => {
    expect(renameProp('old', 'new')({old: 1, new: 2})).toEqual({new: 1});
  });
});

describe('nested property', () => {
  it('gets a root property from an object', () => {
    expect(get(['a'])({a: 1})).toEqual(1);
  });

  it('gets a nested property from an object', () => {
    expect(get(['a', 'b'])({a: {b: 2}})).toEqual(2);
  });

  it('returns null if the property does not exists', () => {
    expect(get(['a', 'c'])({a: {b: 2}})).toEqual(null);
    expect(get(['c', 'b'])({a: {b: 2}})).toEqual(null);
  });

  it('uses the default value if the property does not exists', () => {
    expect(getOrDefault(['a', 'b'], 3)({a: {b: 2}})).toEqual(2);
    expect(getOrDefault(['a', 'c'], 3)({a: {b: 2}})).toEqual(3);
  });

  it('preserves empty strings', () => {
    expect(get(['a', 'b'])({a: {b: ''}})).toEqual('');
  });
});

describe('value from set', () => {
  const fn = inSetOrDefault(new Set(['a', 'b', 'c']), 'a');

  it('returns a value if present in a set', () => {
    expect(fn('b')).toEqual('b');
  });

  it('returns the default value if not present in the set', () => {
    expect(fn('d')).toEqual('a');
  });
});

describe('pipe functions', () => {
  it('nests functions', () => {
    const doubler = n => n * 2;
    const adder = n => n + 1;
    expect(pipe(doubler, adder)(3)).toEqual(7);
    expect(pipe(adder, doubler)(3)).toEqual(8);
  });
});

describe('merge', () => {
  it('merges two disjoint objects', () => {
    expect(merge({a: 1, b: 2}, {c: 3, d: 4})).toEqual({a: 1, b: 2, c: 3, d: 4});
  });

  it('merges two overlapping objects', () => {
    expect(merge({a: 1, b: 2}, {b: 3, c: 4})).toEqual({a: 1, b: 3, c: 4});
  });
});