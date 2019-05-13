import React from 'react'
import TagList from 'sections/tag-list/tag-list'
import { InstallButtonLook } from 'components/install'
import TopMenu from 'components/top-menu'
import { errorBoundary } from 'containers/error-boundary'

const TagListRoute = () => (
  <div>
    <TopMenu />
    <TagList />

    <InstallButtonLook />
  </div>
)
export default errorBoundary(TagListRoute)
