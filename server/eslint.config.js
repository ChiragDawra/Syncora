const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/', 'coverage/', 'uploads/', 'logs/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs', globals: { ...globals.node } },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'no-console': ['warn', { allow: ['error'] }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },
  { files: ['tests/**/*.js'], languageOptions: { globals: { ...globals.jest } } },
  { files: ['scripts/**/*.js'], rules: { 'no-console': 'off' } },
];
