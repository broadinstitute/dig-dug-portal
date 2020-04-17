
// matches a string to a variant ID string (same as used in BioIndex)
const VARID_REGEXP = /(?:chr)?(1\d?|2[0-2]?|[3-9]|x|y|xy|mt?)[:_](\d+)[:_]([agct]+)[:_/]([agct]+)/i;


function parseVariant(variantID) {

    let m = variantID.match(VARID_REGEXP);

    // variant ID matched, return chr:position:ref:alt
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
    parseVariant,
}