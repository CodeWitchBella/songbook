import React from 'react'
import { css } from 'emotion'
import { primary } from 'utils/colors'
import { Link } from 'react-router-dom'
import { useTags } from 'store/fetchers'

const Placeholder = () => <div>Načítám seznam písní</div>

const tagContainer = css`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin: 0 10px 10px 10px;
`

const tagClass = css`
  box-sizing: border-box;
  font-size: 20px;
  height: 60px;
  padding: 0 20px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  margin: 10px;

  background: ${primary};
  width: auto;
  text-decoration: none;
  color: white;
  :hover {
    text-decoration: underline;
  }
`

const Tag = ({ tag }: { tag: { name: string; id: string } }) => (
  <Link className={tagClass} to={`/tag/${tag.id}`}>
    {tag.name}
  </Link>
)

const TagListSection = () => {
  const tags = useTags()
  if (!tags) return <Placeholder />

  return (
    <nav className={tagContainer}>
      {tags.map((tag, i) => (
        <Tag key={i} tag={tag} />
      ))}
    </nav>
  )
}
export default TagListSection
