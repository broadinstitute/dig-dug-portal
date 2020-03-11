/**
 * Ensembl REST calls
 */

// matches a string to a region string (same as used in BioIndex)
const REGION_REGEXP = /(?:chr)?(\d{1,2}|x|y|xy|mt):(\d+)(?:([+/-])(\d+))?/;

// parse a region as either a gene name, ENS ID, or chr:start-stop
async function parseRegion(s, allowENSLookup = true) {
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
                    end = Math.max(n, start) + 1;
                    break;

                // offset from start
                case '+':
                    end = start + n + 1;
                    break;

                // around position
                case '/':
                    end = start + n + 1;
                    start = start - n;
                    break;
            }
        }

        // parsed region
        return { chr, start, end };
    }

    console.log(allowENSLookup);

    // allow for ensembl lookup?
    if (allowENSLookup) {
        let url = 'https://grch37.rest.ensembl.org/lookup'

        if (s.toUpperCase().startsWith('ENS')) {
            url += `/id/${s}`;
        } else {
            url += `/symbol/homo_sapiens/${s}`;
        }

        console.log(url);

        // get the JSON response
        let region = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
            .then(resp => resp.json())
            .then(json => {
                return {
                    chr: json.seq_region_name,
                    start: json.start,
                    end: json.end,
                }
            })

            // null regions on error
            .catch(err => null);

        return region;
    }

    // invalid region or
    return null;
}


export default {
    parseRegion,
}
