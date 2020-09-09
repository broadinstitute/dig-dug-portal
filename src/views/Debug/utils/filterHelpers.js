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
DONE:Alternately retool label tables
*/

export function filterFromPredicates(predicates) {
    // TODO: just use `_.overEvery` from Lodash instead?
    return function filterFunction(object) {
        // NOTE: Filter policy is innocent until proven guilty. 
        // Guilt is terminal: we break our investigation as soon as
        // we've found evidence that the object isn't innocent.
        let innocence = true;
        if (predicates !== []) {
            for (let predicateI = 0; predicateI < predicates.length; predicateI++) {
                innocence = predicates[predicateI](object);
                if (innocence === false) break;
            }
        }
        return innocence;
    }
}

export function predicateFromSpec({ field, op, threshold }, { match = (datum, field) => !!datum[field] }) {

    // Specs for predicateFromSpec are objects satisfying properties { field, op, threshold } 
    // where `op` is a string in the `operationMapping` dictionary defined within the predicateFromSpec function
    // (these strings just look like typical primitive Javascript comparators, e.g. ===, <=, >=, <, > are all valid)

    // `match` is a function that checks the presence or absence of a field before applying an operation.
    // The predicate should always return false

    // DONE: lookup/DISPATCH operation function for given `op` (unless `op` is also a function)
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
    const operation = operationMap[op];

    // NOTE: the policy of this filter is to disallow all objects that could never satisfy it in theory (ie lacking properties required). 
    // TODO: replace !!datum.field with loose matcher logic (capitaliation, dashes, prefixes and suffixes)
    return datum => match(datum, field) ? operation(datum[field], threshold) : false;
}

export function looseMatch() {

}