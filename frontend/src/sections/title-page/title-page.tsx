import React from 'react'
import Page from 'components/page'
import styled from 'react-emotion'
import defaultImage from './image.png'

const ImageContainer = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
`

const Image = styled.img`
  display: block;
  width: 90%;
  margin: 0 auto;
  @media print {
    filter: grayscale(100%);
  }
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`

const Title = styled.div`
  flex-grow: 1;
  text-align: center;
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding-bottom: 3em;
`

const TitleLine1 = styled.div`
  font-size: 3em;
`
const TitleLine2 = styled.div`
  font-size: 2em;
`

const TitlePage = ({ image = defaultImage }: { image?: string }) => (
  <Page>
    <Container>
      <ImageContainer>
        <Image src={image} alt="title image" />
      </ImageContainer>
      <Title>
        <TitleLine1>Transcontinental</TitleLine1>
        <TitleLine2>Kanačlehy 2018</TitleLine2>
      </Title>
    </Container>
  </Page>
)
export default TitlePage
