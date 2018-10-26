module.exports = {
  'env': {
    'browser': true,
  },
  'extends': 'airbnb-base',
  'parserOptions': {
    'ecmaFeatures': {
      'jsx': true,
    },
  },
  'plugins': [
    'import',
    'react',
  ],
  'rules': {
    'jsx-quotes': ['error', 'prefer-single'],
    'no-unused-vars': [2, { 'varsIgnorePattern': 'h' }],
    'react/jsx-indent': [2, 2],
    'react/jsx-uses-vars': 2,
    'quotes': [2, 'single', { 'avoidEscape': true }],
  },
};
