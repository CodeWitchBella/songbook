import { useNavigate } from 'react-router'
import { useEffect } from 'react'

export default function InstalledHome() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/', { replace: true })
    // history.push('/all-songs', { canGoBack: true })
  }, [navigate])
  return null
}
