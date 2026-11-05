import sortUtils from "./sortUtils";

/// Native replacements for the lodash functions this codebase used, matching
/// lodash semantics for the call sites in src/.

let cloneDeep = function (VALUE) {
    if (VALUE == null || typeof VALUE != "object") return VALUE;
    if (VALUE instanceof Date) return new Date(VALUE.getTime());
    if (Array.isArray(VALUE)) return VALUE.map(v => cloneDeep(v));
    if (VALUE instanceof Map) return new Map([...VALUE].map(([k, v]) => [cloneDeep(k), cloneDeep(v)]));
    if (VALUE instanceof Set) return new Set([...VALUE].map(v => cloneDeep(v)));

    let cloned = {};
    Object.keys(VALUE).forEach(key => {
        cloned[key] = cloneDeep(VALUE[key]);
    });
    return cloned;
}

let isEqual = function (A, B) {
    if (A === B) return true;
    if (Number.isNaN(A) && Number.isNaN(B)) return true;
    if (A == null || B == null || typeof A != "object" || typeof B != "object") return false;
    if (A instanceof Date || B instanceof Date) {
        return A instanceof Date && B instanceof Date && A.getTime() === B.getTime();
    }
    if (Array.isArray(A) || Array.isArray(B)) {
        if (!Array.isArray(A) || !Array.isArray(B) || A.length !== B.length) return false;
        return A.every((value, index) => isEqual(value, B[index]));
    }

    let aKeys = Object.keys(A);
    let bKeys = Object.keys(B);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(key =>
        Object.prototype.hasOwnProperty.call(B, key) && isEqual(A[key], B[key]));
}

let isEmpty = function (VALUE) {
    if (VALUE == null) return true;
    if (Array.isArray(VALUE) || typeof VALUE == "string") return VALUE.length === 0;
    if (VALUE instanceof Map || VALUE instanceof Set) return VALUE.size === 0;
    if (typeof VALUE == "object") return Object.keys(VALUE).length === 0;
    return true;
}

let groupBy = function (ARR, KEY) {
    const getter = typeof KEY == "function" ? KEY : (item) => item[KEY];
    // Accumulate in a Map so group values like "constructor" or "__proto__"
    // in external data can't collide with Object.prototype; Object.fromEntries
    // defines them as plain own properties, like lodash did.
    let grouped = new Map();
    ARR.forEach(item => {
        const groupKey = String(getter(item));
        if (!grouped.has(groupKey)) grouped.set(groupKey, []);
        grouped.get(groupKey).push(item);
    });
    return Object.fromEntries(grouped);
}

let orderBy = function (ARR, KEYS, ORDERS) {
    const keys = Array.isArray(KEYS) ? KEYS : [KEYS];
    const orders = Array.isArray(ORDERS) ? ORDERS : (!!ORDERS ? [ORDERS] : []);

    return [...ARR].sort((a, b) => {
        for (let i = 0; i < keys.length; i++) {
            const getter = typeof keys[i] == "function" ? keys[i] : (item) => item[keys[i]];
            const x = getter(a);
            const y = getter(b);
            if (x === y) continue;
            const direction = orders[i] === "desc" ? -1 : 1;
            // like lodash, undefined compares greater than any other value
            if (x === undefined) return direction;
            if (y === undefined) return -direction;
            return (x < y ? -1 : 1) * direction;
        }
        return 0;
    });
}

let difference = function (ARR, EXCLUDE) {
    const excluded = new Set(EXCLUDE);
    return ARR.filter(value => !excluded.has(value));
}

let sumBy = function (ARR, KEY) {
    const getter = typeof KEY == "function" ? KEY : (item) => item[KEY];
    return ARR.reduce((sum, item) => sum + getter(item), 0);
}

let isMergeable = function (VALUE) {
    return VALUE != null && typeof VALUE == "object"
        && !(VALUE instanceof Date) && !(VALUE instanceof RegExp)
        && !(VALUE instanceof Map) && !(VALUE instanceof Set);
}

// Deep merge with lodash semantics: recurses into plain objects and arrays
// (arrays merge index-wise, not by replacement), skips undefined source
// values when the target already has one, mutates and returns TARGET.
let merge = function (TARGET, ...SOURCES) {
    SOURCES.forEach(source => {
        if (source == null) return;
        Object.keys(source).forEach(key => {
            // like lodash >=4.17.5, never merge __proto__ keys — an external
            // payload (e.g. a TRAPI response) must not pollute the prototype
            if (key === "__proto__") return;
            const sourceValue = source[key];
            const targetValue = TARGET[key];
            if (sourceValue === undefined && targetValue !== undefined) return;
            if (isMergeable(sourceValue) && isMergeable(targetValue)
                && Array.isArray(sourceValue) === Array.isArray(targetValue)) {
                merge(targetValue, sourceValue);
            } else if (isMergeable(sourceValue)) {
                TARGET[key] = merge(Array.isArray(sourceValue) ? [] : {}, sourceValue);
            } else {
                TARGET[key] = sourceValue;
            }
        });
    });
    return TARGET;
}

let get = function (OBJ, PATH, DEFAULT) {
    const parts = Array.isArray(PATH)
        ? PATH
        : String(PATH).replace(/\[(\d+)\]/g, ".$1").split(".").filter(p => p !== "");

    let current = OBJ;
    for (const part of parts) {
        if (current == null) return DEFAULT;
        current = current[part];
    }
    return current === undefined ? DEFAULT : current;
}

// sortUtils already had a lodash-compatible uniqBy; re-exported here so all
// former lodash imports resolve from one module.
let uniqBy = sortUtils.uniqBy;

export { cloneDeep, isEqual, isEmpty, groupBy, orderBy, difference, sumBy, merge, get, uniqBy };

export default {
    cloneDeep,
    isEqual,
    isEmpty,
    groupBy,
    orderBy,
    difference,
    sumBy,
    merge,
    get,
    uniqBy,
};
