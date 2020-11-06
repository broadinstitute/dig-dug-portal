const { defaults } = require('jest-config');
module.exports = {
  verbose: true,
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'js', 'json', 'vue'],
  transform: {
    // process `*.vue` files with `vue-jest`
    ".*\\.(vue)$": "vue-jest"
  },
  moduleNameWrapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  collectCoverage: true,
  collectCoverageFrom: ["**/*.{js,vue}", "!**/node_modules/**"]
};
