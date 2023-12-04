module.exports = {
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
  testTimeout: 20000,
  roots: ["<rootDir>"],
  testPathIgnorePatterns: ["/node_modules/"],
  coverageReporters: ["json-summary"],
  clearMocks: true,
  moduleNameMapper: {
    "^uuid$": require.resolve("uuid"),
  },
};
