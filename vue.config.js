module.exports = {
  devServer: {
    writeToDisk: true // https://webpack.js.org/configuration/dev-server/#devserverwritetodisk-
  },
  pages: {
    manhattan: {
      entry: "src/views/Manhattan/main.js",
      template: "public/index.html",
      filename: "manhattan.html",
      title: "Manhattan Page",
      chunks: ["chunk-vendors", "chunk-common", "manhattan"]
    },
    geneFinder: {
      entry: "src/views/GeneFinder/main.js",
      template: "public/index.html",
      filename: "geneFinder.html",
      title: "Gene Finder",
      chunks: ["chunk-vendors", "chunk-common", "geneFinder"]
    }
  }
};
