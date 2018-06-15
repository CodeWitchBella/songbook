import React from 'react'
import Page from 'components/page'
import styled from 'react-emotion'
import defaultImage from './locomotive.png'

const ImageContainer = styled.div`
  padding-top: 3em;
`

const Image = styled.img`
  display: block;
  width: 90%;
  margin: 0 auto;
  filter: grayscale(100%);
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`

const Title = styled.div`
  padding-bottom: 5em;
  text-align: center;
`

const TitleLine1 = styled.div`
  font-size: 3em;
`
const TitleLine2 = styled.div`
  font-size: 2em;
`

const TitlePage = ({ image = defaultImage }: { image?: string }) => (
  <Page left>
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
