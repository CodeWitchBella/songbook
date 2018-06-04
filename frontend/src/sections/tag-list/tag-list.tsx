import React from 'react'
import TagsContainer from 'containers/tags'
import { css } from 'react-emotion'
import { primary } from 'utils/colors'

const Placeholder = () => <div>Načítám seznam písní</div>

const tagContainer = css`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin: 10px;
`

const tagClass = css`
  box-sizing: border-box;
  font-size: 20px;
  height: 60px;
  padding: 0 20px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  margin: 0 10px;

  background: ${primary};
  width: auto;
  text-decoration: none;
  color: white;
  :hover {
    text-decoration: underline;
  }
`

const Tag = ({ tag }: { tag: { name: string; id: string } }) => (
  <a className={tagClass} href={`/tag/${tag.id}`}>
    {tag.name}
  </a>
)

const TagList = () => (
  <TagsContainer placeholder={Placeholder}>
    {songs =>
      !songs.data ? null : (
        <nav className={tagContainer}>
          {songs.data.tags.map((tag, i) => <Tag key={i} tag={tag} />)}
        </nav>
      )
    }
  </TagsContainer>
)
export default TagList
