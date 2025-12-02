/**
 * Prettier configuration
 * - Includes Tailwind plugin to auto-order classnames
 */
module.exports = {
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindConfig: "./tailwind.config.ts",
  semi: true,
  singleQuote: false,
  printWidth: 100,
  tabWidth: 2,
  trailingComma: "all",
};
