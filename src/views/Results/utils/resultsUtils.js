import regionUtils from "@/utils/regionUtils.js"
import variantUtils from "@/utils/regionUtils.js"
import { partition } from "lodash"

// Local copy of http://<BIOINDEX>/api/bio/indexes on July 13 2020
// TODO: convert into an API call that loads on startup
const BIOINDEX_SCHEMA = {
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

export {
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
