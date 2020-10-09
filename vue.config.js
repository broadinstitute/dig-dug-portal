/* We define all the pages first in an object that can be modified BEFORE being
 * exported so we can add/remove pages based on build type.
 */

let pages = {
    index: {
        entry: "src/views/Index/main.js",
        template: "public/index.html",
        filename: "index.html",
        title: "Home",
        chunks: ["chunk-vendors", "chunk-common", "index"]
    },
    debug: {
        entry: "src/views/Debug/main.js",
        template: "public/index.html",
        filename: "debug.html",
        title: "Debug Page",
        chunks: ["chunk-vendors", "chunk-common", "debug"]
    },
    phenotype: {
        entry: "src/views/Phenotype/main.js",
        template: "public/index.html",
        filename: "phenotype.html",
        title: "Phenotype",
        chunks: ["chunk-vendors", "chunk-common", "phenotype"]
    },
    region: {
        entry: "src/views/Region/main.js",
        template: "public/index.html",
        filename: "region.html",
        title: "Region Info",
        chunks: ["chunk-vendors", "chunk-common", "region"]
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
    datasets: {
        entry: "src/views/Datasets/main.js",
        template: "public/index.html",
        filename: "datasets.html",
        title: "Datasets",
        chunks: ["chunk-vendors", "chunk-common", "datasets"]
    },
    dinspector: {
        entry: "src/views/DatasetInspector/main.js",
        template: "public/index.html",
        filename: "dinspector.html",
        title: "Dataset Inspector",
        chunks: ["chunk-vendors", "chunk-common", "dinspector"]
    },
    downloads: {
        entry: "src/views/Downloads/main.js",
        template: "public/index.html",
        filename: "downloads.html",
        title: "Downloads",
        chunks: ["chunk-vendors", "chunk-common", "downloads"]
    },
    policies: {
        entry: "src/views/Policies/main.js",
        template: "public/index.html",
        filename: "policies.html",
        title: "Policies",
        chunks: ["chunk-vendors", "chunk-common", "policies"]
    },
    about: {
        entry: "src/views/About/main.js",
        template: "public/index.html",
        filename: "about.html",
        title: "About",
        chunks: ["chunk-vendors", "chunk-common", "about"]
    },
    collaborate: {
        entry: "src/views/Collaborate/main.js",
        template: "public/index.html",
        filename: "collaborate.html",
        title: "Collaborate",
        chunks: ["chunk-vendors", "chunk-common", "collaborate"]
    },
    resources: {
        entry: "src/views/Resources/main.js",
        template: "public/index.html",
        filename: "resources.html",
        title: "Resources",
        chunks: ["chunk-vendors", "chunk-common", "resources"]
    },
    publications: {
        entry: "src/views/Publications/main.js",
        template: "public/index.html",
        filename: "publications.html",
        title: "Publications",
        chunks: ["chunk-vendors", "chunk-common", "publications"]
    },
    news: {
        entry: "src/views/News/main.js",
        template: "public/index.html",
        filename: "news.html",
        title: "News",
        chunks: ["chunk-vendors", "chunk-common", "news"]
    },
    contacts: {
        entry: "src/views/Contacts/main.js",
        template: "public/index.html",
        filename: "contacts.html",
        title: "Contacts",
        chunks: ["chunk-vendors", "chunk-common", "contacts"]
    },
    apis: {
        entry: "src/views/Apis/main.js",
        template: "public/index.html",
        filename: "apis.html",
        title: "APIs",
        chunks: ["chunk-vendors", "chunk-common", "apis"]
    },
    epigeneticdatasets: {
        entry: "src/views/EpigeneticDatasets/main.js",
        template: "public/index.html",
        filename: "epigeneticdatasets.html",
        title: "Epigenetic Datasets",
        chunks: ["chunk-vendors", "chunk-common", "epigeneticdatasets"]
    },
    effectorgenes: {
        entry: "src/views/EffectorGenes/main.js",
        template: "public/index.html",
        filename: "effectorgenes.html",
        title: "Predicted Effector Genes Research Methods",
        chunks: ["chunk-vendors", "chunk-common", "effectorgenes"]
    },
    eglmethod: {
        entry: "src/views/EglMethod/main.js",
        template: "public/index.html",
        filename: "method.html",
        title: "Research Method",
        chunks: ["chunk-vendors", "chunk-common", "eglmethod"]
    },
    hugecalculator: {
        entry: "src/views/HuGeCalculator/main.js",
        template: "public/index.html",
        filename: "hugecalculator.html",
        title: "HuGe Calculator",
        chunks: ["chunk-vendors", "chunk-common", "hugecalculator"]
    },
    page404: {
        entry: "src/views/404/main.js",
        template: "public/index.html",
        filename: "404.html",
        title: "Page Not Found",
        chunks: ["chunk-vendors", "chunk-common", "page404"]
    }
};

// remove the debug page in production
if (process.env.NODE_ENV === "production") {
    delete pages.debug;
}

module.exports = {
    devServer: {
        writeToDisk: true // https://webpack.js.org/configuration/dev-server/#devserverwritetodisk-
    },
    configureWebpack: config => {
        let bioindex_dev = process.env.BIOINDEX_DEV;
        let bioindex_host = "https://bioindex.hugeamp.org"; // production by default

        if (!!bioindex_dev) {
            bioindex_host =
                bioindex_dev == "localhost"
                    ? "http://localhost:5000"
                    : "https://bioindex-dev.hugeamp.org";
        }

        // output which bioindex is being used
        console.log(
            `BIOINDEX_DEV=${process.env.BIOINDEX_DEV}; using ${bioindex_host}`
        );

        // add the transform rule for bioindex
        config.module.rules.push({
            test: /bioIndexUtils\.js$/,
            loader: "string-replace-loader",
            options: {
                search: "SERVER_IP_ADDRESS",
                replace: bioindex_host,
                flags: "g"
            }
        });

        // create inline maps for dev builds
        if (process.env.NODE_ENV !== "production") {
            config.devtool = "inline-source-map";
        }
    },
    productionSourceMap: false,
    pages
};
