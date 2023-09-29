import { useViewer } from 'store/store'
import { logout, login, register } from 'store/graphql'

export function useLogin() {
  const [viewer, setViewer] = useViewer()

  return {
    viewer,
    login: (email: string, password: string) => {
      return login(email, password).then((viewer) => {
        if (viewer.type === 'success') {
          setViewer(viewer.user)
          return null
        } else {
          return viewer.message
        }
      })
    },
    register: (email: string, password: string, name: string) => {
      return register(email, password, name).then((viewer) => {
        if (viewer.type === 'success') {
          setViewer(viewer.user)
          return null
        } else {
          return viewer.message
        }
      })
    },
    logout: (evt?: any) => {
      if (evt) evt.preventDefault()
      logout()
        .then(() => {
          setViewer(null)
        })
        .catch((e) => {
          console.error(e)
        })
    },
  }
}
