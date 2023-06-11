const { kResolveExtensions, useTypeScriptOnlyRules } = require('../eslint.rules.cjs')

/** @return {import('@typescript-eslint/eslint-plugin').TSESLint.Linter.RulesRecord} */
module.exports = {
  extends: [
    './esmodule.cjs',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  settings: {
    'import/extensions': kResolveExtensions,
    'import/external-module-folders': ['node_modules', 'node_modules/@types'],
    'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
    'import/resolver': {
      node: { extensions: kResolveExtensions },
      typescript: { }
    }
  },
  rules: {
    ...useTypeScriptOnlyRules()
  }
}
