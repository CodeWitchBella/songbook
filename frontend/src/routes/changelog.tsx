import { hot } from 'react-hot-loader'
import React from 'react'

const Entry: React.SFC<{ date: string }> = ({ date, children }) => (
  <div
    css={`
      font-size: 20px;
      padding: 0 10px;
    `}
  >
    <h2
      css={`
        margin: 10px 0 0 0;
      `}
    >
      {(() => {
        const parts = date.split('-')
        return `${Number.parseInt(parts[2], 10)}. ${Number.parseInt(
          parts[1],
          10,
        )}. ${parts[0]}`
      })()}
    </h2>
    <div
      css={`
        padding-left: 10px;
      `}
    >
      {children}
    </div>
  </div>
)

const Changelog = () => (
  <div>
    <Entry date="2018-08-15">Započata práce na PDF exportu</Entry>
    <Entry date="2018-08-10">Přidán changelog</Entry>
  </div>
)
export default hot(module)(Changelog)
