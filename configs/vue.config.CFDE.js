/* We define all the pages first in an object that can be modified BEFORE being
 * exported so we can add/remove pages based on build type.
 */

let pages = {
    index: {
        entry: "src/views/Papers/Research/main.js",
        template: "public/index.html",
        filename: "index.html",
        title: "Home",
        chunks: ["chunk-vendors", "chunk-common", "research"],
    },
    page404: {
        entry: "src/views/404/main.js",
        template: "public/index.html",
        filename: "404.html",
        title: "Page Not Found",
        chunks: ["chunk-vendors", "chunk-common", "page404"],
    },
    research: {
        entry: "src/views/Papers/Research/main.js",
        template: "public/index.html",
        filename: "research.html",
        title: "Research",
        chunks: ["chunk-vendors", "chunk-common", "research"],
    },
};

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
