
function parseVariantID(variantID) {
    //example varID -> 8:118184783:C:T 
    //8_118184783_C_T - should be valid input as well
    //should work for lower case as well
    //eventually it should be able to use rsid as input 

    let chr = variantID.split(":")[0]
    let position = variantID.split(":")[1]
    let ref = variantID.split(":")[2]
    let alt = variantID.split(":")[3]
    return { chr, position, ref, alt }
}