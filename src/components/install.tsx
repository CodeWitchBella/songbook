/** @jsx jsx */
/** @jsxFrag React.Fragment */
import { jsx } from '@emotion/react'
import React, { useContext, PropsWithChildren } from 'react'
import styled from '@emotion/styled'
import { PrimaryButton } from './interactive/primary-button'

type State = { install?: (() => void) | null }
const Ctx = React.createContext({} as State)

export class InstallProvider extends React.Component<{}, State> {
  state: State = {}
  render() {
    return <Ctx.Provider value={this.state}>{this.props.children}</Ctx.Provider>
  }

  componentDidMount() {
    if (typeof window !== 'undefined')
      window.addEventListener('beforeinstallprompt', (event: any) => {
        event.preventDefault()
        const install = () => {
          // hide button
          this.setState({ install: null })
          event.prompt()
          event.userChoice.then((choice: any) => {
            console.log(choice)
            if (choice.outcome !== 'accepted') {
              // show it again
              this.setState({ install })
            }
          })
        }
        this.setState({
          install,
        })
      })
  }
  componentWillUnmount() {}
}

const useInstall = () => {
  const { install } = useContext(Ctx)
  return install ?? null
}

const InstallContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  pointer-events: none;
  > * {
    pointer-events: auto;
  }
`

export const InstallButtonLook = ({ children }: PropsWithChildren<{}>) => {
  const install = useInstall()
  if (!install) return null

  return (
    <>
      <InstallContainer>
        <PrimaryButton onPress={install ?? undefined}>
          Nainstalovat jako appku
        </PrimaryButton>
      </InstallContainer>
      {children}
    </>
  )
}
