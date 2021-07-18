import { useHistory } from 'react-router'
import { useEffect } from 'react'

export default function InstalledHome() {
  const history = useHistory()
  useEffect(() => {
    history.replace('/')
    // history.push('/all-songs', { canGoBack: true })
  }, [history])
  return null
}
