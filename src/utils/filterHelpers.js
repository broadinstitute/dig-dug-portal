import { get } from "lodash";

export function aos2soa(aos) {
    // const keys = Object.keys(aos[0]);
    // let soa = keys.reduce((acc, item) => {
    //     acc[item] = []
    //     return acc;
    // },{});
    // aos.forEach(s => {
    //     keys.forEach(k => {
    //         soa[k].push(s[k])
    //     });
    // });
    // return soa;
    // return zip(aos)
}

export function soa2aos(soa) {

}

/* FILTER-MAKING FUNCTIONS */
export function filterFromPredicates(allPredicates, inclusive) {
    const inclusivePredicates = allPredicates.filter(predicate => predicate.inclusive);
    const predicates = allPredicates.filter(predicate => !predicate.inclusive);

    return function filterFunction(object) {
        // Guilt is terminal: we break our investigation as soon as
        // we've found evidence that the object isn't innocent.
        // NOTE: Filter policy by default is innocent until proven guilty.
        // so in lieu of any predicates, remain truthy by default
        let innocent = true;

        // Predicates can tell us whether or not they want to override the global settings for inclusion
        // This step must run before anything else is excluded, otherwise certain exclusions might be reversed and in the worst case we just get the original set back (no information)
        // Instead we treat this as setting up the bounding conditions of the set (what we want to include for filtering)

        // If there are no predicates that tell to override the global configuration for the filter, it's irrelevant to the filter.
        // So the default for whether or not a point is included must be "true", since the filter policy is innocent-until-guilty.
        let included = true;
        if (inclusivePredicates.length > 0) {
            // since there are some local filters doing overrides, we let them decide what's included
            // so now being included is "false" unless otherwise stated
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
            // if we have predicates, the burden of proof may change based on our filtering type
            if (!!!inclusive) {
                // exclusive filter, equivalent to a series of ANDs
                // break on soonest failure
                // innocent = true; redundant to set here due to `true` being default value
                for (
                    let predicateI = 0;
                    predicateI < predicates.length;
                    predicateI++
                ) {
                    innocent = predicates[predicateI].func(object);
                    if (innocent === false) break;
                }
            } else {
                // inclusive filter, equivalent to a series of logical ORs
                // let by all values that pass true on any of the predicates, exclude those that don't
                // inverts strategy to guilty until proven innocent so we set innocgit stence to false before continuing
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
    // Specs for predicateFromSpec are objects satisfying properties { field, predicate, threshold } to return a function Object => Boolean, parameterized on a field
    // NOTE: the default policy of this filter is to disallow all objects that could never satisfy it in theory (i.e. lacking properties required to duck-type)
    // This can be modified in two ways:
    //   * "notStrict": if it's important that all objects that the filter is applied to must have the property in question, then `notStrict` should be false.
    //      else if e.g. different components have slightly different properties such that a part of the filter applies to one component and not the other,
    //   * "strictCase": if the field has similar names but different casings, and we don't want it to fail a match (for instance `pvalue` and `pValue`), then this should be "false". else it is "true" and we take the field as-is.
    return {
        inclusive,
        func: (obj) => {
            
            // TODO: other ways of doing matches?
            // TODO: if I had to rework this... the case splitting is coming from having to substitute the proper field into the property
            //       would it be better if we just generated the equivalence class of strings, and iterated over them letting whatever passed out go through as the predicate?
            //       that doesn't sound right but this is whole prop mismatch thing somewhat inelegant
            console.assert(!!field || !!computedField, 'neither field or computedField are defined');

            let getter = !!computedField ? computedField : obj => get(obj, field); // NOTE: this technically supports nested fields.
            console.log(obj, getter, getter(obj))
            let data = getter(obj);
            let match = strictCase ? !!data : !!data // || !!datum[field.toLowerCase()]; // TODO: this doesn't work yet; would mean having to pass down the adjusted predicate match. should abstract into a separate function that returns the field if true:
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

// TODO
export function looseMatcher(object, fieldName, strictMatchCase = false) {
    // Generate potentially matching strings from fieldName
    // e.g. pValue => [pValue, p_value, pvalue, ...] etc
    // Check the object across each potential match
    // e.g. !!object["pValue"] || !!object["pvalue"] || !!object["pvalue"]
    // If any potential match is a key for a field in object, return that match
    // else return null
    // NOTE: is *eager*: in the unlikely event that several cases of this string are supported by the object at once, the one first matched on will win
}

/* NAMESPACE FUNCTIONS */
// These two *Namespace functions are used to handle prefixes an suffixes that different components might have in their application-specific representations of the data
// They are used to...
//
// * Reproject the data while filtering it:
//   this.namespacedData.filter(obj => {
//        let regularObj = decodeNamespace(obj, { prefix: `<namespace>:` });  // note that we include the delimiter here, but it can be defined separately as well
//        return this.filterFunction(regularObj);
//    });
//
//   You would do the above if the namespace didn't apply to all of the component's properties, since running an encode afterwards (which applies to all of the component's properties)
//   would add noise to the object and likely break the component.
//
// * Pull back the data into a regular-form object, filter it, and push in the object with its namespaces restored:
//   this.namespacedData
//        .map(obj => decodeNamespace(obj, { prefix: `<namespace>:` }))
//        .filter(this.filterFunction)
//        .map(obj => encodeNamespace(obj, { prefix: `<namespace>:` }));
//
//   You could do this if the namespace applied to all properties rather than just some of them, and if you were modifying your component's data by assignment via some previous state.
//
export function encodeNamespace(
    regularObject,
    { prefix = "", suffix = "", pDelimiter = "", sDelimiter = "" }
) {
    // take an object whose keys are "basic fields", (do not have any application-specific prefixes or suffixes), and add a given prefix or suffix to all of its keys

    // e.g. 'associations_src:pValue' has prefix 'associations_src:' in LocusZoom for the basic field pValue
    // if we're using encodeNamespace on an object with key `pValue` and give a prefix `associations_src:`, the result will be an object with the key `associations_src:pValue`
    // we use this function if we're working with a filter that modifies the object property keys before rendering it.
    // Both AssociationsTable and LocusZoom do this with different prefixes

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
    // NOTE! These can be strings OR instances of regular expressions (wrapped in `new RegExp(<pattern>)`)
    { prefix = "", suffix = "", pDelimiter = "", sDelimiter = "" }
) {
    // strip prefixes and suffixes from object properties given that they have them,
    // otherwise strip nothing and just return the object

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
