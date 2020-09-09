
export function filterFromPredicates(predicates, inclusive=false) {
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
                // inverts strategy to guilty until proven innocent so we set innocence to false before continuing
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

export function predicateFromSpec({ field, predicate, threshold }, { match = (datum, field) => !!datum[field] }) {

    // Specs for predicateFromSpec are objects satisfying properties { field, op, threshold } 
    // where `op` is a string in the `operationMapping` dictionary defined within the predicateFromSpec function
    // (these strings just look like typical primitive Javascript comparators, e.g. ===, <=, >=, <, > are all valid)
    // TODO alternately `op` can be the method itself, but do that kind of thing sparingly?

    // `match` is a function that checks the presence or absence of a field before applying an operation.
    // The predicate itself should always return false when there is no match

    // NOTE: the policy of this filter is to disallow all objects that could never satisfy it in theory (i.e. lacking properties required to duck-type)
    return datum => match(datum, field) ? predicate(datum[field], threshold) : false;
}

// Example of predicateFromSpec function that would work for LocusZoom?
// TODO: eliminate _src suffixes from fields to simplify matches on data instead? OR strip namespacing at the point of filtering?
    // A part of the problem is that this is included when the predicate is built, rather than when the predicate is used...
// predicateFromSpec(obj, { match: (obj, b) => matchLooseProp(obj, b, { suffix: '_src', caps: true, camel: true }) });

// TODO
export function looseMatch(datum, field, { ...opts }) {
    // // object contains any key which matches loosely on given match criterion
    // Object.keys(obj).forEach(key => {
    //     if (matchLooseString(key, b, { ...opts })) {
    //         return true;
    //     };
    // });
    // return false;
    // TODO: implement in full
    return ((datum, field) => !!datum[field])(datum, field)
}

// TODO
function matchLooseString(a, b, { suffix='', prefix='', caps=false, camel=false, dash=false}) {

    /*
    * Example of equivalencies
    * pValue === pvalue === ..._src:pvalue !== log_pvalue
    */

    // I was originally going to build regexes but that was too complicated
    // Instead we work off the assumption that inside of a complex string is a simple one waiting to arise
    // This simple string comes from normalizing the complex one to a simpler form
    // Normalization is done by stripping the target string of it

    // OR are regexes the way to go?
    // TODO: use formatters in here? e.g.
    // if (caps) Formatters.capitalize(a).match(new RegExp(b))
    // if (camel) Formatters.camel(a).match(new RegExp(b))
    // if (dash) Formatters.dashify(a).match(new RegExp(b))

    return true;
};