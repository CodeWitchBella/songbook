import React from 'react'

const months = [
  'ledna',
  'února',
  'března',
  'dubna',
  'května',
  'června',
  'července',
  'srpna',
  'září',
  'října',
  'listopadu',
  'prosince',
]

const ChangelogEntry: React.SFC<{ date: string }> = ({ date, children }) => (
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
        const parts = date.split('-').map(n => Number.parseInt(n, 10))
        return `${parts[2]}. ${months[parts[1] - 1]} ${parts[0]}`
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

export default ChangelogEntry
