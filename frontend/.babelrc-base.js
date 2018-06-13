module.exports = ({ isSSR, PRODUCTION, isModern, modules = false }) => ({
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        modules,
        //useBuiltIns: 'usage',
        targets: isSSR
          ? { node: '10.0' }
          : {
              browsers: isModern
                ? 'last 1 chrome version, last 1 edge version, last 1 firefox version, last 1 Safari version, last 1 iOS version, last 1 and_chr version, last 1 and_ff version'
                : 'defaults',
            },
      },
    ],
    '@babel/preset-react',
  ],
  plugins: [
    './babel-plugin-remove-jsx-namespace.js',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-syntax-dynamic-import',
    '@7rulnik/react-loadable/babel',
    [
      'babel-plugin-emotion',
      {
        hoist: PRODUCTION,
        sourceMap: !PRODUCTION,
        autoLabel: !PRODUCTION,
      },
    ],
    'react-hot-loader/babel',
  ].concat(PRODUCTION ? ['babel-plugin-graphql-tag'] : []),
})
