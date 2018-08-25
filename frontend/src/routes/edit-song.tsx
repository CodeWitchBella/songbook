import React from 'react'
import { hot } from 'react-hot-loader'
import styled, { css } from 'react-emotion'
import { editSong } from 'containers/store/fetchers'
import { Song, Refetch, SongType } from 'containers/store/store'
import { editSongVariables } from 'containers/store/__generated__/editSong'
import Input from 'components/input'
import { SongLook } from 'components/song-look/song-look'
import * as parser from 'utils/parse-song'
import QuillEditor from 'components/quill-editor'
import { everything_songs_metadata } from 'containers/store/__generated__/everything'
import Checkbox from 'components/checkbox'
import PDF from 'components/pdf'
import Togglable from 'components/togglable'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  font-size: 18px;
  max-width: 600px;
  margin: 40px auto 0 auto;
`

const textAreaClass = css`
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
  <textarea
    className={textAreaClass}
    value={value}
    onChange={evt => {
      evt.preventDefault()
      onChange(evt.target.value)
    }}
  />
)

const Columns = styled.div`
  display: flex;
  > * {
    width: ${(props: { number: number }) => 100 / props.number}%;
  }
`

const Help: React.SFC<{}> = ({ children }) => (
  <Togglable defaultState={false}>
    {({ toggled, toggle }) => (
      <div
        css={`
          font-size: 18px;
          max-width: 600px;
          margin: 40px auto 0 auto;
        `}
      >
        <button
          onClick={toggle}
          css={`
            margin: 0 auto;
            display: block;
          `}
        >
          {toggled ? 'Skrýt' : 'Zobrazit'} nápovědu
        </button>
        {toggled && children}
      </div>
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
  tags: string
  title: string
  textWithChords: string
  fontSize: string
  paragraphSpace: string
  titleSpace: string
  fancyEditor: boolean
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

class EditSong extends React.Component<
  {
    song: SongType
    refetch: (force?: boolean) => Promise<any>
  },
  State
> {
  state: State = {
    author: this.props.song.author,
    tags: this.props.song.tags.map(t => t.id).join(', '),
    title: this.props.song.title,
    textWithChords: this.props.song.textWithChords,
    fontSize: numberToString(this.props.song.metadata.fontSize),
    paragraphSpace: numberToString(this.props.song.metadata.paragraphSpace),
    titleSpace: numberToString(this.props.song.metadata.titleSpace),
    fancyEditor: true,
    advanced: false,
    preview: false,
    pdfPreview: false,
    saveStatus: 'NO_CHANGES',
  }

  changeCounter: number = 0

  result = () => {
    const { author, tags, title, textWithChords } = this.state
    return {
      ...this.props.song,
      author,
      title,
      tags: tags.split(',').map(t => t.trim()),
      textWithChords: parser.stringifySongFromDelta(
        parser.parseSongToDelta(textWithChords),
      ),
      metadata: {
        ...this.props.song.metadata,
        fontSize: Number.parseFloat(this.state.fontSize),
        paragraphSpace: Number.parseFloat(this.state.paragraphSpace),
        titleSpace: Number.parseFloat(this.state.titleSpace),
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

    editSong({
      song: this.result(),
    })
      .then(ret => {
        console.log('result', ret)
        if (!ret || !ret.editSong) throw new Error('editSong failed')
      })
      .then(() => this.props.refetch(true))
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
  tagsChange = (val: string) => this.change({ tags: val })
  titleChange = (val: string) => this.change({ title: val })
  textWithChordsChange = (val: string) => this.change({ textWithChords: val })

  fontSizeChange = (val: string) => this.change({ fontSize: val })
  paragraphSpaceChange = (val: string) => this.change({ paragraphSpace: val })
  titleSpaceChange = (val: string) => this.change({ titleSpace: val })
  fancyEditorChange = (value: boolean) => this.setState({ fancyEditor: value })
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
              label="Tagy"
              value={this.state.tags}
              onChange={this.tagsChange}
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
            <Checkbox
              label="Vizuální editor"
              checked={this.state.fancyEditor}
              onChange={this.fancyEditorChange}
            />
            {this.state.fancyEditor ? (
              <QuillEditor
                //label="Text"
                initialValue={this.state.textWithChords}
                onChange={this.textWithChordsChange}
              />
            ) : (
              <Textarea
                value={this.state.textWithChords}
                onChange={this.textWithChordsChange}
              />
            )}
            {this.state.saveStatus === 'FAILED' && <button>Uložit</button>}
            <i>{translateStatus(this.state.saveStatus)}</i>
          </Form>
          <Help>
            <h3>Jak se tahle věc ovládá?</h3>
            <p>
              Myslím, že horní políčka nemusím nikomu vysvětlovat - ty jsou na
              vyplnění údajů o songu. Možná snad jenom tagy: to je seznam
              zkratek oddělený čárkou.
            </p>
            <p>
              Pod tím je pole na vyplnění songu. Do něj píšete text písně a
              pokud chcete začít psát akord tak stačí zmáčknout tabulátor a
              píšete akord. Když jste akord dopsali tak znova zmáčknete
              tabulátor a jste zpět v normálním módu.
            </p>
            <p>
              Nebo můžete odškrtnout checkbox vizuální editor a editovat přímo
              zdrojový text.
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
              To že se sloka nevytuční je v pořádku - hlavně že se to zobrazí
              správně v náhledu (vpravo)
            </p>
            <p>
              Pokud potřebujete udělat oddělovač stran tak napište{' '}
              <b>---&nbsp;page&nbsp;break&nbsp;---</b>
            </p>
            <p>Hodně štěstí a díky za pomoc</p>
          </Help>
        </div>
        {this.state.preview && (
          <div
            css={`
              > iframe {
                width: 100%;
                height: 100%;
              }
            `}
          >
            {this.state.pdfPreview ? (
              <PDF song={this.result()} />
            ) : (
              <SongLook
                song={this.result()}
                parsed={parser.parseSong(this.state.textWithChords)}
                noEdit
              />
            )}
          </div>
        )}
      </Columns>
    )
  }
}
export default hot(module)(({ id }: { id: string }) => (
  <Song id={id}>
    {song =>
      song && (
        <Refetch>
          {refetch => <EditSong song={song} refetch={refetch} />}
        </Refetch>
      )
    }
  </Song>
))
