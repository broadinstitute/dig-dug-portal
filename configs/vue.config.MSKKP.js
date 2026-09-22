const baseConfig = require("../vue.config");

module.exports = {
    ...baseConfig,
    pages: {
        ...baseConfig.pages,
        index: {
            ...baseConfig.pages.index,
            entry: "src/views/MskkpIndex/main.js",
            filename: "index.html",
            title: "MSKKP Home",
            chunks: ["chunk-vendors", "chunk-common", "index"],
        },
    },
};
