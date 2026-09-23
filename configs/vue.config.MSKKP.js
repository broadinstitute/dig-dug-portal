const baseConfig = require("../vue.config");

module.exports = {
    ...baseConfig,
    pages: {
        ...baseConfig.pages,
        index: {
            ...baseConfig.pages.index,
            entry: "src/portals/MSKKP/MskkpIndex/main.js",
            filename: "index.html",
            title: "Home",
            chunks: ["chunk-vendors", "chunk-common", "index"],
        },
        singlecellcompare: {
            entry: "src/portals/MSKKP/SingleCellCompare/main.js",
            template: "public/index.html",
            filename: "singlecellcompare.html",
            title: "MSKKP Single-Cell Dataset Comparison",
            chunks: ["chunk-vendors", "chunk-common", "singlecellcompare"],
        },
    },
};
