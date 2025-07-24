/* We define all the pages first in an object that can be modified BEFORE being
 * exported so we can add/remove pages based on build type.
 */

let pages = {
    index: {
        entry: "src/portals/Neph/views/Index/main.js",
        template: "public/index.html",
        filename: "index.html",
        title: "Home",
        chunks: ["chunk-vendors", "chunk-common", "index"]
    },
    page404: {
        entry: "src/views/404/main.js",
        template: "public/index.html",
        filename: "404.html",
        title: "Page Not Found",
        chunks: ["chunk-vendors", "chunk-common", "page404"]
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
        entry: "src/portals/Neph/views/Variant/main.js",
        template: "public/index.html",
        filename: "variant.html",
        title: "Variant Info",
        chunks: ["chunk-vendors", "chunk-common", "variant"]
    },
    gene: {
        entry: "src/portals/Neph/views/Gene/main.js",
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
    research: {
        entry: "src/views/Papers/Research/main.js",
        template: "public/index.html",
        filename: "research.html",
        title: "Research",
        chunks: ["chunk-vendors", "chunk-common", "research"]
    },
    multigenedownloader: {
        entry: "src/portals/Neph/views/MultiGeneDownload/main.js",
        template: "public/index.html",
        filename: "multigenedownloader.html",
        title: "MultiGene Downloader",
        chunks: ["chunk-vendors", "chunk-common", "multigenedownloader"]
    },
};

module.exports = {
    devServer: {
        writeToDisk: true // https://webpack.js.org/configuration/dev-server/#devserverwritetodisk-
    },
    configureWebpack: config => {
        let bioindex_dev = process.env.BIOINDEX_DEV;
        let bioindex_host = "https://bioindex.hugeamp.org"; // production by default
        //set private bioindex host if variable is defined, otherwise use default
        let bioindex_host_private =
            process.env.BIOINDEX_HOST_PRIVATE || "https://bioindex.hugeamp.org";

        if (!!bioindex_dev) {
            bioindex_host =
                bioindex_dev == "localhost"
                    ? "http://localhost:5000"
                    : "https://bioindex-dev.hugeamp.org";
        }

        // output which vue config file and bioindex is being used
        console.log(
            `VUE_CONFIG_PATH=${process.env.VUE_CLI_SERVICE_CONFIG_PATH}; BIOINDEX_DEV=${process.env.BIOINDEX_DEV}; using ${bioindex_host} and ${bioindex_host_private}`
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

        // add the transform rule for bioindex
        // Helen 2021-06-17
        config.module.rules.push({
            test: /bioIndexUtils\.js$/,
            loader: "string-replace-loader",
            options: {
                search: "SERVER_IP_PRIVATE",
                replace: bioindex_host_private,
                flags: "g"
            }
        });

        // create inline maps for dev builds
        if (process.env.NODE_ENV !== "production") {
            //config.devtool = "inline-source-map";

            //https://stackoverflow.com/questions/48047150/chrome-extension-compiled-by-webpack-throws-unsafe-eval-error
            config.devtool = "cheap-module-source-map";
        }
    },
    outputDir: "portals/Neph",
    productionSourceMap: false,
    pages
};
