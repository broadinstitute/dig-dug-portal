/* We define all the pages first in an object that can be modified BEFORE being
 * exported so we can add/remove pages based on build type.
 */

let pages = {
    index: {
        entry: "src/portals/PanKbase/views/Index/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "index.html",
        title: "PanKbase",
        chunks: ["chunk-vendors", "chunk-common", "index"],
    },
    page404: {
        entry: "src/views/404/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "404.html",
        title: "Page Not Found",
        chunks: ["chunk-vendors", "chunk-common", "page404"],
    },
    databrowser: {
        entry: "src/portals/PanKbase/views/DataBrowser/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "data-browser.html",
        title: "Data Browser",
        chunks: ["chunk-vendors", "chunk-common", "databrowser"],
    },
    singlecell: {
        entry: "src/portals/PanKbase/views/SingleCell/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "single-cell.html",
        title: "Single Cell",
        chunks: ["chunk-vendors", "chunk-common", "singlecell"],
    },
    analyticallibrary: {
        entry: "src/portals/PanKbase/views/AnalyticalLibrary/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "analytical-library.html",
        title: "Analytical Library",
        chunks: ["chunk-vendors", "chunk-common", "analyticallibrary"]
    },
    metadata: {
        entry: "src/portals/PanKbase/views/MetadataDataStandards/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "metadata-data-standards.html",
        title: "Metadata | Data Standards",
        chunks: ["chunk-vendors", "chunk-common", "metadata"]
    },
    tools: {
        entry: "src/portals/PanKbase/views/ToolsPipelines/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "tools-pipelines.html",
        title: "Tools | Pipelines",
        chunks: ["chunk-vendors", "chunk-common", "tools"]
    },
    projects: {
        entry: "src/portals/PanKbase/views/Projects/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "projects.html",
        title: "Projects",
        chunks: ["chunk-vendors", "chunk-common", "projects"],
    },
    programs: {
        entry: "src/portals/PanKbase/views/Programs/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "programs.html",
        title: "Programs",
        chunks: ["chunk-vendors", "chunk-common", "programs"],
    },
    people: {
        entry: "src/portals/PanKbase/views/People/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "people.html",
        title: "People",
        chunks: ["chunk-vendors", "chunk-common", "people"],
    },
    publications: {
        entry: "src/portals/PanKbase/views/Publications/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "publications.html",
        title: "Publications",
        chunks: ["chunk-vendors", "chunk-common", "publications"],
    },
    contact: {
        entry: "src/portals/PanKbase/views/Contact/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "contact.html",
        title: "Contact",
        chunks: ["chunk-vendors", "chunk-common", "contact"],
    },
    collaborate: {
        entry: "src/portals/PanKbase/views/Collaborate/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "collaborate.html",
        title: "Collaborate",
        chunks: ["chunk-vendors", "chunk-common", "collaborate"]
    },
    policies: {
        entry: "src/portals/PanKbase/views/Policies/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "policies.html",
        title: "Policies",
        chunks: ["chunk-vendors", "chunk-common", "policies"]
    },
    tutorials: {
        entry: "src/portals/PanKbase/views/Tutorials/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "tutorials.html",
        title: "Tutorials",
        chunks: ["chunk-vendors", "chunk-common", "tutorials"]
    },
    hpap: {
        entry: "src/portals/PanKbase/views/HPAP/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "hpap-program.html",
        title: "HPAP",
        chunks: ["chunk-vendors", "chunk-common", "hpap"]
    },
    iidp: {
        entry: "src/portals/PanKbase/views/IIDP/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "iidp-program.html",
        title: "IIDP",
        chunks: ["chunk-vendors", "chunk-common", "iidp"]
    },
    npod: {
        entry: "src/portals/PanKbase/views/NPOD/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "npod-program.html",
        title: "nPOD",
        chunks: ["chunk-vendors", "chunk-common", "npod"]
    },
    pancreatlas: {
        entry: "src/portals/PanKbase/views/Pancreatlas/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "pancreatlas-program.html",
        title: "Pancreatlas",
        chunks: ["chunk-vendors", "chunk-common", "pancreatlas"]
    },
    prodo: {
        entry: "src/portals/PanKbase/views/Prodo/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "prodo-program.html",
        title: "Prodo",
        chunks: ["chunk-vendors", "chunk-common", "prodo"]
    },
    adi: {
        entry: "src/portals/PanKbase/views/ADI/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "adi-program.html",
        title: "ADI",
        chunks: ["chunk-vendors", "chunk-common", "adi"]
    },
    apis: {
        entry: "src/portals/PanKbase/views/APIs/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "apis.html",
        title: "APIs",
        chunks: ["chunk-vendors", "chunk-common", "apis"]
    },
    news: {
        entry: "src/portals/PanKbase/views/News/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "news.html",
        title: "News",
        chunks: ["chunk-vendors", "chunk-common", "news"]
    },
    donormetadata: {
        entry: "src/portals/PanKbase/views/DonorMetadata/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "donor-metadata.html",
        title: "Donor Metadata",
        chunks: ["chunk-vendors", "chunk-common", "donormetadata"]
    },
    pcaexplorer: {
        entry: "src/portals/PanKbase/views/PCAExplorer/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "pca-explorer.html",
        title: "PCA Explorer",
        chunks: ["chunk-vendors", "chunk-common", "pcaexplorer"]
    },
    diffexp: {
        entry: "src/portals/PanKbase/views/DiffExp/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "diff-exp.html",
        title: "Differential Expression",
        chunks: ["chunk-vendors", "chunk-common", "diffexp"]    
    },
    funding: {
        entry: "src/portals/PanKbase/views/Funding/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "funding.html",
        title: "Funding Opportunities",
        chunks: ["chunk-vendors", "chunk-common", "funding"]    
    },
    gene: {
        entry: "src/portals/PanKbase/views/Gene/main.js",
        template: "src/portals/PanKbase/index.html",
        filename: "gene.html",
        title: "Gene",
        chunks: ["chunk-vendors", "chunk-common", "gene"]    
    }
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
