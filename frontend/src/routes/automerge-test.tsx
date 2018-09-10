import { hot } from 'react-hot-loader'
import React from 'react'
import Automerge from 'components/automerge-websocket'

const AutomergeTestRoute = () => <Automerge>{() => null}</Automerge>
export default hot(module)(AutomergeTestRoute)
