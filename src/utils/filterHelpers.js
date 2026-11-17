import { get } from "lodash";

export function filterFromPredicates(allPredicates, inclusive) {
    const inclusivePredicates = allPredicates.filter(predicate => predicate.inclusive);
    const predicates = allPredicates.filter(predicate => !predicate.inclusive);

    return function filterFunction(object) {
        let innocent = true;

        // Apply inclusion bounds first so later exclusions cannot be reversed.

        let included = true;
        if (inclusivePredicates.length > 0) {
            included = false;
            for (
                let predicateI = 0;
                predicateI < inclusivePredicates.length;
                predicateI++
            ) {
                included = inclusivePredicates[predicateI].func(object);
                if (included === true) break;
            }
        }

        if (allPredicates.length > 0) {
            if (!!!inclusive) {
                for (
                    let predicateI = 0;
                    predicateI < predicates.length;
                    predicateI++
                ) {
                    innocent = predicates[predicateI].func(object);
                    if (innocent === false) break;
                }
            } else {
                innocent = false;
                for (
                    let predicateI = 0;
                    predicateI < predicates.length;
                    predicateI++
                ) {
                    innocent = predicates[predicateI].func(object);
                    if (innocent === true) break;
                }
            }
        }
        return included && innocent;

    };
}

export function predicateFromSpec(
    { field, computedField, predicate, threshold, inclusive = false },
    { notStrictMatch = false, strictCase = false }
) {
    // notStrictMatch allows heterogeneous records to omit fields used by other components.
    return {
        inclusive,
        func: (obj) => {
            
            let getter = !!computedField ? computedField : obj => get(obj, field);

            let data = getter(obj);
            let match = strictCase ? !!data : !!data
            if (match) {
                if (data.constructor.name === 'Array') {
                    return data.some(el => predicate(el, threshold));
                } else {
                    return predicate(data, threshold);
                }
            } else {
                return notStrictMatch;
            }
            
        }
    };
}

export function looseMatcher(object, fieldName, strictMatchCase = false) {
}

export function encodeNamespace(
    regularObject,
    { prefix = "", suffix = "", pDelimiter = "", sDelimiter = "" }
) {


    let tempObject = {};
    Object.entries(regularObject).forEach(entry => {
        const [key, value] = entry;
        const newKey = `${prefix}${pDelimiter}${key}${sDelimiter}${suffix}`;
        tempObject[newKey] = value;
    });
    return tempObject;
}

export function decodeNamespace(
    namespacedObject,
    { prefix = "", suffix = "", pDelimiter = "", sDelimiter = "" }
) {

    let tempObject = {};
    Object.entries(namespacedObject).forEach(entry => {
        const [key, value] = entry;
        const newKey = key.replace(prefix, '').replace(suffix, '')
            .replace(pDelimiter, '')
            .replace(sDelimiter, '');
        tempObject[newKey] = value;
    });
    return tempObject;
}

export function unsetFilter(filterList, filter) {
    const _filterList = _.filter(
        filterList, 
        el => !(el.field === filter.field && el.threshold === filter.threshold));
    return _filterList;
}

export function unsetFilterFromList(filterList) {
    return filter => {
        filterList = unsetFilter(filterList, filter);
    };
}

export default {
    filterFromPredicates,
    predicateFromSpec,
    decodeNamespace,
    encodeNamespace,
    unsetFilter,
    unsetFilterFromList
}