import antfu from "@antfu/eslint-config";

export default antfu({
  type: "lib",
  stylistic: {
    indent: 2,
    quotes: "double",
    semi: true,
  },

  typescript: true,
  vue: true,

  rules: {
    "ts/explicit-function-return-type": "off",
    "node/prefer-global/process": "off",
    "regexp/no-unused-capturing-group": "off",
  },

  formatters: {
    /**
     * Format CSS, LESS, SCSS files, also the `<style>` blocks in Vue
     * By default uses Prettier
     */
    css: true,
    /**
     * Format HTML files
     * By default uses Prettier
     */
    html: true,
    /**
     * Format Markdown files
     * Supports Prettier and dprint
     * By default uses Prettier
     */
    markdown: "prettier",
  },

});
