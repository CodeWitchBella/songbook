import React from 'react'
import { errorBoundary } from '../containers/error-boundary'

const NotFound = () => <div>Zadaná cesta nebyla nalezena</div>
export default errorBoundary(NotFound)
