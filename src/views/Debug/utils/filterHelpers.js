/* 
Also necessary is a filter-function library
- Assume AoS format: then => pattern match to prop shapes
    * applyFilter HoF?
    * Ideally, the filter function will be able to gracefully handle all cases given (fails quietly and always returns something, even if it's the original data)
        * PROBLEM: The programmer must guarantee the shape of the data is relevant to the filter function! how do we want to preserve this contract?
            * PO: Force strict option using PropCheck
                * BUT: baseline pattern matching is loose-goosey
- Implement loose token matching for heuristic filtering on prop names?
    NOTE: camel-case causes an ambiguity here!
    opts?
  - Loose matching between lower case, uppercase, and camel-case
  - Loose matching between _, -, whitespace and camelCase?
  - Loose matching with prefixes (e.g. `_src`)

We could also use a style-guide for labels and a meeting for getting it implemented
Alternately retool label tables
*/

// First observation: functions are not composable directly at runtime (in JS). 
// So they have to be defined by mapping data into a higher order function.
const makeFilter = filterTemplate => compilePredicateFunction(filterTemplate);

['field', 'value', 'op']