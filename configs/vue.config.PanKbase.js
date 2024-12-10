/* We define all the pages first in an object that can be modified BEFORE being
 * exported so we can add/remove pages based on build type.
 */

let pages = {
    index: {
        entry: "src/portals/PanKbase/views/Index/main.js",
        template: "public/index.html",
        filename: "index.html",
        title: "PanKbase",
        chunks: ["chunk-vendors", "chunk-common", "index"],
    },
    page404: {
        entry: "src/views/404/main.js",
        template: "public/index.html",
        filename: "404.html",
        title: "Page Not Found",
        chunks: ["chunk-vendors", "chunk-common", "page404"],
    },
    databrowser: {
        entry: "src/portals/PanKbase/views/DataBrowser/main.js",
        template: "public/index.html",
        filename: "databrowser.html",
        title: "Data Browser",
        chunks: ["chunk-vendors", "chunk-common", "databrowser"],
    },
    singlecell: {
        entry: "src/portals/PanKbase/views/SingleCell/main.js",
        template: "public/index.html",
        filename: "singlecell.html",
        title: "Single Cell",
        chunks: ["chunk-vendors", "chunk-common", "singlecell"],
    },
    about: {
        entry: "src/portals/PanKbase/views/About/main.js",
        template: "public/index.html",
        filename: "about.html",
        title: "About",
        chunks: ["chunk-vendors", "chunk-common", "about"],
    },
    programs: {
        entry: "src/portals/PanKbase/views/Programs/main.js",
        template: "public/index.html",
        filename: "programs.html",
        title: "Programs",
        chunks: ["chunk-vendors", "chunk-common", "programs"],
    },
    people: {
        entry: "src/portals/PanKbase/views/People/main.js",
        template: "public/index.html",
        filename: "people.html",
        title: "People",
        chunks: ["chunk-vendors", "chunk-common", "people"],
    },
    help: {
        entry: "src/portals/PanKbase/views/Help/main.js",
        template: "public/index.html",
        filename: "help.html",
        title: "Help",
        chunks: ["chunk-vendors", "chunk-common", "help"],
    },
    contact: {
        entry: "src/portals/PanKbase/views/Contact/main.js",
        template: "public/index.html",
        filename: "contact.html",
        title: "Contact",
        chunks: ["chunk-vendors", "chunk-common", "contact"],
    },
};

module.exports = {
    devServer: {
        writeToDisk: true, // https://webpack.js.org/configuration/dev-server/#devserverwritetodisk-
    },
    configureWebpack: (config) => {
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
                flags: "g",
            },
        });

        config.module.rules.push({
            test: /bioIndexUtils\.js$/,
            loader: "string-replace-loader",
            options: {
                search: "SERVER_IP_PRIVATE",
                replace: bioindex_host_private,
                flags: "g",
            },
        });

        // create inline maps for dev builds
        if (process.env.NODE_ENV !== "production") {
            //config.devtool = "inline-source-map";

            //https://stackoverflow.com/questions/48047150/chrome-extension-compiled-by-webpack-throws-unsafe-eval-error
            config.devtool = "cheap-module-source-map";
        }
    },
    outputDir: "portals/PanKbase",
    productionSourceMap: false,
    pages,
};
