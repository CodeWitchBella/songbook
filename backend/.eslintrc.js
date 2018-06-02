module.exports = {
  extends: ['airbnb-base', 'prettier', 'plugin:react/recommended'],
  plugins: ['prettier', 'import', 'react'],
  parser: 'typescript-eslint-parser',
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        //parser: 'typescript',
        trailingComma: 'all',
        semi: false,
      },
    ],
    'no-unexpected-multiline': 0,
    'no-restricted-syntax': 0,
    'spaced-comment': 0,
    'import/prefer-default-export': 0,
    'no-continue': 0,
    'import/no-commonjs': 2,
    'no-empty': 0, // this is sometimes useful
    'no-empty-function': 0, // this is sometimes useful
    'class-methods-use-this': 0, // annoying
    'no-restricted-globals': 0, // this rule is broken - flags too much
    'prefer-destructuring': 0, // it is sometimes cleaner to write ti without destructuring
    'no-nested-ternary': 0, // usefull for sorting
    'react/prop-types': 0,
    'react/display-name': 0,
    'no-console': 0,
    'import/extensions': 0, // not working with custom imports
    'import/no-unresolved': 0,
    'no-await-in-loop': 0,
    'no-loop-funct': 0,
    'no-underscore-dangle': ['error', { allow: ['__typename'] }],
    'import/no-extraneous-dependencies': [2, { devDependencies: true }],
    'no-undef': 0, // does not work with typescript-eslint-parser
    'no-unused-vars': 0, // same
    strict: 0,
    'no-multi-str': 0,
    camelcase: 0,
    'no-use-before-define': 0, // does not work with typescript
    'no-underscore-dangle': 0,
    'import/export': 0, // incompatible with overload
    'no-redeclare': 0, // does not work with some typescript constructs
  },
  parserOptions: {
    sourceType: 'module',
  },
}
