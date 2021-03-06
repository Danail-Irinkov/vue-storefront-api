module.exports = {
  root: true,
  env: { jest: true, node: true, es6: true},
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  extends: [
    'standard',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: ['vue-storefront', '@typescript-eslint'],
  // add your custom rules here
  rules: {
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/camelcase': 0,
    semi: 'off',
    '@typescript-eslint/semi': 0,
    '@typescript-eslint/member-delimiter-style': ['error', { 'multiline': { 'delimiter': 'comma', 'requireLast': false }, 'singleline': { 'delimiter': 'comma' } }],
    '@typescript-eslint/no-empty-interface': 1,
    '@typescript-eslint/no-use-before-define': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/class-name-casing': 1,
    '@typescript-eslint/no-unused-vars': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-var-requires': 0,
    'handle-callback-err': 0,
    'prefer-promise-reject-errors': 0,
    'import/no-duplicates': ['warning'],
    // allow paren-less arrow functions
    'arrow-parens': 0,
    'prefer-arrow-callback': 1,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'no-restricted-imports': [2, { paths: ['lodash-es'] }],
    'vue-storefront/no-corecomponent-import': 'error',
    'vue-storefront/no-corecomponent': 'error',
    'vue-storefront/no-corepage-import': 'error',
    'vue-storefront/no-corepage': 'error',
    'no-console': 0,
    'no-unused-vars': 0
  },
  overrides: [
    {
      // @todo check if this is closed https://github.com/typescript-eslint/typescript-eslint/issues/342
      // This is an issue with interfaces so we need to wait until it fixed.
      files: ['core/**/*.ts'],
      rules: {
        'no-undef': 0
      }
    }
  ]
};
