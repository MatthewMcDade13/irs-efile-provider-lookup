

/**
 * Takes first N elements from arr. 
 *
 *  @returns if arr[i] === null | undefined, returns arr[0...i-1]
 *
 *  @returns first N non-null|undefined elements from arr @returns first N non-null|undefined elements from arr 
 *
*/
export function takeN<T>(arr: ReadonlyArray<T>, n: number): NonNullable<T[]> {

  const result: T[] = [];

  if (isNil(arr)) return result;
  if (arr.length === 0) return result;

  for (let i = 0; i < n; i++) {
    const val = arr[i];
    if (isNotNil(val)) {
      result.push(val);
    } else {
      return result;
    }
  }


  return result;
}

export function isNil(val?: any): val is null | undefined {
  return !isNotNil(val);
}

export function isNotNil<T>(val?: T): val is NonNullable<T> {
  return val !== null && val !== undefined;
}

export type CompareResult = -1 | 0 | 1;
