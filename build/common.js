"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNotNil = exports.isNil = exports.takeN = void 0;
/**
 * Takes first N elements from arr.
 *
 *  @returns if arr[i] === null | undefined, returns arr[0...i-1]
 *
 *  @returns first N non-null|undefined elements from arr @returns first N non-null|undefined elements from arr
 *
*/
function takeN(arr, n) {
    const result = [];
    if (isNil(arr))
        return result;
    if (arr.length === 0)
        return result;
    for (let i = 0; i < n; i++) {
        const val = arr[i];
        if (isNotNil(val)) {
            result.push(val);
        }
        else {
            return result;
        }
    }
    return result;
}
exports.takeN = takeN;
function isNil(val) {
    return !isNotNil(val);
}
exports.isNil = isNil;
function isNotNil(val) {
    return val !== null && val !== undefined;
}
exports.isNotNil = isNotNil;
