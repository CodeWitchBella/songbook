import React from 'react'
import styled, { css } from 'react-emotion'
import createContext from 'create-react-context'

type AudioState = {
  volume: number
  currentTime: number
  duration: number
}
type SettableKeys = 'volume' | 'currentTime'
type State = AudioState & {
  set: (key: SettableKeys) => (value: number) => void
  toggle: () => void
  playing: boolean
}
const AudioContext = createContext(null as null | State)

export class AudioProvider extends React.Component<{ src: string }, State> {
  ref = React.createRef<HTMLAudioElement>()

  state: State = {
    volume: 1,
    currentTime: 0,
    duration: 0,
    playing: false,
    toggle: () => {
      const ref = this.ref.current
      if (!ref) return
      if (this.state.playing) {
        this.setState({ playing: false })
        ref.pause()
      } else {
        this.setState({ playing: true })
        ref.play()
      }
    },
    set: (() => {
      const setters = {
        volume: (value: number) => {
          const ref = this.ref.current
          if (!ref) return
          ref.volume = value
          this.setState({ volume: value })
        },
        currentTime: (value: number) => {
          this.setState({ currentTime: value })
          const ref = this.ref.current
          if (!ref) return
          ref.currentTime = value
        },
      }
      return (key: SettableKeys) => setters[key]
    })(),
  }

  timeUpdate = () => {
    const ref = this.ref.current
    if (!ref) return
    this.setState({ currentTime: ref.currentTime })
  }

  canPlay = () => {
    const ref = this.ref.current
    if (!ref) return
    this.setState({ duration: ref.duration })
  }

  componentDidMount() {
    const ref = this.ref.current
    if (!ref) return
    ref.volume = this.state.volume

    if (ref.duration) this.setState({ duration: ref.duration })
    ref.addEventListener('canplay', this.canPlay, { once: true })
    ref.addEventListener('canplaythrough', this.canPlay, { once: true })
    ref.addEventListener('timeupdate', this.timeUpdate, { passive: true })
  }

  componentWillUnmount() {
    const ref = this.ref.current
    if (!ref) return

    ref.removeEventListener('canplay', this.canPlay)
    ref.removeEventListener('canplaythrough', this.canPlay)
    ref.removeEventListener('timeupdate', this.timeUpdate)
  }

  render() {
    return (
      <AudioContext.Provider value={this.state}>
        <audio ref={this.ref}>
          <source src={this.props.src} />
        </audio>
        {this.props.children}
      </AudioContext.Provider>
    )
  }
}

const Number = ({ children }: { children: number }) => (
  <>{`${Math.floor(children)}`.padStart(2, '0')}</>
)

const TimeDisplay = ({ children }: { children: number }) => (
  <span>
    {<Number>{children / 60}</Number>}:
    {<Number>{Math.round(children) % 60}</Number>}
  </span>
)

const player = css`
  position: absolute;
  margin-top: -0.5em;
  cursor: pointer;
  @media print {
    display: none;
  }
`

export const AudioControls = () => (
  <AudioContext.Consumer>
    {props => {
      if (!props) return null
      return (
        <div
          className={player}
          title="Click to play/pause"
          onClick={props.toggle}
        >
          Audio: <TimeDisplay>{props.currentTime}</TimeDisplay>/
          <TimeDisplay>{props.duration}</TimeDisplay>
        </div>
      )
    }}
  </AudioContext.Consumer>
)
