import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tailwind from "eslint-plugin-tailwindcss";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: { tailwindcss: tailwind },
    rules: {
      // TypeScript
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": ["warn", { minimumDescriptionLength: 3 }],
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // React Hooks
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",

      // Reduce console pollution in dev; Next strips in prod via compiler.removeConsole
      "no-console": "warn",

      // Tailwind
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-custom-classname": "off",

      // Flag TODO/FIXME comments for cleanup
      "no-warning-comments": ["warn", { terms: ["todo", "fixme"], location: "anywhere" }],
    },
  },
];

export default eslintConfig;
