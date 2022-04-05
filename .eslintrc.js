module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-use-before-define': 'off',
    'import/prefer-default-export': 'off',
    'no-restricted-syntax': 'off',
    'no-continue': 'off',
  },
  global: {
    require: false,
  },
};
