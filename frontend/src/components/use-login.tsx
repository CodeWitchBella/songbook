import { useViewer } from 'store/store'
import { fbLogin } from 'store/graphql'

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
    onClick: (evt?: any) => {
      if (evt) evt.preventDefault()
      const state = randomString(20)
      localStorage.removeItem('auth')
      const child = window.open(
        createUrl(state),
        'login_window',
        'dialog=yes,width=450,height=550', //,toolbar=no,menubar=no,dependent,resizable=no,modal,titlebar=false
      )
      let interval: ReturnType<typeof setInterval> | null = null
      function unregister() {
        window.removeEventListener('storage', storageListener)
        window.removeEventListener('focus', storageListener)
        if (interval !== null) clearInterval(interval)
      }
      function storageListener() {
        const itm = localStorage.getItem('auth')
        console.log(evt, itm)
        if (itm) {
          const params = new URLSearchParams(JSON.parse(itm).search)
          if (params.get('state') !== state) return
          unregister()
          const code = params.get('code')
          if (!code) return
          fbLogin(code, redirectUri)
            .then(viewer => setViewer(viewer))
            .catch(e => console.error(e))
        }
      }

      if (child) {
        window.addEventListener('focus', storageListener)
        window.addEventListener('storage', storageListener)
        interval = setInterval(storageListener, 500)
      }
    },
  }
}
