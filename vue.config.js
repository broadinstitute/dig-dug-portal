module.exports = {
    devServer: {
        writeToDisk: true // https://webpack.js.org/configuration/dev-server/#devserverwritetodisk-
    },
    pages: {
        index: {
            entry: "src/views/Index/main.js",
            template: "public/index.html",
            filename: "index.html",
            title: "Home",
            chunks: ["chunk-vendors", "chunk-common", "index"]
        },
        phenotype: {
            entry: "src/views/Phenotype/main.js",
            template: "public/index.html",
            filename: "phenotype.html",
            title: "Phenotype Page",
            chunks: ["chunk-vendors", "chunk-common", "phenotype"]
        },
        gene: {
            entry: "src/views/Gene/main.js",
            template: "public/index.html",
            filename: "gene.html",
            title: "Gene Info",
            chunks: ["chunk-vendors", "chunk-common", "gene"]

        },
        debug: {
            entry: "src/views/Debug/main.js",
            template: "public/index.html",
            filename: "debug.html",
            title: "Debug Page",
            chunks: ["chunk-vendors", "chunk-common", "debug"]

        },
        variant: {
            entry: "src/views/Variant/main.js",
            template: "public/index.html",
            filename: "variant.html",
            title: "Variant Info",
            chunks: ["chunk-vendors", "chunk-common", "variant"]

        },
    }
};
