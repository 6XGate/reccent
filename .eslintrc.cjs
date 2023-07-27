require('@rushstack/eslint-patch/modern-module-resolution')

/* eslint-env node */
const { defineConfig } = require('./scripts/eslint/eslint.rules.cjs')

module.exports = defineConfig({
  root: true,
  reportUnusedDisableDirectives: true,
  parserOptions: {
    ecmaVersion: 'latest'
  },
  overrides: [
    {
      files: ['*.cjs'],
      extends: './scripts/eslint/configs/javascript.cjs'
    },
    {
      files: ['*.js', '*.mjs', '*.jsx'],
      extends: './scripts/eslint/configs/ecmascript.cjs'
    },
    // HACK: Not sure why the projects don't work if this is not specified twice, for projects then rules.
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: [
          './tsconfig.esm.json',
          './tsconfig.node.json'
        ]
      }
    },
    {
      files: ['*.ts', '*.tsx'],
      extends: './scripts/eslint/configs/typescript.cjs'
    }
  ]
})
