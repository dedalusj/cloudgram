export const drop = prop => ({[prop]: dropped, ...rest}) => ({...rest});

export const pluck = prop => ({[prop]: plucked}) => plucked;

export const arrayDiff = (arr1, arr2) => {
  const _difference = new Set(arr1);
  for (const elem of new Set(arr2)) {
    _difference.delete(elem);
  }
  return [..._difference];
};

export const uniqBy = (array, key = 'id') =>
  Object.values(array.reduce((acc, v) => ({...acc, [v[key]]: v}), {}));

export const renameProp = (oldProp, newProp) => ({[oldProp]: v, ...rest}) => ({
  ...rest,
  [newProp]: v,
});
