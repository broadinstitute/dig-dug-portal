/* We define all the pages first in an object that can be modified BEFORE being
 * exported so we can add/remove pages based on build type.
 */

let pages = {
    index: {
        entry: "src/views/RPIndex/main.js",
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
    paper: {
        entry: "src/views/Papers/Paper/main.js",
        template: "public/index.html",
        filename: "paper.html",
        title: "Paper",
        chunks: ["chunk-vendors", "chunk-common", "paper"]
    },
    paperdata: {
        entry: "src/views/Papers/PaperData/main.js",
        template: "public/index.html",
        filename: "paperdata.html",
        title: "Paper Data",
        chunks: ["chunk-vendors", "chunk-common", "paperdata"]
    },
    research: {
        entry: "src/views/Papers/Research/main.js",
        template: "public/index.html",
        filename: "research.html",
        title: "Research",
        chunks: ["chunk-vendors", "chunk-common", "research"]
    }
};

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

        // output which vue config file and bioindex is being used
        console.log(
            `VUE_CONFIG_PATH=${process.env.VUE_CLI_SERVICE_CONFIG_PATH}; BIOINDEX_DEV=${process.env.BIOINDEX_DEV}; using ${bioindex_host}`
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
            //config.devtool = "inline-source-map";

            //https://stackoverflow.com/questions/48047150/chrome-extension-compiled-by-webpack-throws-unsafe-eval-error
            config.devtool = "cheap-module-source-map";
        }
    },
    outputDir: "distPapers",
    productionSourceMap: false,
    pages
};
