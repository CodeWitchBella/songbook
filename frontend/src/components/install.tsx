import React from 'react'
import createContext from 'utils/create-react-context'
import styled from 'react-emotion'

type State = { install?: (() => void) | null }
const Ctx = createContext({} as State)

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
