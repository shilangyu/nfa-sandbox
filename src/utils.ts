export const isSubsetOf = <T>(a: Set<T>, b: Set<T>) => {
  for (const value of a) if (!b.has(value)) return false;
  return true;
};
