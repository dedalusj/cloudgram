export const pluck = prop => ({[prop]: plucked}) => plucked;

export const arrayDiff = (arr1, arr2) => {
  const _difference = new Set(arr1);
  for (const elem of new Set(arr2)) {
    _difference.delete(elem);
  }
  return [..._difference];
};

export const uniqBy = (array, keyFn = pluck('id')) => {
  const seen = new Set();
  return array.filter(item => {
    const k = keyFn(item);
    return seen.has(k) ? false : seen.add(k);
  });
};
// Object.values(array.reduce((acc, v) => ({...acc, [keyFn(v)]: v}), {}));

export const renameProp = (oldProp, newProp) => ({[oldProp]: v, ...rest}) => ({
  ...rest,
  [newProp]: v,
});

export const get = p => o => p.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), o);

export const getOr = (p, defaultValue) => o => get(p)(o) || defaultValue;
