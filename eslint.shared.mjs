const sharedRules = {
  "no-unused-vars": "off",
  curly: ["error"],
  "prefer-const": ["error"],

  "@typescript-eslint/no-unused-vars": [
    "warn",
    {
      varsIgnorePattern: "^_",
      argsIgnorePattern: "^_",
    },
  ],
};

export default sharedRules;
