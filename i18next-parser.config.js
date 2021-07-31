module.exports = {
  defaultValue: (locale, namespace, key) => (locale === 'en' ? key : ''),
  locales: ['en', 'cs'],
  output: 'src/locales/$NAMESPACE-$LOCALE.json',
  input: ['src/**/*.{ts,tsx}'],
  sort: true,
  failOnWarnings: true,
}
