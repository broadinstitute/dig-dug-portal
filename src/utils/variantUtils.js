

const VARID_REGEXP = /(?:chr)?(1\d?|2[0-2]?|[3-9]|x|y|xy|mt?)[:_](\d+)[:_]([agct]+)[:_/]([agct]+)/i;


function parseVariantID(variantID) {

    let m = variantID.match(VARID_REGEXP);
    if (!!m) {
        let chr = m[1].toUpperCase()
        let pos = parseInt(m[2])
        let ref = m[3].toUpperCase()
        let alt = m[4].toUpperCase()
        let variant = `${chr}:${pos}:${ref}:${alt}`
        return variant
    }

}


export default {
    parseVariantID,
}