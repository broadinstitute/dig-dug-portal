module.exports = {
    testMatch: [
        "**/revealKgWorkspace/__tests__/**/*.test.js",
        "**/revealMultiQueryWorkflow/__tests__/**/*.test.js",
    ],
    transform: {
        "^.+\\.js$": "babel-jest",
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    testEnvironment: "node",
};
