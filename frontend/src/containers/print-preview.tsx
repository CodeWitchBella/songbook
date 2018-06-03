import createContext from 'utils/create-react-context'
import React from 'react'

const context = createContext({ value: false, set: (val: boolean) => {} })

export class PrintPreviewProvider extends React.Component<
  {},
  { value: boolean; set: (val: boolean) => void }
> {
  state = {
    value: false,
    set: (value: boolean) => {
      this.setState({ value })
    },
  }
  render() {
    return (
      <context.Provider value={this.state}>
        {this.props.children}
      </context.Provider>
    )
  }
}

export const PrintPreview: React.SFC<{
  children: (val: boolean) => React.ReactNode
}> = ({ children }) => (
  <context.Consumer>{({ value }) => children(value)}</context.Consumer>
)

export const PrintPreviewToggle: React.SFC<{
  children: (toggle: () => void) => React.ReactNode
}> = ({ children }) => (
  <context.Consumer>
    {({ value, set }) => children(() => set(!value))}
  </context.Consumer>
)
