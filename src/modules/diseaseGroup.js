/** from here
 */
let url = new URL(document.URL);
let currentPath = url.pathname;

let keyParam = {};
var c = url.searchParams.forEach((value, key) => {
    keyParam[key] = value;
});

/* to here can be gone after demo */

// Script bellow is complex to work with localhost and online
let diseaseGroupIds = { "md": "md", "cvd": "cvd", "cd": "cd", "t2d": "t2d", "sleep": "sleep" };
let currentHost = window.location.hostname;
let diseaseGroup = (diseaseGroupIds[currentHost.split(".")[0]] == "undefined") ? "md" : currentHost.split(".")[0];
let currentURLArr = window.location.href.split(currentHost);
let cleandHost = currentHost.substring(
    currentHost.split(".")[0].length
);
let redirectHost = "md" + cleandHost;
let url2Md = currentURLArr[0] + redirectHost + currentURLArr[1];

export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            id: diseaseGroup,
            url2Md: url2Md,
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

