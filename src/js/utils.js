// pluck a property from an object
export const pluck = prop => ({[prop]: plucked}) => plucked;

// compute the difference between two arrays returning
// all elements from arr1 that are not present in arr2
export const arrayDiff = (arr1, arr2) => {
  const _difference = new Set(arr1);
  for (const elem of new Set(arr2)) {
    _difference.delete(elem);
  }
  return [..._difference];
};

// find unique objects in an array using an optional key function
// default is to look for the property id of the objects
export const uniqBy = (array, keyFn = pluck('id')) => {
  const seen = new Set();
  return array.filter(item => {
    const k = keyFn(item);
    return seen.has(k) ? false : seen.add(k);
  });
};

// rename a property in an object
export const renameProp = (oldProp, newProp) => ({[oldProp]: v, ...rest}) => ({
  ...rest,
  [newProp]: v,
});

// Create a function that can be used to retrieve nested properties from an object
export const get = propArray => o => propArray.reduce((xs, x) => (xs && xs.hasOwnProperty(x) ? xs[x] : null), o);
export const getOrDefault = (propArray, defaultValue) => o => get(propArray)(o) || defaultValue;

// Create a function that can be used to check if a given input is part of a set
// if it is returns the input otherwise return the default value
export const inSetOrDefault = (set, defaultValue) => o => (o && set.has(o) ? o : defaultValue);

// create a function that chains all the functions given as input
export const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);

export const toLowerCase = x => (!x ? x : x.toLowerCase());

export const merge = (a, b) => ({...a, ...b});

// Grab the document definition for the query parameters
export const getDocumentFromUrl = () => new URLSearchParams(window.location.search).get('document');
