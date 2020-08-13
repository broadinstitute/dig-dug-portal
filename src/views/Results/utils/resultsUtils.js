import _ from "lodash"
// Local copy of http://<BIOINDEX>/api/bio/indexes on Aug 13 2020
// TODO: convert into an API call that loads on startup
// TODO: can schemas provide their own property shapoes?
// TODO: normalize on _____
export const BIOINDEX_SCHEMA = {
    "count": 18,
    "data": [
      {
        "index": "annotated-regions",
        "built": "2020-07-30T07:40:23",
        "schema": "annotation,chromosome:start-end",
        "query": {
          "keys": [
            "annotation"
          ],
          "locus": true
        }
      },
      {
        "index": "associations",
        "built": "2020-08-01T13:02:50",
        "schema": "phenotype,chromosome:position",
        "query": {
          "keys": [
            "phenotype"
          ],
          "locus": true
        }
      },
      {
        "index": "credible-regions",
        "built": "2020-07-30T00:08:15",
        "schema": "phenotype,credibleSetId",
        "query": {
          "keys": [
            "phenotype",
            "credibleSetId"
          ],
          "locus": false
        }
      },
      {
        "index": "credible-sets",
        "built": "2020-07-29T23:03:46",
        "schema": "phenotype,chromosome:start-end",
        "query": {
          "keys": [
            "phenotype"
          ],
          "locus": true
        }
      },
      {
        "index": "credible-variants",
        "built": "2020-07-29T23:06:55",
        "schema": "phenotype,credibleSetId",
        "query": {
          "keys": [
            "phenotype",
            "credibleSetId"
          ],
          "locus": false
        }
      },
      {
        "index": "dataset-associations",
        "built": "2020-08-01T18:39:55",
        "schema": "dataset,phenotype",
        "query": {
          "keys": [
            "dataset",
            "phenotype"
          ],
          "locus": false
        }
      },
      {
        "index": "effector-genes",
        "built": null,
        "schema": "phenotype,dataset",
        "query": {
          "keys": [
            "phenotype",
            "dataset"
          ],
          "locus": false
        }
      },
      {
        "index": "gene",
        "built": "2020-07-29T23:01:48",
        "schema": "name",
        "query": {
          "keys": [
            "name"
          ],
          "locus": false
        }
      },
      {
        "index": "gene-associations",
        "built": null,
        "schema": "gene",
        "query": {
          "keys": [
            "gene"
          ],
          "locus": false
        }
      },
      {
        "index": "genes",
        "built": "2020-07-31T00:39:43",
        "schema": "chromosome:start-end",
        "query": {
          "keys": [],
          "locus": true
        }
      },
      {
        "index": "global-enrichment",
        "built": "2020-07-30T01:22:29",
        "schema": "phenotype",
        "query": {
          "keys": [
            "phenotype"
          ],
          "locus": false
        }
      },
      {
        "index": "gwas-associations",
        "built": "2020-08-02T15:41:18",
        "schema": "phenotype",
        "query": {
          "keys": [
            "phenotype"
          ],
          "locus": false
        }
      },
      {
        "index": "phewas-associations",
        "built": "2020-08-03T15:42:30",
        "schema": "varId",
        "query": {
          "keys": [
            "varId"
          ],
          "locus": false
        }
      },
      {
        "index": "regions",
        "built": "2020-08-03T05:00:51",
        "schema": "chromosome:start-end",
        "query": {
          "keys": [],
          "locus": true
        }
      },
      {
        "index": "top-associations",
        "built": "2020-07-29T23:30:25",
        "schema": "chromosome:position",
        "query": {
          "keys": [],
          "locus": true
        }
      },
      {
        "index": "transcript-consequences",
        "built": "2020-07-30T19:21:47",
        "schema": "varId",
        "query": {
          "keys": [
            "varId"
          ],
          "locus": false
        }
      },
      {
        "index": "transcription-factors",
        "built": "2020-07-30T03:35:13",
        "schema": "varId",
        "query": {
          "keys": [
            "varId"
          ],
          "locus": false
        }
      },
      {
        "index": "variant",
        "built": "2020-08-02T05:50:21",
        "schema": "varId|dbSNP",
        "query": {
          "keys": [
            "varId|dbSNP"
          ],
          "locus": false
        }
      }
    ],
    "nonce": "d9INzDiTyqZgVEfOhZOHdTCNUw5weocZQPRCFN1k_yQ"
  }

// NOTE: The following utils are used to map from a given piece of bioIndex data to other bioIndex endpoints
// We want to partition compatible indexes into those requiring only one argument and those containing multiple arguments
// This is because when using these in navigation, sometimes

// TODO: use jsonpath OR use common predicates to pass into these filters instead?
// TODO: use partitions?
// TODO: use regionOrVariant formatter against queryKey for detection?
// TODO: reuse these functions? (would it decrease performance)
const compatibleIndexesForKey = function(queryKey) {
    if (queryKey === "regions" || queryKey === "gene") {
        // all indexes that have locus === true
        // TODO: relationship between gene and region?
        return BIOINDEX_SCHEMA.data.filter(scheme => scheme.query.locus === true);
    } else {
        // all indexes that have query.keys including the queryKey
        return BIOINDEX_SCHEMA.data.filter(scheme => scheme.query.keys.includes(queryKey));
    }
}

const basicIndexesForKey = function(queryKey) {
    // all compatibleIndexes that have only a single key
    if (queryKey === "regions" || queryKey === "gene") {
        // all indexes where locus is true, but query.keys is empty
        return compatibleIndexesForKey(queryKey).filter(scheme => scheme.query.keys.length === 0);
    } else {
        // all indexes where there is only one key presenting, and it's the queryKey
        return compatibleIndexesForKey(queryKey).filter(scheme => scheme.query.keys.length === 1 && !scheme.query.locus);
    }
}

const compoundIndexesForKey = function(queryKey) {
    // all non-basic indexes
    return compatibleIndexesForKey(queryKey).filter(scheme => scheme.query.keys.length > 0 && scheme.query.locus === true ||  scheme.query.keys.length > 1);
}

const JOIN_HISTORY='!'
const JOIN_QUERIES = '|' // this can't be equal to `,` (or `-` or `:` for that matter), because bioIndex uses that for its queries, which would result in false splits when we're decoding the history later
const JOIN_EDGES = ','   // could technically be `|` but `,` is more readable (when we can use it)
const JOIN_PARTS =';'    // can be overloaded between queries and edges since we (should) guarantee splitting on the JOIN_CHAR_HISTORY marker first

function encodeHistory(cardsById, edgeList) {
  const queries = cardsById.map(card => `${card.index}${JOIN_PARTS}${card.query}`).join(JOIN_QUERIES);  // ordering should equal id
  const edges = edgeList.map(edgePair =>`${edgePair[0]}${JOIN_PARTS}${edgePair[1]}`).join(JOIN_EDGES);
  return `${queries}${JOIN_HISTORY}${edges}`;
}

const decodeHistory = function(historyString) {
  let cards = [];
  let edges = [];
  let parenthood = {};

  const [preQueries, preEdges] = historyString.split(JOIN_HISTORY);

  const edgePairs = preEdges.split(JOIN_EDGES)
  edgePairs.forEach(content => {
      const [child, parent] = content.split(JOIN_PARTS)
      edges.push([child, parent])
      parenthood[child] = parent;
  })

  const queries = preQueries.split(JOIN_QUERIES);
  cards = queries.map((content, inc) => {
      const [index, query] = content.split(JOIN_PARTS);
      const card = { id: inc, index, query, parent: parenthood[inc] };
      return card;
  });

  return {
    cards,
    edges,
    parenthood,
  }

}

const HASH_JOINER = "__";

// TODO: use regexp for all this coding/decoding nonsense?
function provenanceHash(queryObj) {
  // NOTA BENE: we're going to use this under conditions where it's a div ID, so it needs to follow HTML spec
  // https://stackoverflow.com/questions/70579/what-are-valid-values-for-the-id-attribute-in-html
  // For now since 'index' refers to an english word plus hyphens, we're in the clear for HTML5, but if we can't put constraints
  // on our hashing algo we're going to have (small) problems later. (?: could just put a random letter in front? -> breaks non-determinism)

  // NOTE: Vue apparently likes even *fewer* characters than the HTML5 spec constrains. doesn't work with `.` nor `:`
  // using `_` to be consistent with HTML spec, AND what Vue can handle, for valid ids for elements (the default `,` breaks document selector behavior)
  // TODO: in thr case of locii, *for now*, we'll replace colon with an underscore...
  const { index, query, parent } = queryObj;
  return [
      index,
      parent,
      // TODO: replace double replaces with a global substitute of some kind; it's only necessary because of varId
      query.replace(':', '_').replace(':', '_').replace(',','--'),
  ].join(HASH_JOINER)  // double underscore since single underscore is now reserved
}

// TODO: refactor to use this in provenanceHash (problem comes from extracting data from hash, may need to reserve different location for parent)
function contentHash(queryObj) {
  const { index, query } = queryObj;
  return [
      index,
      // TODO: replace double replaces with a global substitute of some kind; it's only necessary because of varId
      query.replace(':', '_').replace(':', '_').replace(',','--'),
  ].join(HASH_JOINER)  // double underscore since single underscore is now reserved
}

function leftmostArgFromHash(queryHash) {
    const queryHashTokens = queryHash.split(HASH_JOINER);
    return queryHashTokens[queryHashTokens.length - 1].split('--')[0];
}
function rightmostArgFromHash(queryHash) {
    const queryHashTokens = queryHash.split(HASH_JOINER);
    return queryHashTokens[queryHashTokens.length - 1].split('--').pop();
}
function centerArgFromHash(queryHash) {
    return queryHash.split(HASH_JOINER)[1];
}

function bioIndexFromHash(queryHash) {
    // TODO: need to refactor use of queryHash if queryHash is not decodable into parts
    return queryHash.split(HASH_JOINER)[0];
}
function parentFromHash(queryHash) {
    // TODO: need to refactor use of queryHash if queryHash is not decodable into parts
    return centerArgFromHash(queryHash)
}
function phenotypeFromHash(queryHash) {
    // NB: doesn't check if the hash actually contains a phenotype
    // TODO: need to refactor use of queryHash if queryHash is not decodable into parts
    return leftmostArgFromHash(queryHash);
}
function locusFromHash(queryHash) {
    // NB: doesn't check if the hash actually contains a locus or if it's in the right place
    // TODO: need to refactor use of queryHash if queryHash is not decodable into parts
    return rightmostArgFromHash(queryHash).replace("_",":")
}

// https://stackoverflow.com/a/32922084/1991892
function deepEqual(x, y) {
    // Compares:
    // Any two not-undefined valid objects
    // where they have equal numbers of keys
    // and if for each key in `x`,
        // it is the case that the value given the key in `x` is equal to the value with the same key in `y`, return true
        // else return false
    // else if x and y are not objects, use `===` comparison
    // if the values of x[key] and y[key] are objects, '
    // deepEqual will recursively apply itself to the objects inside
    const ok = Object.keys, tx = typeof x, ty = typeof y;
    return x && y && tx === 'object' && tx === ty ? (
      ok(x).length === ok(y).length &&
        ok(x).every(key => deepEqual(x[key], y[key]))
    ) : (x === y);
  }

function intersectCards(cardList) {
    // produce a list of elements that satisfies on pred for all
    return _.intersectionWith(...cardList, deepEqual)
}
function unionCards(cardList) {
    // produce a list of elements that satisfies on pred for all
    return _.unionWith(...cardList, deepEqual)
}
// TODO: not performant
// function differenceCards(cardList) {
//     // produce a list of elements that satisfies on pred for all
//     return _.differenceWith(...cardList, deepEqual)
// }
function dispatchSetOperation(operation) {
    switch(operation) {
        case 'intersect': return intersectCards
        case 'union': return unionCards
        // case 'difference': return differenceCards
        default: return id => {
            console.warn('operation', operation, 'not supported for cards')
            return id
        }
    }
}

export {
    bioIndexFromHash,
    parentFromHash,
    phenotypeFromHash,
    locusFromHash,
    provenanceHash,
    rightmostArgFromHash as queryFromHash,
    contentHash,
    encodeHistory,
    decodeHistory,
    basicIndexesForKey,
    compoundIndexesForKey,
    compatibleIndexesForKey,

    dispatchSetOperation,
    intersectCards,

};
