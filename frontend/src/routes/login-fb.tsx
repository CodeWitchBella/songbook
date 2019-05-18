/** @jsx jsx */
import { jsx } from '@emotion/core'
import { errorBoundary } from 'containers/error-boundary'
import { Link } from 'react-router-dom'
import { useQueryParam, useHistoryChange } from 'components/use-router'
import { useEffect } from 'react'
import { fbLogin } from 'store/graphql'
import { useViewer } from 'store/store'

function LoginFB() {
  const [, setViewer] = useViewer()
  const history = useHistoryChange()
  const [code] = useQueryParam('code')
  const [error] = useQueryParam('error')
  useEffect(() => {
    if (error === 'access_denied' || code === null) history.replace('/')
  })
  useEffect(() => {
    if (code)
      fbLogin(code).then(viewer => {
        console.log('Setting viewer to', viewer)
        setViewer(viewer)
        history.replace('/')
      })
  }, [code, history, setViewer])
  return (
    <div css={{ fontSize: 18, margin: '0 auto', padding: 10, maxWidth: 650 }}>
      <p>Přihlašuji tě...</p>

      <Link to="/">Zpět na seznam písní</Link>
      <p
        css={{
          fontFamily: 'mono',
          wordWrap: 'break-word',
          wordBreak: 'break-all',
        }}
        onClick={() => {
          if (code) navigator.clipboard.writeText(code)
        }}
      >
        {code}
      </p>
    </div>
  )
}
export default errorBoundary(LoginFB)
