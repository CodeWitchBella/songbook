import React from 'react'
import styled from 'react-emotion'

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
    <path d="M352 320c-22.608 0-43.387 7.819-59.79 20.895l-102.486-64.054a96.551 96.551 0 0 0 0-41.683l102.486-64.054C308.613 184.181 329.392 192 352 192c53.019 0 96-42.981 96-96S405.019 0 352 0s-96 42.981-96 96c0 7.158.79 14.13 2.276 20.841L155.79 180.895C139.387 167.819 118.608 160 96 160c-53.019 0-96 42.981-96 96s42.981 96 96 96c22.608 0 43.387-7.819 59.79-20.895l102.486 64.054A96.301 96.301 0 0 0 256 416c0 53.019 42.981 96 96 96s96-42.981 96-96-42.981-96-96-96z" />
  </svg>
)

const Button = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc(2.56em);
  height: calc(2.56em);
  font-size: 1em;
  background: transparent;
  border: 0;
  margin: 0;
  padding: 0;
  svg {
    width: calc(2.24em / 1.5);
    height: calc(2.56em / 1.5);
  }
`

export default class ShareButton extends React.Component<
  { url?: string; title: string; className?: string },
  { visible: boolean }
> {
  state = { visible: false }

  onClick = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault()
    ;(navigator as any).share({
      title: this.props.title,
      url: this.props.url || `${window.location}`,
    })
  }

  render() {
    if (!this.state.visible) return null

    return (
      <div className={this.props.className}>
        <Button onClick={this.onClick}>
          <ShareIcon />
        </Button>
      </div>
    )
  }

  componentDidMount() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      this.setState({ visible: true })
    }
  }
}
