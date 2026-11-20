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
    SearchFront: {
        entry: "src/portals/Neph/views/SearchFront/main.js",
        template: "public/index.html",
        filename: "SearchFront.html",
        title: "Rare Disease Portal Search",
        chunks: ["chunk-vendors", "chunk-common", "SearchFront"]
    },
    analyzer: {
        entry: "src/portals/Neph/views/Analyzer/main.js",
        template: "public/index.html",
        filename: "analyzer.html",
        title: "CRDC Rare Disease Analyzer",
        chunks: ["chunk-vendors", "chunk-common", "analyzer"]
    },
    analyzer_new: {
        entry: "src/portals/Neph/views/Analyzer_new/main.js",
        template: "public/index.html",
        filename: "analyzer_new.html",
        title: "CRDC Rare Disease Explorer",
        chunks: ["chunk-vendors", "chunk-common", "analyzer_new"]
    },
    sampleresult: {
        entry: "src/portals/Neph/views/SampleResult/main.js",
        template: "public/index.html",
        filename: "sampleresult.html",
        title: "CRDC Sample",
        chunks: ["chunk-vendors", "chunk-common", "sampleresult"]
    },
    phenotyperesult: {
        entry: "src/portals/Neph/views/PhenotypeResult/main.js",
        template: "public/index.html",
        filename: "phenotyperesult.html",
        title: "CRDC Phenotype",
        chunks: ["chunk-vendors", "chunk-common", "phenotyperesult"]
    },
    variantresult: {
        entry: "src/portals/Neph/views/VariantResult/main.js",
        template: "public/index.html",
        filename: "variantresult.html",
        title: "CRDC Variant",
        chunks: ["chunk-vendors", "chunk-common", "variantresult"]
    },
    generesult: {
        entry: "src/portals/Neph/views/GeneResult/main.js",
        template: "public/index.html",
        filename: "generesult.html",
        title: "CRDC Gene Evidence",
        chunks: ["chunk-vendors", "chunk-common", "generesult"]
    },
    page404: {
        entry: "src/views/404/main.js",
        template: "public/index.html",
        filename: "404.html",
        title: "Page Not Found",
        chunks: ["chunk-vendors", "chunk-common", "page404"]
    },
    phenotype: {
        entry: "src/portals/Neph/views/Phenotype/main.js",
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
    documentation: {
        entry: "src/portals/Neph/views/Documentation/main.js",
        template: "public/index.html",
        filename: "documentation.html",
        title: "Documentation",
        chunks: ["chunk-vendors", "chunk-common", "documentation"]
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
    patient: {
        entry: "src/portals/Neph/views/Patient/main.js",
        template: "public/index.html",
        filename: "patient.html",
        title: "Patient Info",
        chunks: ["chunk-vendors", "chunk-common", "patient"]
    },
    signalsifter: {
        entry: "src/portals/Neph/views/SignalSifter/main.js",
        template: "public/index.html",
        filename: "signalsifter.html",
        title: "Signal Sifter",
        chunks: ["chunk-vendors", "chunk-common", "signalsifter"]
    },
    genefinder: {
        entry: "src/portals/Neph/views/GeneFinder/main.js",
        template: "public/index.html",
        filename: "genefinder.html",
        title: "Gene Finder",
        chunks: ["chunk-vendors", "chunk-common", "genefinder"]
    },
    phenotypeanalyzer: {
        entry: "src/portals/Neph/views/PhenotypeAnalyzer/main.js",
        template: "public/index.html",
        filename: "phenotypeanalyzer.html",
        title: "Phenotype Analyzer",
        chunks: ["chunk-vendors", "chunk-common", "phenotypeanalyzer"]
    },
    multigenedownloader: {
        entry: "src/portals/Neph/views/MultiGeneDownload/main.js",
        template: "public/index.html",
        filename: "multigenedownloader.html",
        title: "MultiGene Downloader",
        chunks: ["chunk-vendors", "chunk-common", "multigenedownloader"]
    },
    login: {
        entry: "src/portals/Neph/views/Login/main.js",
        template: "public/index.html",
        filename: "login.html",
        title: "Login",
        chunks: ["chunk-vendors", "chunk-common", "login"]
    },
    loginError: {
        entry: "src/portals/Neph/views/LoginError/main.js",
        template: "public/index.html",
        filename: "loginError.html",
        title: "Login Error",
        chunks: ["chunk-vendors", "chunk-common", "loginError"]
    },
};

module.exports = {
    devServer: {
        host: "127.0.0.1",
	//host: "aggregator-dev.bchresearch.org",
        port: 8080,
        proxy: {
            "/phenotype-analyzer-api": {
                target: process.env.SERVICE_HOST_PRIVATE || "http://localhost:4999",
                changeOrigin: true,
                pathRewrite: {
                    "^/phenotype-analyzer-api": ""
                }
            }
        },
        //writeToDisk: true // https://webpack.js.org/configuration/dev-server/#devserverwritetodisk-
    },
    configureWebpack: config => {
        let bioindex_dev = process.env.BIOINDEX_DEV;
        let bioindex_host = "https://bioindex-dev.hugeamp.org"; // production by default
        // Set private bioindex host if variable is defined, otherwise use default
        let bioindex_host_private =
            process.env.BIOINDEX_HOST_PRIVATE || "https://bioindex-dev.hugeamp.org";

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

        // replace SERVER_IP_ADDRESS placeholder with the resolved public host
        config.module.rules.push({
            test: /bioIndexUtils\.js$/,
            loader: "string-replace-loader",
            options: {
                search: "SERVER_IP_ADDRESS",
                replace: bioindex_host,
                flags: "g"
            }
        });

        // replace SERVER_IP_PRIVATE placeholder with the resolved private host
        config.module.rules.push({
            test: /bioIndexUtils\.js$/,
            loader: "string-replace-loader",
            options: {
                search: "SERVER_IP_PRIVATE",
                replace: bioindex_host_private,
                flags: "g"
            }
        });

        // @azure/msal-browser v3+ ships .mjs files with modern syntax (optional
        // chaining, nullish coalescing) that webpack 4 can't parse by default.
        // Force babel-loader over those files so they get transpiled.
        config.module.rules.push({
            test: /\.(mjs|cjs)$/,
            include: /node_modules\/@azure/,
            type: "javascript/auto",
            use: ["babel-loader"]
        });

        // create inline maps for dev builds
        if (process.env.NODE_ENV !== "production") {
            // https://stackoverflow.com/questions/48047150/chrome-extension-compiled-by-webpack-throws-unsafe-eval-error
            config.devtool = "cheap-module-source-map";
        }
    },
    outputDir: "portals/Neph",
    productionSourceMap: false,
    transpileDependencies: [
        'igv',
        '@azure/msal-browser',
        '@azure/msal-common'
    ],
    pages
};
      
