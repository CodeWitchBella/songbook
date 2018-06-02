// old react context until https://github.com/ctrlplusb/react-tree-walker/issues/22 is fixed
import createReactContext from 'create-react-context'
import impl from 'create-react-context/lib/implementation'

const out = ((impl as any) as false) || createReactContext
export default out
