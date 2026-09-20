import next from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      "legacy/**",
      "functions/**",
      ".next/**",
      ".next-preview/**",
      "node_modules/**",
      "build/**",
    ],
  },
  ...next,
];

export default eslintConfig;
