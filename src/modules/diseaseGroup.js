/**
 * This is the module that is used to pull the news feed for KPN website

 */
let url = new URL(document.URL);
let currentPath = url.pathname;

let keyParam = {};
var c = url.searchParams.forEach((value, key) => {
    keyParam[key] = value;
});

keyParam.group = keyParam.group == null ? "md" : keyParam.group;

export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            id: keyParam.group,
            currentPath: currentPath,
            chrom: keyParam.chrom,
            start: Number(keyParam.start),
            end: Number(keyParam.end),
            phenotype: keyParam.phenotype,
            phenotypeName: keyParam.phenotype,
            newChrom: keyParam.chrom,
            newStart: Number(keyParam.start),
            newEnd: Number(keyParam.end),
        };
    },

}

