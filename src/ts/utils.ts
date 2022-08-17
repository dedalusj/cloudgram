// compute the difference between two arrays returning
// all elements from arr1 that are not present in arr2
export const arrayDiff = (arr1: string[], arr2: string[]): string[] => {
  const _difference = new Set(arr1);
  for (const elem of new Set(arr2)) {
    _difference.delete(elem);
  }
  return [..._difference];
};

// Create a function that can be used to check if a given input is part of a set
// if it is returns the input otherwise return the default value
export const fromSetOrDefault = <T>(set: Set<T>, value: T, defaultValue: T): T =>
  value && set.has(value) ? value : defaultValue;

// Grab the document definition for the query parameters
export const getDocumentFromUrl = (): string => new URLSearchParams(window.location.search).get('document');
