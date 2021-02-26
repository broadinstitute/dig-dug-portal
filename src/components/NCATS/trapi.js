import { json } from "d3";
import queryString, { extract } from "query-string"
import { cloneDeep, merge } from "lodash"

let getBiolinkContext = (async () => fetch('https://raw.githubusercontent.com/biolink/biolink-model/master/context.jsonld')
    .then(response => response.json())
    .then(json => json['@context'])
);

// TODO: Refactor to Object
let biolinkContextCache = {};
let bioLinkContext = (async () => {
    if (Object.keys(biolinkContextCache).length === 0) biolinkContextCache = await getBiolinkContext();
    return biolinkContextCache;
})();

const _prefix_synonyms = {
    'reactome': 'REACT',
}

const deserializeCurie = function(curie) {
    if (!!curie && curie.split(":").length === 2) {  // prevent misidentifying IDs with multiple colons as curies
        return [...curie.split(":")];
    } else return []; // TODO: error/undefined behavior
}

const serializeCurie = function(prefix, id) {
    return `${prefix}:${id}`
}

const stripPrefix = function(curie) {
    return deserializeCurie(curie)[1];
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
    const [prefix, id] = deserializeCurie(curie);

    if (!!context && !!prefix && !!id) {
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

        // TODO: problem: don't know which case:
        let url=``;
        if (!!context[prefix.toLowerCase()]) url = `${context[prefix.toLowerCase()]}${id}`;
        if (!!context[prefix.toUpperCase()]) url = `${context[prefix.toUpperCase()]}${id}`;

        return url;

    } else return ``; // TODO: error/undefined behavior
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
    // This return type is what allows us to replace invalid prefixes with their closest match
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

const _looseMatchPredicate = (key, synonyms={}) => maybeMatchedKey => {
    const possibleMatches = _looseMatchFinder(key, synonyms)(maybeMatchedKey)
    return possibleMatches.some(maybeMatch => maybeMatch.isMatch)
}
// Tests: _looseMatchPredicate ("true" means pass)
// - Any key matches onto itself
    //  console.log(_looseMatchPredicate('reactome')('reactome') === true)
// - Any key matches onto a random casing of itself
    //  console.log(_looseMatchPredicate('rEaCtoMe')('reactome') === true)
    //  console.log(_looseMatchPredicate('reactome')('rEaCtoMe') === true)
// - Any key matches onto a known synonym of itself and its random casings
//   - TODO: Synonyms should be reflexive?
    //  console.log(_looseMatchPredicate('REACT', _prefix_synonyms)('reactome') === true)
    //  console.log(_looseMatchPredicate('reactome', _prefix_synonyms)('REACT') === true)
// - No key matches onto any subset or superset of itself unless it's a known synonym
    //  console.log(_looseMatchPredicate('reactomeRasdfsa')('reactome') === false)
// - No key matches onto a different string
    //  console.log(_looseMatchPredicate('wikipathways')('reactome') === false)
    //  console.log(_looseMatchPredicate('reactome')('wikipathways') === false)


const supportedPrefix = function(maybeSupportedPrefix, context, synonyms=_prefix_synonyms) {

    // For each key in the context,
    // if there exists a loosematch for a maybeSupportedPrefix, return the first matched prefix

    // NOTE: Any prefix is synonymous with itself
    // e.g. reactome => REACT, wikipathways => WIKIPATHWAYS, GO => GO

    // skip the search if possible
    if (!!context && !!context[maybeSupportedPrefix]) return maybeSupportedPrefix;

    // even if the context doesn't directly support the prefix, there might be an analogous one (with different capitalization or a synonym)
    const match = _looseMatchPredicate(maybeSupportedPrefix, synonyms);
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



/* ARS Messaging */

const ARS_API = "https://ars.transltr.io/ars/api/"

// Basic ARS query
async function messageARS(message, trace=null) {
    let qs = queryString.stringify({ trace }, { skipNull: true });
    return await fetch(`${ARS_API}messages/${message}?${qs}`).then(body => body.json())
}

// ARS Query initializer
// Needs to be executed before the ARS can be messaged for its results
async function beginARSQuery(message) {
    return await fetch(`${ARS_API}submit`, {
        method: 'POST',
        body: JSON.stringify(message)
    })
    .then(response => response.json())
    .then(async json => await messageARS(json.pk, 'y'))
}

// Stream Control Function
// "Reads out" the ARS Query status over time and gets
// Akin to reading out the outputs from a foreign process
// Alternate control functions are possible (e.g. ones based on polling, or that exit earlier, or only) but this one will be commonplace for map-reduce workflows
async function _streamARAs(arsQuery, { onDone=id=>id, onError=id=>id, onUnknown=id=>id, onRunning=id=>id }, actorStatuses=new Map(), delay=600) {
    await new Promise(resolve => setTimeout(resolve, delay));

    // update the statuses with the latest information
    let _actorStatuses = new Map(actorStatuses);
    arsQuery.children.forEach(el => _actorStatuses.set(el.actor.agent, el.status));

    // check the previous status against the current status, and only handle when there has been a change
    arsQuery.children.forEach(child => {
        const { status, actor: { agent } } = child;
        if (actorStatuses.get(agent) !== _actorStatuses.get(agent)) {
            switch(status) {
                case 'Done': onDone(child); break;
                case 'Error': onError(child); break;
                case 'Unknown': onUnknown(child); break;
                case 'Running': onRunning(child); break;
                default: console.error('Unknown Status Code!', status, agent, actor)
            }
        }
    });

    // terminate after no new changes after delay and all children are listed as not running
    if (arsQuery.children.map(actor => actor.status).every(status => status !== "Running")) {
        // as long as delay > expected time for any individual ARA to contribute its result after a another ARA has started providing its result,
        // then the query should complete with all ARAs being called
        return arsQuery;
    }

    return await messageARS(arsQuery.message, 'y').then(aq => _streamARAs(aq, { onDone, onError, onUnknown, onRunning }, _actorStatuses, delay));
}

/* ARS Response Parsing */

// For an ARA message from the ARS, create an entry [<agent name>, <results>]
// e.g. if you take the children from an ARS Query, it can be used to create a dictionary of ARAs and their results
const getARAMessageEntry = async ara => messageARS(ara.message).then(response => [ara.actor.agent, response.fields.data.message]);

// Get the only results from an entry [<agent name>, <results>]
// 2021-02-09: The reason why we construct an entry function before the result function is that if the result function is used without the trace,
// it loses track of the actor metadata (like the agent name) in exchange for the query results.
const getARAMessage = async ara => getARAMessageEntry(ara).then(entry => entry[1]);

// Helper Function
// Make it possible to specify side-effects for a given promise without knowing what the side-effect is ahead of time
// i.e. can make template functions for promises without side-effects
const promiseSideEffect = callback => promise => async event => promise(event).then(callback);   // TODO promiseSideEffect(getARAResultEntry, console.log) OR promiseSideEffect(console.log)(getARAResultEntry)

// Query
// Query the ARS and evaluate the stream of successful ARA results using the callback
async function streamARSQuery(queryMessage, successCallback=console.log, errorCallback=console.error, unknownCallback=console.warn) {
    /*
    Example Query:
    {
        "message": {
            "query_graph": {
                "edges": {
                    "e00": {
                        "subject": "n00",
                        "object": "n01",
                        "predicate": "biolink:gene_associated_with_condition"
                    }
                },
                "nodes": {
                    "n00": {
                        "id": "NCBIGene:1803",
                        "category": "biolink:Gene"
                    },
                    "n01": {
                        "category": "biolink:Disease"
                    }
                }
            }
        }
    };
    */

    // wrap the callbacks in functions that will inject them after a given promise
    // abbreviations are given mainly for readability's sake
    const psed = promiseSideEffect(successCallback);
    const psee = promiseSideEffect(errorCallback);
    const pseu = promiseSideEffect(unknownCallback);
    const gme = getARAMessageEntry;

    // begin the ARS Query and handle the results as a stream
    return await beginARSQuery(queryMessage)
        .then(arsQuery => _streamARAs(arsQuery, {
                onDone: psed(gme),
                onError: psee(gme),
                onUnknown: pseu(gme)
            }))
}

// Helper Function
// Check if the message from an ARA has results or not
function _hasResults(message) {
    if (Object.keys(message).length > 0) {
        if (!!message.results && message.results.length > 0) {
            return true
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// Callback
// Log only the results from agents whose names are given in "sources"
// e.g. printResultsFromSources(['kp-genetics']) will return only entries with the name 'kp-genetics', when paired with `getARAMessageEntry`
const printResultsFromSources = (sources=[]) => (entry) => {
    const [agent, message] = entry;
    if (sources.length === 0 || sources.includes(agent)) {
        if(_hasResults(message)) {
            console.log(agent, message)
        }
    }
}

// Query
// Stream out the results from successful ARAs to console
async function printResultsForSources(message, sources=[]) {
    return await streamARSQuery(message, printResultsFromSources(sources));
}

// Callback
const updateResultsFromSources = (sources=[], assignableList=[]) => (entry) => {
    const [agent, message] = entry;
    if (sources.length === 0 || sources.includes(agent)) {
        if(_hasResults(message)) {
            assignableList.push(...message.results);
        }
    } return assignableList;
}

// Query
async function updateResultsForSources(message, sources=[], assignableList=[]) {
    return await streamARSQuery(message, updateResultsFromSources(sources, assignableList));
}

// Callback
const knowledgeGraphFromSources = (sources=[], assignableList=[]) => (entry) => {
    const [agent, message] = entry;
    if (sources.length === 0 || sources.includes(agent)) {
        if(_hasResults(message)) {
            assignableList.push(message.knowledge_graph);
        }
    } return assignableList;
}

// Query
async function knowledgeGraphsForSources(message, sources=[], assignableList=[]) {
    return await streamARSQuery(message, knowledgeGraphFromSources(sources, assignableList))
}

/* BIOLINK MODEL QUERIES */
// https://raw.githubusercontent.com/biolink/biolink-model/master/biolink-model.yaml



import YAML from "yaml"
let getBiolinkModel = (async () => fetch('https://raw.githubusercontent.com/biolink/biolink-model/master/biolink-model.yaml')
    .then(response => response.text())
    .then(text => YAML.parse(text))
);

// TODO: Refactor to Object
let biolinkModelCache = {};
let biolinkModel = (async () => {
    if (Object.keys(biolinkModelCache).length === 0) biolinkModelCache = await getBiolinkModel();
    return biolinkModelCache;
})();

const categoricalMatch = (instance, concept, biolinkML, maxDepth=0) => {
    if (!!biolinkML.classes[instance] && biolinkML.classes[instance].is_a === concept) return true;
    return false;
    // TODO
    // else if (maxDepth > 0) categoricalMatch(instance, biolinkML.classes[concept].is_a)
}


const findSlotsForDomainRange = ({ domain='', range='' }, biolinkModel, matchCategory=false) => {

    let _domain = domain.toLowerCase();
    let _range = range.toLowerCase();

    return Object.keys(biolinkModel.slots).filter(slotName => {

        const slot = biolinkModel.slots[slotName];

        if (!!slot.domain && !!slot.range) {
            if (_domain != '' && _range != '') {
                return slot.domain === _domain && slot.domain === _range;
            } else if (_domain != '') {
                return slot.domain === _domain // TODO: || matchCategory && categoricalMatch(_domain);
            } else if (_range != '') {
                return slot.range === _range // TODO: || matchCategory && categoricalMatch(_range);
            }
        }

    })
};

const findConceptByPrefix = (prefix, biolinkModel) => {
    return Object.keys(biolinkModel.classes).filter(className => {
        const category = biolinkModel.classes[className];
        return !!category.id_prefixes && category.id_prefixes.includes(prefix)
    })
};

const predicateHierarchy = () => {
    throw new Error("Unimplemented")
}

let curieLabelCache = new Map();
const curieLabel = async (rawCurie) => {
    const [ prefix, id ] = deserializeCurie(rawCurie);
    const curie = serializeCurie(prefix.toUpperCase(), id);
    let qs = queryString.stringify({ curie });
    if (!curieLabelCache.has(curie)) {
        const label = await fetch(`https://nodenormalization-sri.renci.org/get_normalized_nodes?${qs}`)
            .then(response => response.json())
            .then(json => json[curie] !== null ? json[curie].id.label : curie);
        curieLabelCache.set(curie, label)
    }
    return curieLabelCache.get(curie);
}

let geneForCurieCache = new Map();
const geneForCurie = async (rawCurie) => {
    const [ prefix, id ] = deserializeCurie(rawCurie);
    const curie = serializeCurie(prefix.toUpperCase(), id);
    let qs = queryString.stringify({ curie });
    if (!curieLabelCache.has(curie)) {
        const label = await fetch(`https://nodenormalization-sri.renci.org/get_normalized_nodes?${qs}`)
            .then(response => response.json())
            .then(json => json[curie] !== null ? json[curie].id.label : curie);
        curieLabelCache.set(curie, label);
    }
    return curieLabelCache.get(curie);
}

const curieForGene = async (geneSymbol) => {
    return await fetch(`https://mygene.info/v3/query?q=${geneSymbol}`)
        .then(response => response.json())
        // NOTE: There often are several hits, with non-overlapping data associated with them in the rest of the system
        // For simplicity we'll just take the top-scoring hit
        .then(json => `NCBIGENE:${json.hits[0].entrezgene}`) // little known fact: NCBI Genes are Entrez Genes
}

const associations = function(biolinkModel) {
    console.log(biolinkModel)
    if (!!biolinkModel) {
        return biolinkModel.classes.filter(cls => cls.is_a === 'association')
    } else {
        return [];
    }
}

export default {
    query: streamARSQuery,
    queryUtils: {
        getARAMessageEntry,
        getARAMessage
    },
    callback: {
        updateResultsFromSources,
        printResultsFromSources,
        knowledgeGraphFromSources,
    },
    queries: {
        updateResultsForSources,
        printResultsForSources,
        knowledgeGraphsForSources,
    },
    identifiers: {
        context: bioLinkContext,
        bioLinkSynonyms: _prefix_synonyms,
        deserializeCurie,
        serializeCurie,
        extractCurie,
        resolveCurie,
        supportedPrefix,
        isSupportedPrefix,
        _stripPrefix: stripPrefix,
    },
    model: {
        biolinkModel,
        findSlotsForDomainRange,
        findConceptByPrefix,
        predicateHierarchy,
        categoricalMatch,
        type: {
            associations
        },
    },
    normalize: {
        curieLabel,
        geneForCurie,
        curieForGene,
    }
}
