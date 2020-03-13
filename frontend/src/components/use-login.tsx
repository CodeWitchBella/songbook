import { useViewer } from 'store/store'
import { fbLogin, logout, login, register } from 'store/graphql'

function randomString(length: number) {
  let result = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

const origin = `${window.location.protocol}//${window.location.host}`
const redirectUri = `${origin}/static/fb-login.html`

function createUrl(state: string) {
  return (
    'https://www.facebook.com/v3.3/dialog/oauth?' +
    new URLSearchParams({
      client_id: '331272811153847',
      redirect_uri: redirectUri,
      state,
      scope: 'email',
    }).toString()
  )
}

export function useLogin() {
  const [viewer, setViewer] = useViewer()

  return {
    viewer,
    login: (email: string, password: string) => {
      return login(email, password).then(viewer => {
        if (viewer.type === 'success') {
          setViewer(viewer.user)
          return null
        } else {
          return viewer.message
        }
      })
    },
    register: (email: string, password: string, name: string) => {
      return register(email, password, name).then(viewer => {
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
        .catch(e => {
          console.error(e)
        })
    },
  }
}
