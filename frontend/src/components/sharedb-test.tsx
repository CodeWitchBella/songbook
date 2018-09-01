import React from 'react'
import ShareDBDoc from 'components/sharedb-doc'

const ShareDBTest = () => (
  <ShareDBDoc<{ numClicks: number }> collection="example" id="counter">
    {({ data, doc }) =>
      !doc || !data ? null : (
        <button onClick={() => doc.submitOp([{ p: ['numClicks'], na: 1 }])}>
          {data.numClicks}
        </button>
      )
    }
  </ShareDBDoc>
)
export default ShareDBTest