import { result } from "lodash";

/* FILTER-MAKING FUNCTIONS */
export function filterFromPredicates(predicates, inclusive=false) {
    // TODO: what about case of mixed inclusions and exclusions?
    return function filterFunction(object) {
        // Guilt is terminal: we break our investigation as soon as
        // we've found evidence that the object isn't innocent.
        // NOTE: Filter policy by default is innocent until proven guilty.
        // so in lieu of any predicates, remain truthy by default
        let innocence = true;
        if (predicates.length > 0) {
            // if we have predicates, the burden of proof may change based on our filtering type
            if (!inclusive) {

                // exclusive filter, equivalent to a series of ANDs
                // break on soonest failure
                // innocence = true; redundant to set here due to `true` being default value
                for (let predicateI = 0; predicateI < predicates.length; predicateI++) {
                    innocence = predicates[predicateI](object);
                    if (innocence === false) break;
                }
            } else {
                // inclusive filter, equivalent to a series of logical ORs
                // let by all values that pass true on any of the predicates, exclude those that don't
                // inverts strategy to guilty until proven innocent so we set innocgit stence to false before continuing
                innocence = false;
                for (let predicateI = 0; predicateI < predicates.length; predicateI++) {
                    innocence = predicates[predicateI](object);
                    if (innocence === true) break;
                }
            }
        }
        return innocence;
    }
}

export function predicateFromSpec({ field, predicate, threshold }, { notStrictMatch=false, strictCase=false }) {

    // Specs for predicateFromSpec are objects satisfying properties { field, predicate, threshold } to return a function Object => Boolean, parameterized on a field
    // NOTE: the default policy of this filter is to disallow all objects that could never satisfy it in theory (i.e. lacking properties required to duck-type)
    // This can be modified in two ways:
    //   * "notStrict": if it's important that all objects that the filter is applied to must have the property in question, then `notStrict` should be false.
    //      else if e.g. different components have slightly different properties such that a part of the filter applies to one component and not the other,
    //   * "strictCase": if the field has similar names but different casings, and we don't want it to fail a match (for instance `pvalue` and `pValue`), then this should be "false". else it is "true" and we take the field as-is.

    return (datum) => {
        // TODO: other ways of doing matches?
        // TODO: if I had to rework this... the case splitting is coming from having to substitute the proper field into the property
        //       would it be better if we just generated the equivalence class of strings, and iterated over them letting whatever passed out go through as the predicate?
        //       that doesn't sound right but this is whole prop mismatch thing somewhat inelegant
        let match = strictCase ? !!datum[field] : !!datum[field.toLowerCase()] || !!datum[field] ;
        if (match) {
            if (datum[field].constructor.name === 'Array') {
                return datum[field].some(el => predicate(el, threshold));
            } else {
                return predicate(datum[field], threshold);
            }
        } else {
            return notStrictMatch;
        }
        // return match ? predicate(datum[field], threshold) : notStrictMatch;
    }

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
export function encodeNamespace(regularObject, { prefix='', suffix='', pDelimiter='', sDelimiter='' }) {
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
    })
    return tempObject;
};

export function decodeNamespace(namespacedObject, { prefix='', suffix='', pDelimiter='', sDelimiter='' }) {
    // strip prefixes and suffixes from object properties given that they have them,
    // otherwise strip nothing and just return the object

    let tempObject = {};
    Object.entries(namespacedObject).forEach(entry => {
        const [key, value] = entry;
        // TODO: replace with disjoint regex?
        // for fun: regex crosswords https://regexcrossword.com
        const newKey = key.replace(prefix, '').replace(suffix, '')
            // TODO: using delimiters redundant/unecessary/confusing?
            // TODO: remove everything before delimiter
            .replace(pDelimiter, '')
            // TODO: remove everything after delimiter
            .replace(sDelimiter, '');
        tempObject[newKey] = value;
    })
    return tempObject;

};
