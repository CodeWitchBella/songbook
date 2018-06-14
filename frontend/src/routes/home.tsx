import React from 'react'
import { hot } from 'react-hot-loader'
import TagList from 'sections/tag-list/tag-list'
import { Link } from 'react-router-dom'

const Home = () => (
  <div>
    <Link to="/new">Create song</Link>
    <TagList />
  </div>
)
export default hot(module)(Home)
