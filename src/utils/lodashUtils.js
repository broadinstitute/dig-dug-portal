function cloneDeep(value) {
    if (value == null || typeof value !== "object") return value;
    if (value instanceof Date) return new Date(value.getTime());
    if (Array.isArray(value)) return value.map(cloneDeep);
    if (value instanceof Map) {
        return new Map(
            [...value].map(([key, item]) => [cloneDeep(key), cloneDeep(item)])
        );
    }
    if (value instanceof Set) return new Set([...value].map(cloneDeep));

    return Object.keys(value).reduce((copy, key) => {
        copy[key] = cloneDeep(value[key]);
        return copy;
    }, {});
}

function isEqual(left, right) {
    if (left === right) return true;
    if (Number.isNaN(left) && Number.isNaN(right)) return true;
    if (
        left == null ||
        right == null ||
        typeof left !== "object" ||
        typeof right !== "object"
    )
        return false;
    if (left instanceof Date || right instanceof Date) {
        return (
            left instanceof Date &&
            right instanceof Date &&
            left.getTime() === right.getTime()
        );
    }
    if (Array.isArray(left) || Array.isArray(right)) {
        return (
            Array.isArray(left) &&
            Array.isArray(right) &&
            left.length === right.length &&
            left.every((value, index) => isEqual(value, right[index]))
        );
    }

    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return (
        leftKeys.length === rightKeys.length &&
        leftKeys.every(
            (key) =>
                Object.prototype.hasOwnProperty.call(right, key) &&
                isEqual(left[key], right[key])
        )
    );
}

function isEmpty(value) {
    if (value == null) return true;
    if (Array.isArray(value) || typeof value === "string")
        return value.length === 0;
    if (value instanceof Map || value instanceof Set) return value.size === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return true;
}

function groupBy(items, iteratee) {
    const getKey =
        typeof iteratee === "function" ? iteratee : (item) => item[iteratee];
    const groups = new Map();
    items.forEach((item) => {
        const key = String(getKey(item));
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
    });
    return Object.fromEntries(groups);
}

function orderBy(items, iteratees, orders) {
    const keys = Array.isArray(iteratees) ? iteratees : [iteratees];
    const directions = Array.isArray(orders) ? orders : orders ? [orders] : [];
    return [...items].sort((left, right) => {
        for (let index = 0; index < keys.length; index++) {
            const getValue =
                typeof keys[index] === "function"
                    ? keys[index]
                    : (item) => item[keys[index]];
            const leftValue = getValue(left);
            const rightValue = getValue(right);
            if (leftValue === rightValue) continue;
            const direction = directions[index] === "desc" ? -1 : 1;
            if (leftValue === undefined) return direction;
            if (rightValue === undefined) return -direction;
            return (leftValue < rightValue ? -1 : 1) * direction;
        }
        return 0;
    });
}

function difference(items, excludedItems) {
    const excluded = new Set(excludedItems);
    return items.filter((item) => !excluded.has(item));
}

function sumBy(items, iteratee) {
    const getValue =
        typeof iteratee === "function" ? iteratee : (item) => item[iteratee];
    return items.reduce((sum, item) => sum + getValue(item), 0);
}

function isMergeable(value) {
    return (
        value != null &&
        typeof value === "object" &&
        !(value instanceof Date) &&
        !(value instanceof RegExp) &&
        !(value instanceof Map) &&
        !(value instanceof Set)
    );
}

function merge(target, ...sources) {
    sources.forEach((source) => {
        if (source == null) return;
        Object.keys(source).forEach((key) => {
            if (key === "__proto__") return;
            const sourceValue = source[key];
            const targetValue = target[key];
            if (sourceValue === undefined && targetValue !== undefined) return;
            if (
                isMergeable(sourceValue) &&
                isMergeable(targetValue) &&
                Array.isArray(sourceValue) === Array.isArray(targetValue)
            ) {
                merge(targetValue, sourceValue);
            } else if (isMergeable(sourceValue)) {
                target[key] = merge(
                    Array.isArray(sourceValue) ? [] : {},
                    sourceValue
                );
            } else {
                target[key] = sourceValue;
            }
        });
    });
    return target;
}

function get(object, path, defaultValue) {
    const parts = Array.isArray(path)
        ? path
        : String(path)
              .replace(/\[(\d+)\]/g, ".$1")
              .split(".")
              .filter(Boolean);
    let value = object;
    for (const part of parts) {
        if (value == null) return defaultValue;
        value = value[part];
    }
    return value === undefined ? defaultValue : value;
}

function uniqBy(items, iteratee) {
    const getKey =
        typeof iteratee === "function" ? iteratee : (item) => item[iteratee];
    const seen = new Set();
    return items.filter((item) => {
        const key = getKey(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export {
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
