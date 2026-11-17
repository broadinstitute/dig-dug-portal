
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

const REGION_REGEXP = /^(?:chr)?(1\d?|2[0-2]?|[3-9]|x|y|xy|mt?)[:_](\d+)(?:([+/-])(\d+))?$/i;

async function parseRegion(s, allowGeneLookup = true, geneRegionExpand = 0) {
    let match = s.trim().replace(/,/g, '').match(REGION_REGEXP);

    if (!!match) {
        let chr = match[1];
        let start = parseInt(match[2]);
        let end = start + 1;

        if (!!match[3]) {
            let n = parseInt(match[4]);

            switch (match[3]) {
                case '-':
                    end = Math.max(n, start);
                    break;

                case '+':
                    end = start + n;
                    break;

                case '/':
                    end = start + n;
                    start = start - n;
                    break;
            }
        }

        if (end - start < geneRegionExpand) {
            let expand = geneRegionExpand - (end - start);

            start -= Math.floor(expand / 2);
            end += Math.ceil(expand / 2);
        }

        return { chr, start, end };
    }

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
