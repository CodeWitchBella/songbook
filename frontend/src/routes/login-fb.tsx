/** @jsx jsx */
import { jsx } from '@emotion/core'
import { errorBoundary } from 'containers/error-boundary'
import { Link } from 'react-router-dom'
import { useQueryParam } from 'components/use-router'

function LoginFB() {
  const [param] = useQueryParam('code')
  return (
    <div css={{ fontSize: 18, margin: '0 auto', padding: 10, maxWidth: 650 }}>
      <p>
        Přihlášení sice proběhlo úspěšně, ale víc tato aplikace zatím neumí
        #sorryjako
      </p>

      <Link to="/">Zpět na seznam písní</Link>
      <p
        css={{
          fontFamily: 'mono',
          wordWrap: 'break-word',
          wordBreak: 'break-all',
        }}
        onClick={() => {
          if (param) navigator.clipboard.writeText(param)
        }}
      >
        {param}
      </p>
    </div>
  )
}
export default errorBoundary(LoginFB)
