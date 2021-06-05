import React from 'react'
import styled from '@emotion/styled'

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

const Entry = styled.div`
  font-size: 20px;
  padding: 0 10px;
  ul {
    margin-top: 0;
  }
  max-width: 80ch;
`

const H2 = styled.h2`
  margin: 10px 0 0 0;
`

const Padding = styled.div`
  padding-left: 10px;
  padding-top: 10px;
`

const ChangelogEntry: React.SFC<{ date: string }> = ({ date, children }) => (
  <Entry>
    <H2>
      {(() => {
        const parts = date.split('-').map((n) => Number.parseInt(n, 10))
        return `${parts[2]}. ${months[parts[1] - 1]} ${parts[0]}`
      })()}
    </H2>
    <Padding>
      <ul>{children}</ul>
    </Padding>
  </Entry>
)

export default ChangelogEntry
