module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
  ],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    'no-use-before-define': 'off',
    'vars-on-top': 'off',
    'no-var': 'off',
    'no-alert': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    'react/jsx-filename-extension': 'off',
    'react/no-array-index-key': 'off',
    'prefer-const': 'off',
    'prefer-template': 'off'
  },
};
