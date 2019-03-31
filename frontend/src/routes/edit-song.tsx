/** @jsx jsx */
import { jsx, css } from '@emotion/core'
import React, { useRef, PropsWithChildren } from 'react'
import styled from '@emotion/styled'
import Input from 'components/input'
import { SongLook } from 'components/song-look/song-look'
import * as parser from 'utils/parse-song'
import Checkbox from 'components/checkbox'
import PDF from 'components/pdf'
import Togglable from 'components/togglable'
import { errorBoundary } from 'containers/error-boundary'
import { writeSong } from 'store/fetchers'
import { useSong } from 'store/store'
import { ParsedSong } from 'store/parse-song-file'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  font-size: 18px;
  max-width: 600px;
  margin: 40px auto 0 auto;
`

const TextAreaC = styled.textarea`
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 100%;
  height: 30em;
`

const Textarea = ({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => any
}) => (
  <TextAreaC
    value={value}
    onChange={evt => {
      evt.preventDefault()
      onChange(evt.target.value)
    }}
  />
)

const Columns = ({
  children,
  number,
}: PropsWithChildren<{ number: number }>) => (
  <div
    css={css`
      display: flex;
      > * {
        width: ${100 / number}%;
      }
    `}
  >
    {children}
  </div>
)

const HelpWrap = styled.div`
  font-size: 18px;
  max-width: 600px;
  margin: 40px auto 0 auto;
`

const HideHelpButton = styled.button`
  margin: 0 auto;
  display: block;
`

const Code = ({ text }: { text: string }) => {
  const ref = useRef<HTMLTextAreaElement>(null)
  return (
    <code
      onClick={() => {
        const area = ref.current
        if (area) {
          area.select()
          document.execCommand('copy')
        }
      }}
    >
      <textarea
        ref={ref}
        value={text}
        readOnly
        css={{ width: '100%', border: 0 }}
      />
    </code>
  )
}

const Help: React.SFC<{ title?: string }> = ({ children, title }) => (
  <Togglable defaultState={false}>
    {({ toggled, toggle }) => (
      <HelpWrap>
        <HideHelpButton onClick={toggle}>
          {toggled ? 'Skrýt' : 'Zobrazit'} {title || 'nápovědu'}
        </HideHelpButton>
        {toggled && children}
      </HelpWrap>
    )}
  </Togglable>
)

const InputLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  > * {
    margin-left: 10px;
  }
  > *:first-child {
    margin-left: 0;
  }
`

type SaveStatus = 'NO_CHANGES' | 'SAVING' | 'UNSAVED' | 'FAILED' | 'SAVED'
type State = {
  author: string
  title: string
  textWithChords: string
  fontSize: string
  paragraphSpace: string
  titleSpace: string
  spotify: string
  advanced: boolean
  preview: boolean
  pdfPreview: boolean
  saveStatus: SaveStatus
}

function numberToString(input: any) {
  if (typeof input === 'number') return `${input}`
  return input
}

function translateStatus(saveStatus: SaveStatus, outputOnNoChange = false) {
  return {
    NO_CHANGES: outputOnNoChange ? 'Nebyly provedeny žádné změny' : '',
    SAVING: 'Ukládám…',
    UNSAVED: 'Formulář obsahuje neuložené změny',
    FAILED: 'Ukládání selhalo',
    SAVED: 'Uloženo',
  }[saveStatus]
}

const IFrameSizer = styled.div`
  > iframe {
    width: 100%;
    height: 100%;
  }
`

const nakytarushonzou = `
var content = document.querySelector('.pisnicka_content font')
Array.from(content.querySelectorAll('sup')).forEach(sup => sup.outerHTML = '['+sup.innerText+']')
copy(content.innerText)
`.trim()

class EditSong extends React.Component<
  {
    song: ParsedSong
    refetch: () => void
  },
  State
> {
  state: State = {
    author: this.props.song.author,
    title: this.props.song.title,
    textWithChords: this.props.song.textWithChords,
    spotify: this.props.song.metadata.spotify || '',
    fontSize: numberToString(this.props.song.metadata.fontSize),
    paragraphSpace: numberToString(this.props.song.metadata.paragraphSpace),
    titleSpace: numberToString(this.props.song.metadata.titleSpace),
    advanced: false,
    preview: false,
    pdfPreview: false,
    saveStatus: 'NO_CHANGES',
  }

  changeCounter: number = 0

  result = () => {
    const { author, title, textWithChords } = this.state
    return {
      ...this.props.song,
      author,
      title,
      textWithChords,
      metadata: {
        ...this.props.song.metadata,
        fontSize: Number.parseFloat(this.state.fontSize),
        paragraphSpace: Number.parseFloat(this.state.paragraphSpace),
        titleSpace: Number.parseFloat(this.state.titleSpace),
        spotify: this.state.spotify || null,
      },
    }
  }

  submit = (evt?: React.FormEvent<HTMLFormElement>) => {
    if (evt) evt.preventDefault()
    const { author, title, saveStatus } = this.state
    console.log('submit before check', this.state)
    if (!author || !title || saveStatus === 'SAVING') return
    console.log('submit', this.state)
    this.setState({ saveStatus: 'SAVING' })
    this.saveTimeout = null

    const version = this.changeCounter

    writeSong(this.result())
      .then(ret => {
        console.log('result', ret, !ret || !ret.data || !ret.data.editSong)
        if (!ret || !ret.data || !ret.data.writeSong)
          throw new Error('writeSong failed')
      })
      .then(() => this.props.refetch())
      .then(() => {
        if (version === this.changeCounter) {
          this.setState({ saveStatus: 'SAVED' })
        } else {
          this.change({})
        }
      })
      .catch(e => {
        console.error(e)
        this.setState({ saveStatus: 'FAILED' })
      })
  }

  saveTimeout: any = null

  change = (val: Partial<State>) => {
    this.changeCounter += 1
    if (this.saveTimeout) clearTimeout(this.saveTimeout)
    this.saveTimeout = setTimeout(this.submit, 500)
    this.setState(Object.assign({ saveStatus: 'UNSAVED' }, val as any))
  }

  authorChange = (val: string) => this.change({ author: val })
  titleChange = (val: string) => this.change({ title: val })
  textWithChordsChange = (val: string) => this.change({ textWithChords: val })

  fontSizeChange = (val: string) => this.change({ fontSize: val })
  paragraphSpaceChange = (val: string) => this.change({ paragraphSpace: val })
  titleSpaceChange = (val: string) => this.change({ titleSpace: val })
  spotifyChange = (val: string) => this.change({ spotify: val })

  advancedChange = (value: boolean) => this.setState({ advanced: value })
  previewChange = (value: boolean) => this.setState({ preview: value })
  pdfPreviewChange = (value: boolean) => this.setState({ pdfPreview: value })

  render() {
    return (
      <Columns number={this.state.preview ? 2 : 1}>
        <div>
          <Form onSubmit={this.submit}>
            <InputLine>
              <Input
                label="Autor"
                value={this.state.author}
                onChange={this.authorChange}
              />
              <Input
                label="Jméno songu"
                value={this.state.title}
                onChange={this.titleChange}
              />
            </InputLine>
            <Input
              label="Spotify odkaz"
              value={this.state.spotify}
              onChange={this.spotifyChange}
            />
            <InputLine>
              <Checkbox
                label="Náhled"
                checked={this.state.preview}
                onChange={this.previewChange}
              />
              {this.state.preview && (
                <Checkbox
                  label="PDF"
                  checked={this.state.pdfPreview}
                  onChange={this.pdfPreviewChange}
                />
              )}
            </InputLine>
            <Checkbox
              label="Pokročilá nastavení"
              checked={this.state.advanced}
              onChange={this.advancedChange}
            />
            {this.state.advanced && (
              <>
                <Input
                  label="Velikost písma"
                  value={this.state.fontSize || '1.00'}
                  onChange={this.fontSizeChange}
                />
                <Input
                  label="Místo mezi odstavci"
                  value={this.state.paragraphSpace || '1.00'}
                  onChange={this.paragraphSpaceChange}
                />
                <Input
                  label="Místo pod nadpisem"
                  value={this.state.titleSpace || '1.00'}
                  onChange={this.titleSpaceChange}
                />
              </>
            )}
            <Textarea
              value={this.state.textWithChords}
              onChange={this.textWithChordsChange}
            />

            {this.state.saveStatus === 'FAILED' && <button>Uložit</button>}
            <i>{translateStatus(this.state.saveStatus)}</i>
          </Form>
          <Help>
            <h3>Jak se tahle věc ovládá?</h3>
            <p>
              Myslím, že horní políčka nemusím nikomu vysvětlovat - ty jsou na
              vyplnění údajů o songu.
            </p>
            <p>
              Pod tím je pole na vyplnění songu. Do něj píšete text písně a
              pokud chcete začít psát akord tak ho napíšete do hranatých závorek
              [A].
            </p>
            <p>
              Změny se automaticky ukládají, nebo je můžete uložit ručně
              kliknutím na tlačítko uložit. Současný stav je:{' '}
              <i>{translateStatus(this.state.saveStatus, true)}</i>
            </p>
            <p>
              Pro označení sloky se používá <b>S:</b> na začátku řádku. Pokud je
              sloka stejná jako jiná sloka tak stačí napsat <b>S:2</b>. Pro
              označení refrénu se používá <b>R:</b> nebo alternativně, pokud je
              refrénů víc <b>R1:</b>, <b>R2:</b> atd
            </p>
            <p>
              Pokud potřebujete udělat oddělovač stran tak napište{' '}
              <b>---&nbsp;page&nbsp;break&nbsp;---</b>
            </p>
            <p>Hodně štěstí a díky za pomoc</p>
          </Help>
          <Help title="cheaty">
            Script pro extrakci textu z{' '}
            <a href="https://na-kytaru-s-honzou.cz/">na-kytaru-s-honzou.cz</a>
            <br />
            <Code text={nakytarushonzou} />
          </Help>
        </div>
        {this.state.preview && (
          <IFrameSizer>
            {this.state.pdfPreview ? (
              <PDF song={this.result()} />
            ) : (
              <SongLook
                song={this.result()}
                parsed={parser.parseSong(this.state.textWithChords)}
                noBack
              />
            )}
          </IFrameSizer>
        )}
      </Columns>
    )
  }
}
export default errorBoundary(({ id }: { id: string }) => {
  const song = useSong(id)
  if (!song) return <div>Píseň nenalezena</div>
  const { data } = song
  if (!data) return <div>Načítám...</div>
  return <EditSong song={data} refetch={song.reload} />
})
