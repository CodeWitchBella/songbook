module.exports = {
  defaultValue: (locale, namespace, key) => {
    if (locale !== 'en') return ''
    const parts = key.split('.')
    return parts[parts.length - 1]
  },
  locales: ['en', 'cs'],
  output: 'src/locales/$NAMESPACE-$LOCALE.json',
  input: ['src/**/*.{ts,tsx}'],
  sort: true,
  failOnWarnings: true,
  namespaceSeparator: '~',
}
