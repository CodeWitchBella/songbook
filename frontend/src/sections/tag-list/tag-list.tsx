import React from 'react'
import TagsContainer from 'containers/tags'

const Placeholder = () => <div>Načítám seznam písní</div>

const Tag = ({ tag }: { tag: string }) => (
  <div>
    <a href={`/tag/${tag}`}>{tag}</a>
  </div>
)

const TagList = () => (
  <TagsContainer placeholder={Placeholder}>
    {songs =>
      !songs.data ? null : (
        <div>{songs.data.tags.map((tag, i) => <Tag key={i} tag={tag} />)}</div>
      )
    }
  </TagsContainer>
)
export default TagList
