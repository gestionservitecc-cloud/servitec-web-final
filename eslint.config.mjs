import next from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      "legacy/**",
      "functions/**",
      ".next/**",
      "node_modules/**",
      "build/**",
    ],
  },
  ...next,
];
