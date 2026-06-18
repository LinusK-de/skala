// ESLint flat config — https://docs.expo.dev/guides/using-eslint/
// eslint-config-prettier is last so it disables rules that would conflict with Prettier.
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  ...[].concat(expoConfig),
  eslintConfigPrettier,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'src/db/migrations/*'],
  },
];
