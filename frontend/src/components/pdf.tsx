import loadable from '@loadable/component'

const PDF = loadable(() =>
  import(/* webpackChunkName: "components_pdf-render" */ './pdf-render'),
)
export default PDF
