import { json } from "d3";
import queryString, { extract } from "query-string";
import { cloneDeep, merge, get } from "lodash";
import jsonQuery from "json-query";
const cachedFetch = (url, options) => {
    let cacheKey = url;

    let cached = sessionStorage.getItem(cacheKey);
    if (cached !== null) {
        let response = new Response(new Blob([cached]));
        return Promise.resolve(response);
    }

    return fetch(url, options).then((response) => {
        if (response.status === 200) {
            let ct = response.headers.get("Content-Type");
            if (ct && (ct.match(/application\/json/i) || ct.match(/text\//i))) {
                response
                    .clone()
                    .text()
                    .then((content) => {
                        sessionStorage.setItem(cacheKey, content);
                    });
            }
        }
        return response;
    });
};
let getBiolinkContext = async () =>
    fetch(
        "https://raw.githubusercontent.com/biolink/biolink-model/master/project/jsonld/biolink_model.context.jsonld"
    )
        .then((response) => response.json())
        .then((json) => json["@context"]);

let biolinkContextCache = {};
let bioLinkContext = (async () => {
    if (Object.keys(biolinkContextCache).length === 0)
        biolinkContextCache = await getBiolinkContext();
    return biolinkContextCache;
})();

const _prefix_synonyms = {
    reactome: "REACT",
};

const deserializeCurie = function (curie) {
    if (!!curie && typeof curie === "string" && curie.split(":").length === 2) {
        return [...curie.split(":")];
    } else return [];
};

const serializeCurie = function (prefix, id) {
    return `${prefix}:${id}`;
};

const stripPrefix = function (curie) {
    return deserializeCurie(curie)[1];
};

const extractCurie = function (uri, context) {
    if (!!context) {
        const entries_with_uri = Object.entries(context).filter((entry) =>
            uri.includes(entry[1])
        );
        if (entries_with_uri.length > 0) {
            const [prefix, uri_root] = entries_with_uri[0];
            const id = uri.replace(uri_root, "");
            return serializeCurie(prefix, id);
        } else return;
    } else return;
};

const resolveCurie = function (curie, context) {
    const [prefix, id] = deserializeCurie(curie);
    if (!!context && !!prefix && !!id) {



        let url = ``;
        if (
            typeof context[prefix] === "string" ||
            typeof context[prefix.toLowerCase()] === "string" ||
            typeof context[prefix.toUpperCase()] === "string"
        ) {
            if (!!context[prefix]) url = `${context[prefix]}${id}`;
            if (!!context[prefix.toLowerCase()])
                url = `${context[prefix.toLowerCase()]}${id}`;
            if (!!context[prefix.toUpperCase()])
                url = `${context[prefix.toUpperCase()]}${id}`;
        } else if (
            typeof context[prefix] === "object" ||
            typeof context[prefix.toLowerCase()] === "object" ||
            typeof context[prefix.toUpperCase()] === "object"
        ) {
            if (!!context[prefix] && !!context[prefix]["@id"])
                url = `${context[prefix]}${id}`;
            if (
                !!context[prefix.toLowerCase()] &&
                !!context[prefix.toLowerCase()]["@id"]
            )
                url = `${context[prefix.toLowerCase()]["@id"]}${id}`;
            if (
                !!context[prefix.toUpperCase()] &&
                !!context[prefix.toUpperCase()]["@id"]
            )
                url = `${context[prefix.toUpperCase()]["@id"]}${id}`;
        }

        return url;
    } else return ``;
};

const _looseMatchFinder = (key, synonyms = {}) => {
    const makeMatchExp = (key) => new RegExp(`^${key}$`, "i");

    let matchSet = [key];
    if (Object.keys(synonyms).length > 0) {
        matchSet = matchSet.concat(synonyms[key]);
    }

    let matchKeyExps = Array.from(new Set(matchSet)).map((key) => [
        key,
        makeMatchExp(key),
    ]);

    return (maybeMatchedKey) =>
        matchKeyExps.map((matchKeyExp) => ({
            key: matchKeyExp[0],
            isMatch: maybeMatchedKey.match(matchKeyExp[1]) != null,
        }));
};

const _looseMatchPredicate =
    (key, synonyms = {}) =>
    (maybeMatchedKey) => {
        const possibleMatches = _looseMatchFinder(
            key,
            synonyms
        )(maybeMatchedKey);
        return possibleMatches.some((maybeMatch) => maybeMatch.isMatch);
    };

const supportedPrefix = function (
    maybeSupportedPrefix,
    context,
    synonyms = _prefix_synonyms
) {


    if (!!maybeSupportedPrefix) {
        if (!!context[maybeSupportedPrefix]) return maybeSupportedPrefix;
        if (!!context[maybeSupportedPrefix.toLowerCase()])
            return maybeSupportedPrefix.toLowerCase();
        if (!!context[maybeSupportedPrefix.toUpperCase()])
            return maybeSupportedPrefix.toUpperCase();

        const match = _looseMatchPredicate(maybeSupportedPrefix, synonyms);
        for (let key in context) {
            if (match(key)) return key;
        }
    }

    return "";
};

const isSupportedPrefix = function (
    maybeIsPrefix,
    context,
    synonyms = _prefix_synonyms
) {
    return supportedPrefix(maybeIsPrefix, context, synonyms) !== "";
};


const ARS_API = "https://ars.transltr.io/ars/api/";

const tap = (id) => {
    console.log(id);
    return id;
};
const interrogate = (accessor) => (id) => {
    console.log(get(id, accessor));
    return tap(id);
};
const groupLogs =
    (groupName, func, collapse = true) =>
    (args) => {
        if (collapse) {
            console.groupCollapsed(groupName);
        } else {
            console.group(groupName);
        }
        const result = func(args);
        console.groupEnd();
        return result;
    };

async function messageARS(message, trace = null, callback = (id) => id) {
    console.log("message ars");
    let qs = queryString.stringify({ trace }, { skipNull: true });
    return await fetch(`${ARS_API}messages/${message}?${qs}`)
        .then((body) => body.json())
        .then(callback);
}

async function beginARSQuery(message) {
    console.log("begin query");
    try {
        return await fetch(`${ARS_API}submit`, {
            method: "POST",
            body: JSON.stringify(message),
        })
            .then((response) => response.json())
            .then(async (json) => await messageARS(json.pk, "y"));
    } catch (error) {
        throw error;
    }
}

async function _streamARAs(
    arsQuery,
    {
        onDone = (id) => id,
        onError = (id) => id,
        onUnknown = (id) => id,
        onRunning = (id) => id,
    },
    actorStatuses = new Map(),
    delay = 600
) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    console.log("stream step");
    let _actorStatuses = new Map(actorStatuses);
    arsQuery.children.forEach((el) =>
        _actorStatuses.set(el.actor.agent, el.status)
    );

    arsQuery.children.forEach((el) => tap(el.message));

    arsQuery.children.forEach((child) => {
        const {
            status,
            actor: { agent },
        } = child;
        if (actorStatuses.get(agent) !== _actorStatuses.get(agent)) {
            switch (status) {
                case "Done":
                    onDone(child);
                    break;
                case "Error":
                    onError(child);
                    break;
                case "Unknown":
                    onUnknown(child);
                    break;
                case "Running":
                    onRunning(child);
                    break;
                default:
                    console.error("Unknown Status Code!", status, agent, actor);
            }
        }
    });

    if (
        arsQuery.children
            .map((actor) => actor.status)
            .every((status) => status !== "Running")
    ) {
        return arsQuery;
    }

    return await messageARS(arsQuery.message, "y").then((aq) =>
        _streamARAs(
            aq,
            { onDone, onError, onUnknown, onRunning },
            _actorStatuses,
            delay
        )
    );
}


const getARAMessageEntry = async (ara) =>
    messageARS(ara.message).then((response) => [
        ara.actor.agent,
        response.fields.data.message,
    ]);

const getARAMessage = async (ara) =>
    getARAMessageEntry(ara).then((entry) => entry[1]);

const promiseSideEffect = (callback) => (promise) => async (event) =>
    promise(event).then(callback);

async function streamARSQuery(
    queryMessage,
    successCallback = console.log,
    errorCallback = console.error,
    unknownCallback = console.warn
) {

    const psed = promiseSideEffect(successCallback);
    const psee = promiseSideEffect(errorCallback);
    const pseu = promiseSideEffect(unknownCallback);
    const gme = getARAMessageEntry;

    return await beginARSQuery(queryMessage).then((arsQuery) =>
        _streamARAs(arsQuery, {
            onDone: psed(gme),
            onError: psee(gme),
            onUnknown: pseu(gme),
        })
    );
}

function _hasResults(message) {
    if (Object.keys(message).length > 0) {
        if (!!message.results && message.results.length > 0) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

const printResultsFromSources =
    (sources = []) =>
    (entry) => {
        const [agent, message] = entry;
        if (sources.length === 0 || sources.includes(agent)) {
            if (_hasResults(message)) {
                console.log(agent, message);
            }
        }
    };

async function printResultsForSources(message, sources = []) {
    return await streamARSQuery(message, printResultsFromSources(sources));
}

const updateResultsFromSources =
    (sources = [], assignableList = []) =>
    (entry) => {
        const [agent, message] = entry;
        if (sources.length === 0 || sources.includes(agent)) {
            if (_hasResults(message)) {
                assignableList.push(...message.results);
            }
        }
        return assignableList;
    };

async function updateResultsForSources(
    message,
    sources = [],
    assignableList = []
) {
    return await streamARSQuery(
        message,
        updateResultsFromSources(sources, assignableList)
    );
}

const knowledgeGraphFromSources =
    (sources = [], assignableList = []) =>
    (entry) => {
        const [agent, message] = entry;
        if (sources.length === 0 || sources.includes(agent)) {
            if (_hasResults(message)) {
                assignableList.push(message.knowledge_graph);
            }
        }
        return assignableList;
    };

async function knowledgeGraphsForSources(
    message,
    sources = [],
    assignableList = []
) {
    return await streamARSQuery(
        message,
        knowledgeGraphFromSources(sources, assignableList)
    );
}


import YAML from "yaml";
let getBiolinkModel = async () =>
    fetch(
        "https://raw.githubusercontent.com/biolink/biolink-model/master/biolink-model.yaml"
    )
        .then((response) => response.text())
        .then((text) => YAML.parse(text));

let biolinkModelCache = {};
let biolinkModel = (async () => {
    if (Object.keys(biolinkModelCache).length === 0)
        biolinkModelCache = await getBiolinkModel();
    return biolinkModelCache;
})();

const categoricalMatch = (instance, concept, biolinkML, maxDepth = 0) => {
    if (
        !!biolinkML.classes[instance] &&
        biolinkML.classes[instance].is_a === concept
    )
        return true;
    return false;
};

const findSlotsForDomainRange = (
    { domain = "", range = "" },
    biolinkModel,
    matchCategory = false
) => {
    const biolinkModelSlotEntries = Object.entries(biolinkModel.slots);
    return biolinkModelSlotEntries
        .filter((entry) => {
            if (
                (!!domain && !!entry[1].domain) ||
                (!!range && !!entry[1].range)
            ) {
                return (
                    (entry[1].domain === domain && entry[1].range === range) ||
                    entry[1].domain === domain ||
                    entry[1].range === range
                );
            } else false;
        })
        .map((entry) => entry[0]);
};

const findConceptByPrefix = (prefix, biolinkModel) => {
    return Object.keys(biolinkModel.classes).filter((className) => {
        const category = biolinkModel.classes[className];
        return !!category.id_prefixes && category.id_prefixes.includes(prefix);
    });
};

const predicateHierarchy = () => {
    throw new Error("Unimplemented");
};

let curieLabelCache = new Map();
const curieLabel = async (rawCurie) => {
    const [prefix, id] = deserializeCurie(rawCurie);
    if (!!prefix && !!id) {
        const curie = serializeCurie(prefix.toUpperCase(), id);
        let qs = queryString.stringify({ curie });
        if (!curieLabelCache.has(curie)) {
            try {
                let label = await cachedFetch(
                    `https://nodenormalization-sri.renci.org/get_normalized_nodes?${qs}`
                )
                    .then((response) => response.json())
                    .then((json) =>
                        json[curie] !== null && !!json[curie].id.label
                            ? json[curie].id.label
                            : curie
                    )
                    .then((result) => curieLabelCache.set(curie, result));
            } catch (e) {
                curieLabelCache.set(curie, rawCurie);
            }
        }
        return curieLabelCache.get(curie);
    } else {
        curieLabelCache.set(rawCurie, rawCurie);
        return rawCurie;
    }
};


const curieForGene = async (geneSymbol) => {
    return await fetch(`https://mygene.info/v3/query?q=${geneSymbol}`)
        .then((response) => response.json())
        .then((json) => `NCBIGENE:${json.hits[0].entrezgene}`);
};

const associations = function (biolinkModel) {
    if (!!biolinkModel) {
        return biolinkModel.classes.filter((cls) => cls.is_a === "association");
    } else {
        return [];
    }
};

let COUNTER_ID = 1;
const biolinkQueryGraph = function (
    subjectCurie,
    { subject, predicate, object }
) {
    const uuid = function (prefix) {
        const id = `${!!prefix ? prefix : ""}_${Date.now()}_${COUNTER_ID}`;
        COUNTER_ID += 1;
        return id;
    };
    const sid = uuid("s");
    const oid = uuid("o");
    const eid = uuid("e");
    return {
        query_graph: {
            nodes: {
                [sid]: {
                    id: subjectCurie,
                    category: subject,
                },
                [oid]: {
                    category: object,
                },
            },
            edges: {
                [eid]: {
                    subject: sid,
                    object: oid,
                    predicate: predicate,
                },
            },
        },
    };
};

export default {
    query: streamARSQuery,
    makeQueryGraph: biolinkQueryGraph,
    queryUtils: {
        getARAMessageEntry,
        getARAMessage,
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
            associations,
        },
    },
    normalize: {
        curieLabel,
        curieForGene,
    },
};

const messageTRAPI =
    (url) =>
    (endpoint) =>
    async (body = "", method = "GET") => {
        if (url.charAt(url.length - 1) === "/") {
            url = url.slice(0, url.length - 1);
        }

        if (endpoint === "query") {
            method = "POST";
        }

        let request = {
            method,
        };

        if (body !== "") {
            request["body"] = body;
        }

        return fetch("https://api.bte.ncats.io/v1/predicates", {
            headers: {
                accept: "application/json",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
                "sec-gpc": "1",
            },
            referrerPolicy: "strict-origin-when-cross-origin",
            body: null,
            method: "GET",
            mode: "cors",
            credentials: "omit",
        });
    };

messageTRAPI("https://api.bte.ncats.io/v1/")("query")({
    message: {
        ...biolinkQueryGraph("MONDO:0005737", {
            subject: "biolink:Disease",
            object: "biolink:ChemicalSubstance",
        }),
    },
});

async function queryTRAPI(url, message, callback) {
    return messageTRAPI(url)("query")(message).then(callback);
}
