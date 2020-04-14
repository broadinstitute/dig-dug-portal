/**
 * Ensembl REST calls
 */

import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

// matches a string to a region string (same as used in BioIndex)

const REGION_REGEXP = /(?:chr)?(1\d?|2[0-2]?|[3-9]|x|y|xy|mt?)[:_](\d+)(?:([+/-])(\d+))?/i;


// parse a region as either a gene name, ENS ID, or chr:start-stop
async function parseRegion(s, allowGeneLookup = true) {
    let match = s.replace(/,/g, '').match(REGION_REGEXP);

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

        // parsed region
        return { chr, start, end };
    }

    // allow for gene lookup?
    if (allowGeneLookup) {
        if (s.toUpperCase().startsWith('ENSG')) {
            let region = await fetch(`https://grch37.rest.ensembl.org/lookup/id/${s}`)
                .then(resp => resp.json())
                .then(json => {
                    return {
                        chr: json.seq_region_name,
                        start: json.start,
                        end: json.end,
                    }
                });

            return region;
        }

        // use the bio index to lookup a gene name
        let region = await fetch(`${BIO_INDEX_HOST}/api/bio/query/gene?q=${s}`)
            .then(resp => resp.json())
            .then(json => {
                if (json.count == 0) {
                    return null;
                }

                return {
                    chr: json.data[0].chromosome,
                    start: json.data[0].start,
                    end: json.data[0].end,
                }
            });

        return region;
    }

    // invalid region or gene
    return null;
}


export default {
    parseRegion,
}
