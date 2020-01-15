module.exports = {
    devServer: {
        writeToDisk: true // https://webpack.js.org/configuration/dev-server/#devserverwritetodisk-
    },
    pages: {
        manhattan: {
            entry: "src/views/Manhattan/main.js",
            template: "public/index.html",
            filename: "manhattan.html",
            title: "Manhattan Page",
            chunks: ["chunk-vendors", "chunk-common", "manhattan"]
        },
        geneFinder: {
            entry: "src/views/GeneFinder/main.js",
            template: "public/index.html",
            filename: "genefinder.html",
            title: "Gene Finder",
            chunks: ["chunk-vendors", "chunk-common", "geneFinder"]
        },
        gene: {
            entry: "src/views/Gene/main.js",
            template: "public/index.html",
            filename: "gene.html",
            title: "Gene Info",
            chunks: ["chunk-vendors", "chunk-common", "gene"]
        },
        debugging: {
            entry: "src/views/Debugging/main.js",
            template: "public/index.html",
            filename: "debug.html",
            title: "Debug",
            chunks: ["chunk-vendors", "chunk-common", "debug"]
        }
    }
};
