import styled from '@emotion/styled'
import { TText } from './themed'
import { View } from 'react-native'
import { useLanguage } from './localisation'

// prettier-ignore
const months = {
  cs: [ 'ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince' ],
  en: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
}

const Entry = styled.div`
  font-size: 20px;
  padding: 0 10px;
  ul {
    margin: 0;
  }
  max-width: 80ch;
  margin-top: 16px;
`

export function ChangelogEntry({
  date,
  children,
}: {
  date: string
  children: null | JSX.Element | readonly JSX.Element[]
}) {
  const [lng] = useLanguage()
  return (
    <Entry>
      <TText style={{ fontSize: 20, fontWeight: 'bold' }}>
        {(() => {
          const parts = date.split('-').map((n) => Number.parseInt(n, 10))
          return `${parts[2]}${lng === 'cs' ? '.' : ''} ${
            months[lng][parts[1] - 1]
          } ${parts[0]}`
        })()}
      </TText>
      <View>{children}</View>
    </Entry>
  )
}
