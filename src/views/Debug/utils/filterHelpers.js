/* 
Also necessary is a filter-function library
- DONE: Assume AoS format: then => pattern match to prop shapes
    * applyFilter HoF?
    * Ideally, the filter function will be able to gracefully handle all cases given (fails quietly and always returns something, even if it's the original data)
        * PROBLEM: The programmer must guarantee the shape of the data is relevant to the filter function! how do we want to preserve this contract?
            * PO: Force strict option using PropCheck
                * BUT: baseline pattern matching is loose-goosey
- TODO: Implement loose token matching for heuristic filtering on prop names?
    NOTE: camel-case causes an ambiguity here!
    opts?
  - Loose matching between lower case, uppercase, and camel-case
  - Loose matching between _, -, whitespace and camelCase?
  - Loose matching with prefixes (e.g. `_src`)

We could also use a style-guide for labels and a meeting for getting it implemented
DONE: Alternately retool label tables
*/

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

export function predicateFromSpec({ field, op, threshold }, { match = (datum, field) => !!datum[field] }) {

    // Specs for predicateFromSpec are objects satisfying properties { field, op, threshold } 
    // where `op` is a string in the `operationMapping` dictionary defined within the predicateFromSpec function
    // (these strings just look like typical primitive Javascript comparators, e.g. ===, <=, >=, <, > are all valid)
    // TODO alternately `op` can be the method itself, but do that kind of thing sparingly?

    // `match` is a function that checks the presence or absence of a field before applying an operation.
    // The predicate should always return false

    // DONE: lookup/DISPATCH operation function for given `op` (unless `op` is also a function)
    let operation = id => id;
    if (typeof op === 'string') {
        // TODO: is there an advantage to using Lodash operations instead?
        const operationMap = {
            "==": (a, b) => a === b,  // we know what they mean, anyone who means `==` would want javascript operational semantics versus domain-semantics of numbers or lexigraphical information. unlikely for scientists. we could alternately model this case as a hard error.
            "===": (a, b) => a === b,
            ">": (a, b) => a > b,
            ">=": (a, b) => a >= b,
            "<": (a, b) => a < b,
            "<=": (a, b) => a <= b,
            // NOTE: if we use these abbreviations as keys, they translate directly to HTML char codes after attaching appropriate suffix/prefix
            // would allow us to compute an adequate label even more extenisvely in other cases where we use the variable use for `op`
            "eq": (a, b) => a === b,
            "gt": (a, b) => a > b,
            "gte": (a, b) => a >= b,
            "lt": (a, b) => a < b,
            "lte": (a, b) => a <= b,
        }
        operation = operationMap[op];
    }
    // else if (typeof op === 'function') {
    //     operation = op;
    // };

    // NOTE: the policy of this filter is to disallow all objects that could never satisfy it in theory (i.e. lacking properties required to duck-type)
    return datum => match(datum, field) ? operation(datum[field], threshold) : false;
}

// Example of predicateFromSpec function that would work for LocusZoom?
// TODO: eliminate _src suffixes from fields to simplify matches on data instead? OR strip namespacing at the point of filtering?
    // A part of the problem is that this is included when the predicate is built, rather than when the predicate is used...
// predicateFromSpec(obj, { match: (obj, b) => matchLooseProp(obj, b, { suffix: '_src', caps: true, camel: true }) });

// TODO
function matchLooseProp(obj, b, { ...opts }) {
    // object contains any key which matches loosely on given match criterion
    Object.keys(obj).forEach(key => {
        if (matchLooseString(key, b, { ...opts })) {
            return true;
        };
    });
    return false;
}

// TODO
function matchLooseString(a, b, { suffix='', prefix='', caps=false, camel=false, dash=false}) {

    /*
    * Data
    * pValue === pvalue === pvalue_src !== log_pvalue
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
}