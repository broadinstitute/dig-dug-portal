module.exports = {
    devServer: {
        writeToDisk: true // https://webpack.js.org/configuration/dev-server/#devserverwritetodisk-
    },
    configureWebpack: config => {
        if (process.env.NODE_ENV !== 'production') {
            config.devtool = 'inline-source-map';
        }
    },
    productionSourceMap: false,
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
        region: {
            entry: "src/views/Region/main.js",
            template: "public/index.html",
            filename: "region.html",
            title: "Region Info",
            chunks: ["chunk-vendors", "chunk-common", "region"]

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
        gene: {
            entry: "src/views/Gene/main.js",
            template: "public/index.html",
            filename: "gene.html",
            title: "Gene Info",
            chunks: ["chunk-vendors", "chunk-common", "gene"]
        },
        effectorGenes: {
            entry: "src/views/EffectorGenes/main.js",
            template: "public/index.html",
            filename: "effectorgenes.html",
            title: "Effector Genes",
            chunks: ["chunk-vendors", "chunk-common", "effectorGenes"]
        },
        debug: {
            entry: "src/views/Debug/main.js",
            template: "public/index.html",
            filename: "debug.html",
            title: "Debug Page",
            chunks: ["chunk-vendors", "chunk-common", "debug"]
        }
    }
};
