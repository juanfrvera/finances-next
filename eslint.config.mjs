import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow unused variables with underscore prefix
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      // Allow any type in some cases - mainly for chart libraries and legacy components
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  {
    // Exclude MongoDB playground files
    ignores: ["**/playgrounds/**/*.js", "**/playgrounds/**/*.mongodb.js"]
  }
];

export default eslintConfig;
