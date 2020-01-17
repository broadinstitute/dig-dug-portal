module.exports = {
    devServer: {
        writeToDisk: true // https://webpack.js.org/configuration/dev-server/#devserverwritetodisk-
    },
    pages: {
        home: {
            entry: "src/views/Home/main.js",
            template: "public/index.html",
            filename: "home.html",
            title: "Home",
            chunks: ["chunk-vendors", "chunk-common", "home"]
        },
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
        debug: {
            entry: "src/views/Debugging/main.js",
            template: "public/index.html",
            filename: "debug.html",
            title: "Debug Page",
            chunks: ["chunk-vendors", "chunk-common", "debug"]

        }
    }
};
