/* We define all the pages first in an object that can be modified BEFORE being
 * exported so we can add/remove pages based on build type.
 */

let pages = {
    index: {
        entry: "src/views/A2fIndex/main.js",
        template: "public/index.html",
        filename: "index.html",
        title: "Home",
        chunks: ["chunk-vendors", "chunk-common", "index"],
    },
    debug: {
        entry: "src/views/Debug/main.js",
        template: "public/index.html",
        filename: "debug.html",
        title: "Debug Page",
        chunks: ["chunk-vendors", "chunk-common", "debug"],
    },
    phenotype: {
        entry: "src/views/Phenotype/main.js",
        template: "public/index.html",
        filename: "phenotype.html",
        title: "Phenotype",
        chunks: ["chunk-vendors", "chunk-common", "phenotype"],
    },
    region: {
        entry: "src/views/Region/main.js",
        template: "public/index.html",
        filename: "region.html",
        title: "Region Info",
        chunks: ["chunk-vendors", "chunk-common", "region"],
    },
    variant: {
        entry: "src/views/Variant/main.js",
        template: "public/index.html",
        filename: "variant.html",
        title: "Variant Info",
        chunks: ["chunk-vendors", "chunk-common", "variant"],
    },
    gene: {
        entry: "src/views/Gene/main.js",
        template: "public/index.html",
        filename: "gene.html",
        title: "Gene Info",
        chunks: ["chunk-vendors", "chunk-common", "gene"],
    },
    datasets: {
        entry: "src/views/Datasets/main.js",
        template: "public/index.html",
        filename: "datasets.html",
        title: "Datasets",
        chunks: ["chunk-vendors", "chunk-common", "datasets"],
    },
    dinspector: {
        entry: "src/views/DatasetInspector/main.js",
        template: "public/index.html",
        filename: "dinspector.html",
        title: "Dataset Inspector",
        chunks: ["chunk-vendors", "chunk-common", "dinspector"],
    },
    downloads: {
        entry: "src/views/Downloads/main.js",
        template: "public/index.html",
        filename: "downloads.html",
        title: "Downloads",
        chunks: ["chunk-vendors", "chunk-common", "downloads"],
    },
    policies: {
        entry: "src/views/Policies/main.js",
        template: "public/index.html",
        filename: "policies.html",
        title: "Policies",
        chunks: ["chunk-vendors", "chunk-common", "policies"],
    },
    about: {
        entry: "src/views/About/main.js",
        template: "public/index.html",
        filename: "about.html",
        title: "About",
        chunks: ["chunk-vendors", "chunk-common", "about"],
    },
    collaborate: {
        entry: "src/views/Collaborate/main.js",
        template: "public/index.html",
        filename: "collaborate.html",
        title: "Collaborate",
        chunks: ["chunk-vendors", "chunk-common", "collaborate"],
    },
    resources: {
        entry: "src/views/Resources/main.js",
        template: "public/index.html",
        filename: "resources.html",
        title: "Resources",
        chunks: ["chunk-vendors", "chunk-common", "resources"],
    },
    publications: {
        entry: "src/views/Publications/main.js",
        template: "public/index.html",
        filename: "publications.html",
        title: "Publications",
        chunks: ["chunk-vendors", "chunk-common", "publications"],
    },
    news: {
        entry: "src/views/News/main.js",
        template: "public/index.html",
        filename: "news.html",
        title: "News",
        chunks: ["chunk-vendors", "chunk-common", "news"],
    },
    contacts: {
        entry: "src/views/Contacts/main.js",
        template: "public/index.html",
        filename: "contacts.html",
        title: "Contacts",
        chunks: ["chunk-vendors", "chunk-common", "contacts"],
    },
    kplab: {
        entry: "src/views/KPLab/main.js",
        template: "public/index.html",
        filename: "kplab.html",
        title: "KP Lab",
        chunks: ["chunk-vendors", "chunk-common", "kplab"],
    },
    apis: {
        entry: "src/views/Apis/main.js",
        template: "public/index.html",
        filename: "apis.html",
        title: "APIs",
        chunks: ["chunk-vendors", "chunk-common", "apis"],
    },
    epigeneticdatasets: {
        entry: "src/views/EpigeneticDatasets/main.js",
        template: "public/index.html",
        filename: "epigeneticdatasets.html",
        title: "Epigenetic Datasets",
        chunks: ["chunk-vendors", "chunk-common", "epigeneticdatasets"],
    },
    epigenomicdatasets: {
        entry: "src/views/EpigenomicDatasets/main.js",
        template: "public/index.html",
        filename: "epigenomicdatasets.html",
        title: "Epigenomic Datasets",
        chunks: ["chunk-vendors", "chunk-common", "epigenomicdatasets"],
    },
    ampt2dpartnership: {
        entry: "src/views/AmpT2dPartnership/main.js",
        template: "public/index.html",
        filename: "ampt2dpartnership.html",
        title: "AMP T2D Partnership",
        chunks: ["chunk-vendors", "chunk-common", "ampt2dpartnership"],
    },
    effectorgenes: {
        entry: "src/views/EffectorGenes/main.js",
        template: "public/index.html",
        filename: "effectorgenes.html",
        title: "Predicted Effector Genes Research Methods",
        chunks: ["chunk-vendors", "chunk-common", "effectorgenes"],
    },
    eglmethod: {
        entry: "src/views/EglMethod/main.js",
        template: "public/index.html",
        filename: "method.html",
        title: "Research Method",
        chunks: ["chunk-vendors", "chunk-common", "eglmethod"],
    },
    hugecalculator: {
        entry: "src/views/HuGeCalculator/main.js",
        template: "public/index.html",
        filename: "hugecalculator.html",
        title: "HuGe Calculator",
        chunks: ["chunk-vendors", "chunk-common", "hugecalculator"],
    },
    genesifter: {
        entry: "src/views/GeneSifter/main.js",
        template: "public/index.html",
        filename: "genesifter.html",
        title: "Gene Sifter",
        chunks: ["chunk-vendors", "chunk-common", "genesifter"],
    },
    signalsifter: {
        entry: "src/views/SignalSifter/main.js",
        template: "public/index.html",
        filename: "signalsifter.html",
        title: "Signal Sifter",
        chunks: ["chunk-vendors", "chunk-common", "signalsifter"],
    },
    complicationsviewer: {
        entry: "src/views/ComplicationsViewer/main.js",
        template: "public/index.html",
        filename: "complicationsviewer.html",
        title: "Complications Viewer",
        chunks: ["chunk-vendors", "chunk-common", "complicationsviewer"],
    },

    page404: {
        entry: "src/views/404/main.js",
        template: "public/index.html",
        filename: "404.html",
        title: "Page Not Found",
        chunks: ["chunk-vendors", "chunk-common", "page404"],
    },
    gait: {
        entry: "src/views/GAIT/main.js",
        template: "public/index.html",
        filename: "gait.html",
        title: "Genetic Association Interactive Tool",
        chunks: ["chunk-vendors", "chunk-common", "gait"],
    },
    gait2: {
        entry: "src/views/GAIT2/main.js",
        template: "public/index.html",
        filename: "ncgait.html",
        title: "Non-Coding Genetic Association Interactive Tool",
        chunks: ["chunk-vendors", "chunk-common", "gait2"],
    },
    project: {
        entry: "src/views/Project/main.js",
        template: "public/index.html",
        filename: "project.html",
        title: "Project",
        chunks: ["chunk-vendors", "chunk-common", "project"],
    },
    variantsearch: {
        entry: "src/views/VariantSearch/main.js",
        template: "public/index.html",
        filename: "variantsearch.html",
        title: "Variant Search",
        chunks: ["chunk-vendors", "chunk-common", "variantsearch"],
    },
    research: {
        entry: "src/views/Papers/Research/main.js",
        template: "public/index.html",
        filename: "research.html",
        title: "Research",
        chunks: ["chunk-vendors", "chunk-common", "research"],
    },
    egggenerator: {
        entry: "src/views/EggGenerator/main.js",
        template: "public/index.html",
        filename: "egggenerator.html",
        title: "Exome Gene-Level Group-file Generator",
        chunks: ["chunk-vendors", "chunk-common", "egggenerator"],
    },
    help: {
        entry: "src/views/Help/main.js",
        template: "public/index.html",
        filename: "help.html",
        title: "Help",
        chunks: ["chunk-vendors", "chunk-common", "help"],
    },
    tissue: {
        entry: "src/views/Tissue/main.js",
        template: "public/index.html",
        filename: "tissue.html",
        title: "Tissue",
        chunks: ["chunk-vendors", "chunk-common", "tissue"],
    },
    pigean_index: {
        entry: "src/views/PIGEAN/Index/main.js",
        template: "public/index.html",
        filename: "pigean/index.html",
        title: "PIGEAN Home",
        chunks: ["chunk-vendors", "chunk-common", "pigean_index"],
    },
    pigean_gene: {
        entry: "src/views/PIGEAN/Gene/main.js",
        template: "public/index.html",
        filename: "pigean/gene.html",
        title: "PIGEAN Gene Info",
        chunks: ["chunk-vendors", "chunk-common", "pigean_gene"],
    },
    pigean_geneset: {
        entry: "src/views/PIGEAN/GeneSet/main.js",
        template: "public/index.html",
        filename: "pigean/geneset.html",
        title: "PIGEAN Gene Set Info",
        chunks: ["chunk-vendors", "chunk-common", "pigean_geneset"],
    },
    pigean_phenotype: {
        entry: "src/views/PIGEAN/Phenotype/main.js",
        template: "public/index.html",
        filename: "pigean/phenotype.html",
        title: "PIGEAN Phenotype",
        chunks: ["chunk-vendors", "chunk-common", "pigean_phenotype"],
    },
    network_graph: {
        entry: "src/views/PIGEAN/NetworkGraph/main.js",
        template: "public/index.html",
        filename: "pigean/network_graph.html",
        title: "Network Graph",
        chunks: ["chunk-vendors", "chunk-common", "network_graph"],
    },
    factorization: {
        entry: "src/views/Factorization/main.js",
        template: "public/index.html",
        filename: "factorization.html",
        title: "Gene Set Factorization Server",
        chunks: ["chunk-vendors", "chunk-common", "factorization"],
    },
    mouse_diff_exp: {
        entry: "src/views/MouseDiffExp/main.js",
        template: "public/index.html",
        filename: "mouse_diff_exp.html",
        title: "Mouse Differential Expression",
        chunks: ["chunk-vendors", "chunk-common", "mouse_diff_exp"],
    },
};

// remove the debug page in production
if (process.env.NODE_ENV === "production") {
    delete pages.debug;
    delete pages.mouse_diff_exp;
}

module.exports = {
    devServer: {
        writeToDisk: true, // https://webpack.js.org/configuration/dev-server/#devserverwritetodisk-
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
    },
    configureWebpack: (config) => {
        let bioindex_dev = process.env.BIOINDEX_DEV;
        let bioindex_host =
            process.env.BIOINDEX_HOST || "https://bioindex.hugeamp.org"; // production by default
        //set private bioindex host if variable is defined, otherwise use default
        let bioindex_host_private =
            process.env.BIOINDEX_HOST_PRIVATE || "https://bioindex.hugeamp.org";

        if (!!bioindex_dev && !process.env.BIOINDEX_HOST) {
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
                flags: "g",
            },
        });

        // add the transform rule for bioindex
        config.module.rules.push({
            test: /bioIndexUtils\.js$/,
            loader: "string-replace-loader",
            options: {
                search: "SERVER_IP_PRIVATE",
                replace: bioindex_host_private,
                flags: "g",
            },
        });

        // Add the rule for handling .js files with babel-loader
        config.module.rules.push({
            test: /\.js$/,
            include: [/node_modules\/vis-network/, /node_modules\/vis-data/],
            use: {
                loader: "babel-loader",
                options: {
                    presets: ["@babel/preset-env"],
                    plugins: ["@babel/plugin-transform-runtime"],
                },
            },
        });
        config.resolve.alias = {
            ...config.resolve.alias,
            "vis-network": "vis-network/standalone/umd/vis-network.min.js",
            "vis-data": "vis-data/standalone/umd/vis-data.min.js",
        };
        // create inline maps for dev builds
        if (process.env.NODE_ENV !== "production") {
            //config.devtool = "inline-source-map";

            //https://stackoverflow.com/questions/48047150/chrome-extension-compiled-by-webpack-throws-unsafe-eval-error
            config.devtool = "cheap-module-source-map";
        }
    },
    productionSourceMap: false,
    pages,
};
