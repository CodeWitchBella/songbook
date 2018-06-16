import React from 'react'
import createContext from 'utils/create-react-context'
import styled from 'react-emotion'

type State = { install?: () => void }
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
        this.setState({
          install: () => {
            this.setState({})
            event.prompt()
            event.userChoice.then((choice: any) => {
              console.log(choice)
              if (choice.outcome === 'accepted') {
              }
            })
          },
        })
      })
  }
  componentWillUnmount() {}
}

const Button = styled.button`
  border: 2px solid black;
  background: white;
  padding: 20px;
  font-size: 20px;
  border-radius: 30px;
`

export const InstallButton = () => (
  <Ctx.Consumer>
    {({ install }) =>
      install ? (
        <Button onClick={install}>Nainstalovat jako appku</Button>
      ) : null
    }
  </Ctx.Consumer>
)
