const VARID_REGEXP = /^(?:chr)?(1\d?|2[0-2]?|[3-9]|x|y|xy|mt?)[:_\-](\d+)[:_\-]([agct]+)[:_/\-]([agct]+)$/i;
const DBSNP_REGEXP = /^rs\d+$/;

function parseVariant(variantID) {
    let isDBSNP = variantID.trim().match(DBSNP_REGEXP);
    let isVarId = variantID.trim().match(VARID_REGEXP);

    if (!!isDBSNP) {
        return variantID;
    }

    if (!!isVarId) {
        let chr = isVarId[1].toUpperCase();
        let pos = parseInt(isVarId[2]);
        let ref = isVarId[3].toUpperCase();
        let alt = isVarId[4].toUpperCase();
        let variant = `${chr}:${pos}:${ref}:${alt}`;

        return variant;
    }
}

function gaitVariant(variantID) {
    let split = variantID.split(":");
    return `${split[0]}:${split[1]}_${split[2]}/${split[3]}`;
}

export default {
    parseVariant,
    gaitVariant
};
