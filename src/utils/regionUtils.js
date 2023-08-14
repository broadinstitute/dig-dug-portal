/**
 * Ensembl REST calls
 */

import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

// matches a string to a region string (same as used in BioIndex)
const REGION_REGEXP = /^(?:chr)?(1\d?|2[0-2]?|[3-9]|x|y|xy|mt?)[:_](\d+)(?:([+/-])(\d+))?$/i;

// parse a region as either a gene name, ENS ID, or chr:start-stop
async function parseRegion(s, allowGeneLookup = true, geneRegionExpand = 0) {
    let match = s.trim().replace(/,/g, '').match(REGION_REGEXP);

    // region matched, return chrom, start, and stop
    if (!!match) {
        let chr = match[1];
        let start = parseInt(match[2]);
        let end = start + 1;

        // is it an offset, around, or absolute position?
        if (!!match[3]) {
            let n = parseInt(match[4]);

            switch (match[3]) {
                case '-':
                    end = Math.max(n, start);
                    break;

                // offset from start
                case '+':
                    end = start + n;
                    break;

                // around position
                case '/':
                    end = start + n;
                    start = start - n;
                    break;
            }
        }

        // minimum region size
        if (end - start < geneRegionExpand) {
            let expand = geneRegionExpand - (end - start);

            start -= Math.floor(expand / 2);
            end += Math.ceil(expand / 2);
        }

        // parsed region
        return { chr, start, end };
    }

    // allow for gene lookup?
    if (allowGeneLookup) {
        let region = await fetch(`${BIO_INDEX_HOST}/api/bio/query/gene?q=${s}`)
            .then(resp => resp.json())
            .then(json => {
                if (json.count == 0) {
                    return null;
                }

                return {
                    chr: json.data[0].chromosome,
                    start: Math.max(json.data[0].start - geneRegionExpand, 0),
                    end: json.data[0].end + geneRegionExpand,
                    gene: s,
                }
            });

        return region;
    }

    // invalid region or gene or variant
    return null;
}

async function geneSymbol(KEY) {

    let geneJson = await fetch(`${BIO_INDEX_HOST}/api/bio/query/gene?q=${KEY}`)
        .then((resp) => resp.json())
        .then(json => {
            if (json.count == 0) {
                return null;
            }

            return json.data[0].symbol;
        });

    return geneJson;
}


export default {
    parseRegion,
    geneSymbol,
}
