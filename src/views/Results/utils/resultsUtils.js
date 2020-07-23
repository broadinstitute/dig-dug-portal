// Local copy of http://<BIOINDEX>/api/bio/indexes on July 13 2020
// TODO: convert into an API call that loads on startup
export const BIOINDEX_SCHEMA = {
    "count": 14,
    "data": [
      {
        "index": "annotated-regions",
        "schema": "annotation,chromosome:start-end",
        "built": true,
        "query": {
          "keys": [
            "annotation"
          ],
          "locus": true
        }
      },
      {
        "index": "associations",
        "schema": "phenotype,chromosome:position",
        "built": true,
        "query": {
          "keys": [
            "phenotype"
          ],
          "locus": true
        }
      },
      {
        "index": "credible-regions",
        "schema": "phenotype,credibleSetId",
        "built": true,
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
        "schema": "phenotype,chromosome:start-end",
        "built": true,
        "query": {
          "keys": [
            "phenotype"
          ],
          "locus": true
        }
      },
      {
        "index": "credible-variants",
        "schema": "phenotype,credibleSetId",
        "built": true,
        "query": {
          "keys": [
            "phenotype",
            "credibleSetId"
          ],
          "locus": false
        }
      },
      {
        "index": "effector-genes",
        "schema": "phenotype,dataset",
        "built": true,
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
        "schema": "name",
        "built": true,
        "query": {
          "keys": [
            "name"
          ],
          "locus": false
        }
      },
      {
        "index": "genes",
        "schema": "chromosome:start-end",
        "built": true,
        "query": {
          "keys": [],
          "locus": true
        }
      },
      {
        "index": "global-enrichment",
        "schema": "phenotype",
        "built": true,
        "query": {
          "keys": [
            "phenotype"
          ],
          "locus": false
        }
      },
      {
        "index": "phenotype-associations",
        "schema": "phenotype",
        "built": true,
        "query": {
          "keys": [
            "phenotype"
          ],
          "locus": false
        }
      },
      {
        "index": "regions",
        "schema": "chromosome:start-end",
        "built": true,
        "query": {
          "keys": [],
          "locus": true
        }
      },
      {
        "index": "top-associations",
        "schema": "chromosome:position",
        "built": true,
        "query": {
          "keys": [],
          "locus": true
        }
      },
      {
        "index": "variant",
        "schema": "varId|dbSNP",
        "built": true,
        "query": {
          "keys": [
            "varId|dbSNP"
          ],
          "locus": false
        }
      },
      {
        "index": "variants",
        "schema": "chromosome:position",
        "built": true,
        "query": {
          "keys": [],
          "locus": true
        }
      }
    ],
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
        return compatibleIndexesForKey(queryKey).filter(scheme => scheme.query.keys.length === 1);
    }
}

const compoundIndexesForKey = function(queryKey) {
    // all non-basic indexes
    if (queryKey === "regions" || queryKey === "gene") {
        // all indexes where locus is true, and query.keys is more than 0
        return compatibleIndexesForKey(queryKey).filter(scheme => scheme.query.keys.length > 0);
    } else {
        // all indexes where there is more than one key
        return compatibleIndexesForKey(queryKey).filter(scheme => scheme.query.keys.length > 1);
    }
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
      query.replace(':', '_').replace(',','--'),
  ].join('__')  // double underscore since single underscore is now reserved
}

// TODO: refactor to use this in provenanceHash (problem comes from extracting data from hash, may need to reserve different location for parent)
function contentHash(queryObj) {
  const { index, query } = queryObj;
  return [
      index,
      query.replace(':', '_').replace(',','--'),
  ].join('__')  // double underscore since single underscore is now reserved
}

export {
    provenanceHash,
    contentHash,
    encodeHistory,
    decodeHistory,
    basicIndexesForKey,
    compoundIndexesForKey,
    compatibleIndexesForKey,
}

// const regionOrVariant = function (input) {
//     let locus = await regionUtils.parseRegion(input, true, 50000);
//     let varID = await variantUtils.parseVariant(input);

//     if (locus) {
//         if (locus.gene) {
//             return "gene";
//         }
//         else {
//             return "region";
//         }
//     } else if (varID) {
//         return "variant"
//     } else {
//         // TODO: phenotype, credibleSetId, dataset
//         return null;
//     }
// }
