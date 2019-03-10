/** @jsx jsx */
import { jsx } from '@emotion/core'
import React from 'react'
import styled from '@emotion/styled'
import Button from './button'

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

export const InstallButton = ({
  children = () => null,
}: {
  children?: (install: () => void) => React.ReactNode
}) => (
  <Ctx.Consumer>
    {({ install }) => {
      if (!install) return null
      return children(install)
    }}
  </Ctx.Consumer>
)

const InstallContainer = styled.div`
  position: absolute;
  bottom: 0;
  display: flex;
  justify-content: center;
  height: 150px;
  align-items: center;
  width: 100%;
`

export const InstallButtonLook = () => (
  <InstallButton>
    {install => (
      <>
        <div css={{ height: 150 }} />
        <InstallContainer>
          <Button onClick={install}>Nainstalovat jako appku</Button>
        </InstallContainer>
      </>
    )}
  </InstallButton>
)
