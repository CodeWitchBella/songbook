import React from 'react'

const PDF = React.lazy(() =>
  import(/* webpackChunkName: "components_pdf-render" */ './pdf-render'),
)
export default PDF
