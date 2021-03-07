import { useEffect } from 'react'
import { useNavigate } from 'react-router'

export default function InstalledHome() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/', { replace: true })
    navigate('/all-songs', { state: { canGoBack: true } })
  }, [history])
  return null
}
