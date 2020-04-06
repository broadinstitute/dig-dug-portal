
function parseVariantID(variantID) {
    //example varID -> 8:118184783:C:T 
    //8_118184783_C_T - should be valid input as well
    //should work for lower case as well
    //eventually it should be able to use rsid as input 
    let parsedVar = variantID.split(/\s*[:_]\s*/)
    let chr = parsedVar[0]
    let pos = parsedVar[1]
    let ref = parsedVar[2].toLowerCase()
    let alt = parsedVar[3].toLowerCase()
    return { chr, pos, ref, alt }
}
export default {
    parseVariantID,
}