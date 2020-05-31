import React from 'react'

export default class Togglable extends React.Component<
  {
    defaultState: boolean
    children: (arg: { toggled: boolean; toggle: () => void }) => React.ReactNode
  },
  { toggled: boolean; toggle: () => void }
> {
  state = {
    toggled: this.props.defaultState,
    toggle: () => this.setState((s) => ({ toggled: !s.toggled })),
  }
  render() {
    return this.props.children(this.state)
  }
}
