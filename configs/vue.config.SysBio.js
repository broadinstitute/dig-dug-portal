/* We define all the pages first in an object that can be modified BEFORE being
 * exported so we can add/remove pages based on build type.
 */

let pages = {
    index: {
        entry: "src/portals/SysBio/views/Index/main.js",
        template: "src/portals/SysBio/views/index.html",
        filename: "index.html",
        title: "Home",
        chunks: ["chunk-vendors", "chunk-common", "index"],
    },
    page404: {
        entry: "src/views/404/main.js",
        template: "src/portals/SysBio/views/index.html",
        filename: "404.html",
        title: "Page Not Found",
        chunks: ["chunk-vendors", "chunk-common", "page404"],
    },
    about: {
        entry: "src/portals/SysBio/views/About/main.js",
        template: "src/portals/SysBio/views/index.html",
        filename: "about.html",
        title: "About",
        chunks: ["chunk-vendors", "chunk-common", "about"],
    },
    expression: {
        entry: "src/portals/SysBio/views/Expression/main.js",
        template: "src/portals/SysBio/views/index.html",
        filename: "expression.html",
        title: "Gene Expression Browser",
        chunks: ["chunk-vendors", "chunk-common", "expression"],
    },
    gwas: {
        entry: "src/portals/SysBio/views/GWAS/main.js",
        template: "src/portals/SysBio/views/index.html",
        filename: "gwas.html",
        title: "Genetic Studues",
        chunks: ["chunk-vendors", "chunk-common", "gwas"],
    },
    singlecell: {
        entry: "src/portals/SysBio/views/SingleCell/main.js",
        template: "src/portals/SysBio/views/index.html",
        filename: "singlecell.html",
        title: "Single Cell",
        chunks: ["chunk-vendors", "chunk-common", "singlecell"],
    },
    diffexp: {
        entry: "src/portals/SysBio/views/BulkBrowser/main.js",
        template: "src/portals/SysBio/views/index.html",
        filename: "diffexp.html",
        title: "Differential Expression",
        chunks: ["chunk-vendors", "chunk-common", "diffexp"]
    },
    comparator: {
        entry: "src/portals/SysBio/views/Comparator/main.js",
        template: "src/portals/SysBio/views/index.html",
        filename: "comp.html",
        title: "Differential Expression Comparator",
        chunks: ["chunk-vendors", "chunk-common", "comparator"]
    },
    datasetsSummary: {
        entry: "src/portals/SysBio/views/datasetsSummary/main.js",
        template: "src/portals/SysBio/views/index.html",
        filename: "datasetsSummary.html",
        title: "Datasets Summary",
        chunks: ["chunk-vendors", "chunk-common", "datasetsSummary"],
    },
};

module.exports = {
    devServer: {
        writeToDisk: true, // https://webpack.js.org/configuration/dev-server/#devserverwritetodisk-
    },
    publicPath: "",
    configureWebpack: (config) => {
        // create inline maps for dev builds
        if (process.env.NODE_ENV !== "production") {
            //config.devtool = "inline-source-map";

            //https://stackoverflow.com/questions/48047150/chrome-extension-compiled-by-webpack-throws-unsafe-eval-error
            config.devtool = "cheap-module-source-map";
        }
    },
    outputDir: "portals/SysBio",
    productionSourceMap: false,
    pages,
};
