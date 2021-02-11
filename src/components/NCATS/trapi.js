let getBiolinkContext = (async () => fetch('https://raw.githubusercontent.com/biolink/biolink-model/master/context.jsonld')
    .then(response => response.json())
    .then(json => json['@context'])
);

let bioLinkContext = (async () => await getBiolinkContext())();

const _prefix_synonyms = {
    'reactome': 'REACT',
}

const _looseMatchFinder = (key, synonyms={}) => {
    // match onto any combination of cases
    const makeMatchExp = key => new RegExp(`^${key}$`, 'i');

    // calculate a match
    // 1) produce match set
    // 1a) add the key to match set
    // 1b) add known synonyms to match set
    let matchSet = [key];
    if (Object.keys(synonyms).length > 0) {
        matchSet = matchSet.concat(synonyms[key]);
    }

    // TODO: Rewrite to use filter and economize these loops into a single step?
    // 2) produce regexps for match set
    // 3) make predicate for matches
    let matchKeyExps = Array.from(new Set(matchSet)).map(key => [key, makeMatchExp(key)]);

    // Return isMatch and the Match (e.g. key => synonym or itself if matched)
    // This return type is what allows us
    return (maybeMatchedKey) => matchKeyExps.map(matchKeyExp => ({
            key: matchKeyExp[0],
            isMatch: maybeMatchedKey.match(matchKeyExp[1]) != null
    }));

}
// TODO: Tests: _looseMatchFinder ("true" means pass)
// - Any key matches onto itself
// - Any key matches onto a random casing of itself
// - Any key matches onto a known synonym of itself and its random casings
// - No key matches onto any subset or superset of itself unless it's a known synonym
// - No key matches onto a different string

const _looseMatchP = (key, synonyms={}) => maybeMatchedKey => {
    const possibleMatches = _looseMatchFinder(key, synonyms)(maybeMatchedKey)
    // console.log('possibleMatches', possibleMatches, 'for maybeMatchedKey', JSON.stringify(maybeMatchedKey), 'on key', JSON.stringify(key), possibleMatches.some(maybeMatch => maybeMatch.isMatch))
    return possibleMatches.some(maybeMatch => maybeMatch.isMatch)
}

const supportedPrefix = function(maybeSupportedPrefix, context, synonyms=_prefix_synonyms) {

    // For each key in the context,
    // if there exists a loosematch for a maybeSupportedPrefix, return the first matched prefix
        // NOTE: Any prefix is synonymous with itself
    // e.g. reactome => REACT, wikipathways => WIKIPATHWAYS, GO => GO

    // skip the search if possible
    if (!!context && !!context[maybeSupportedPrefix]) return maybeSupportedPrefix;

    // even if the context doesn't directly support the prefix, there might be an analogous one (with different capitalization or a synonym)
    const match = _looseMatchP(maybeSupportedPrefix, synonyms);
    for (let key in context) {
        if (match(key)) return key;
    }

    return '';

}

const isSupportedPrefix = function(maybeIsPrefix, context, synonyms=_prefix_synonyms) {
    // For each key in the context, check if the given prefix loose matches any of them
    // equivalent to the success of a search for a prefix or its synonym's existence within a context
    return supportedPrefix(maybeIsPrefix, context, synonyms) !== '';
}

// Tests: _looseMatchP ("true" means pass)
// - Any key matches onto itself
    //  console.log(_looseMatchP('reactome')('reactome') === true)
// - Any key matches onto a random casing of itself
    //  console.log(_looseMatchP('rEaCtoMe')('reactome') === true)
    //  console.log(_looseMatchP('reactome')('rEaCtoMe') === true)
// - Any key matches onto a known synonym of itself and its random casings
//   - TODO: Synonyms should be reflexive?
    //  console.log(_looseMatchP('REACT', _prefix_synonyms)('reactome') === true)
    //  console.log(_looseMatchP('reactome', _prefix_synonyms)('REACT') === true)
// - No key matches onto any subset or superset of itself unless it's a known synonym
    //  console.log(_looseMatchP('reactomeRasdfsa')('reactome') === false)
// - No key matches onto a different string
    //  console.log(_looseMatchP('wikipathways')('reactome') === false)
    //  console.log(_looseMatchP('reactome')('wikipathways') === false)

const deserializeCurie = function(curie) {
    if (!!curie && curie.split(":").length > 1) {
        return [...curie.split(":")];
    } else return; // TODO: error/undefined behavior
}

const serializeCurie = function(prefix, id) {
    return `${prefix}:${id}`
}

const extractCurie = function(uri, context) {
    if (!!context) {
        const entries_with_uri = Object.entries(context).filter(entry => uri.includes(entry[1]))
        if (entries_with_uri.length > 0) {
            const [prefix, uri_root] = entries_with_uri[0]
            const id = uri.replace(uri_root, '');
            return serializeCurie(prefix, id)
        } else return; // TODO: error/undefined beavior
    } else return;
}

const resolveCurie = function(curie, context) {
    if (!!context && typeof deserializeCurie(curie) !== 'undefined') {

        const [prefix, id] = deserializeCurie(curie);

        // NOTE: There's the question of whether or not we want to defend the validity of the prefix inside this function
        // I've decided against it (it loses symmetry with 'extractCurie' if we add too much logic to this function),
        // But I leave the code for future reference

        // if prefix given is supported (in a loosematch), use the synonym or itself
        // if the prefix synonym is empty, the prefix is unsupported and the curie can't be resolved
        // const maybeSupportedPrefix = supportedPrefix(prefix, context, synonyms);
        // const haveSupportedPrefix = maybeSupportedPrefix !== '';
        // if (haveSupportedPrefix) {
        //     return `${context[maybeSupportedPrefix]}${id}`;
        // }

        return `${context[prefix]}${id}`;


    } else return ``; // TODO: error/undefined behavior
}

// Test
getBiolinkContext().then(context => console.log(
    extractCurie(resolveCurie(`GO:0001889`, context), context)
))

export default {
    context: bioLinkContext,
    bioLinkSynonyms: _prefix_synonyms,
    getContext: getBiolinkContext,
    deserializeCurie,
    serializeCurie,
    extractCurie,
    resolveCurie,
    supportedPrefix,
    isSupportedPrefix,
}
