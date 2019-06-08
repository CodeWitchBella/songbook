/** @jsx jsx */
import { jsx, css } from '@emotion/core'
import React, { useRef, PropsWithChildren, useReducer } from 'react'
import styled from '@emotion/styled'
import Input from 'components/input'
import { SongLook } from 'components/song-look/song-look'
import * as parser from 'utils/song-parser/song-parser'
import Checkbox from 'components/checkbox'
import PDF from 'components/pdf'
import Togglable from 'components/togglable'
import { errorBoundary } from 'containers/error-boundary'
import { useSong } from 'store/store'
import { DateTime } from 'luxon'
import { SongTextEditor } from 'components/song-editor/song-text-editor'
import { SongType, updateSong } from 'store/store-song'

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
  background: #eee;
  color: black;
  padding: 5px;
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

function aFit(availableVw: number) {
  const sqrt2 = Math.sqrt(2)
  return {
    [`@media (min-height: ${availableVw * sqrt2}vw)`]: {
      '--a-fit-height': `calc(${availableVw}vw * ${sqrt2})`,
      '--a-fit-width': `${availableVw}vw`,
    },
  }
}

const Columns = ({
  children,
  number,
}: PropsWithChildren<{ number: number }>) => (
  <div
    css={css`
      height: 100%;
      display: flex;
      > * {
        width: ${100 / number}%;
      }

      ${aFit(50)}

      @media screen and (max-width: 1200px) {
        width: ${number * 100}vw;
        max-width: 1200px;
        --a-fit-width: 600px;
        --a-fit-height: ${600 * Math.sqrt(2)}px;
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
  margin-bottom: 2px;
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
  simpleEditor: boolean
  saveStatus: SaveStatus
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
var content = document.querySelector('.pisnicka_content')
Array.from(content.querySelectorAll('sup')).forEach(sup => sup.outerHTML = '['+sup.innerText+']')
copy(content.innerText)
`.trim()

const getResult = (propsSong: SongType, theState: State): SongType => {
  const { author, title, textWithChords } = theState
  return {
    author,
    title,
    lastModified: DateTime.utc(),
    text: textWithChords,
    fontSize: Number.parseFloat(theState.fontSize),
    paragraphSpace: Number.parseFloat(theState.paragraphSpace),
    titleSpace: Number.parseFloat(theState.titleSpace),
    spotify: theState.spotify || null,

    editor: propsSong.editor,
    insertedAt: propsSong.insertedAt,
    id: propsSong.id,
    slug: propsSong.slug,
  }
}

function EditSong(props: { song: SongType; refetch: () => void }) {
  const initialState: State = {
    author: props.song.author,
    title: props.song.title,
    textWithChords: props.song.text,
    spotify: props.song.spotify || '',
    fontSize: props.song.fontSize.toFixed(2),
    paragraphSpace: props.song.paragraphSpace.toFixed(2),
    titleSpace: props.song.titleSpace.toFixed(2),
    advanced: false,
    preview: false,
    pdfPreview: false,
    simpleEditor: window.screen.width < 980,
    saveStatus: 'NO_CHANGES',
  }
  const latestState = useRef<State>(initialState)
  const [state, setState] = useReducer(
    (state: State, patch: Partial<State>) => {
      latestState.current = { ...state, ...patch }
      return latestState.current
    },
    initialState,
  )

  const changeCounterRef = useRef(0)

  const submit = (evt?: React.FormEvent<HTMLFormElement>) => {
    if (evt) evt.preventDefault()
    const { author, title, saveStatus } = state
    console.log('submit before check', state)
    if (!author || !title || saveStatus === 'SAVING') return
    console.log('submit', state)
    setState({ saveStatus: 'SAVING' })
    saveTimeoutRef.current = null

    const version = changeCounterRef.current

    const result = getResult(props.song, latestState.current)
    updateSong(props.song.id, {
      author: result.author,
      title: result.title,
      text: result.text,
      fontSize: result.fontSize,
      paragraphSpace: result.paragraphSpace,
      titleSpace: result.titleSpace,
      spotify: result.spotify || '',
    })
      .then(() => props.refetch())
      .then(() => {
        if (version === changeCounterRef.current) {
          setState({ saveStatus: 'SAVED' })
        } else {
          change({})
        }
      })
      .catch(e => {
        console.error(e)
        setState({ saveStatus: 'FAILED' })
      })
  }

  const saveTimeoutRef = useRef<any>(null)

  const change = (val: Partial<State>) => {
    changeCounterRef.current += 1
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(submit, 500)
    setState(Object.assign({ saveStatus: 'UNSAVED' }, val as any))
  }

  const authorChange = (val: string) => change({ author: val })
  const titleChange = (val: string) => change({ title: val })
  const textWithChordsChange = (val: string) => change({ textWithChords: val })

  const fontSizeChange = (val: string) => change({ fontSize: val })
  const paragraphSpaceChange = (val: string) => change({ paragraphSpace: val })
  const titleSpaceChange = (val: string) => change({ titleSpace: val })
  const spotifyChange = (val: string) => change({ spotify: val })

  const advancedChange = (value: boolean) => setState({ advanced: value })
  const simpleEditorChange = (value: boolean) =>
    setState({ simpleEditor: value })
  const previewChange = (value: boolean) => setState({ preview: value })
  const pdfPreviewChange = (value: boolean) => setState({ pdfPreview: value })

  return (
    <Columns number={state.preview ? 2 : 1}>
      <div>
        <Form onSubmit={submit}>
          <InputLine>
            <Input label="Autor" value={state.author} onChange={authorChange} />
            <Input
              label="Jméno songu"
              value={state.title}
              onChange={titleChange}
            />
          </InputLine>
          <Input
            label="Spotify odkaz"
            value={state.spotify}
            onChange={spotifyChange}
          />
          <InputLine>
            <Checkbox
              label="Náhled"
              checked={state.preview}
              onChange={previewChange}
            />
            {state.preview && (
              <Checkbox
                label="PDF"
                checked={state.pdfPreview}
                onChange={pdfPreviewChange}
              />
            )}
          </InputLine>
          <Checkbox
            label="Zjednodušený editor (vhodné pro mobily)"
            checked={state.simpleEditor}
            onChange={simpleEditorChange}
          />
          <Checkbox
            label="Pokročilá nastavení"
            checked={state.advanced}
            onChange={advancedChange}
          />
          {state.advanced && (
            <>
              <Input
                label="Velikost písma"
                value={state.fontSize || '1.00'}
                onChange={fontSizeChange}
              />
              <Input
                label="Místo mezi odstavci"
                value={state.paragraphSpace || '1.00'}
                onChange={paragraphSpaceChange}
              />
              <Input
                label="Místo pod nadpisem"
                value={state.titleSpace || '1.00'}
                onChange={titleSpaceChange}
              />
            </>
          )}
          {state.simpleEditor ? (
            <Textarea
              value={state.textWithChords}
              onChange={textWithChordsChange}
            />
          ) : (
            <SongTextEditor
              initialValue={state.textWithChords}
              onChange={textWithChordsChange}
            />
          )}

          {state.saveStatus === 'FAILED' && <button>Uložit</button>}
          <i>{translateStatus(state.saveStatus)}</i>
        </Form>
        <Help>
          <h3>Jak se tahle věc ovládá?</h3>
          <p>
            Myslím, že horní políčka nemusím nikomu vysvětlovat - ty jsou na
            vyplnění údajů o songu.
          </p>
          <p>
            Pod tím je pole na vyplnění songu. Do něj píšete text písně a pokud
            chcete začít psát akord tak ho napíšete do hranatých závorek [A].
          </p>
          <p>
            Změny se automaticky ukládají, nebo je můžete uložit ručně kliknutím
            na tlačítko uložit. Současný stav je:{' '}
            <i>{translateStatus(state.saveStatus, true)}</i>
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
      {state.preview && (
        <IFrameSizer>
          {state.pdfPreview ? (
            <PDF song={getResult(props.song, state)} />
          ) : (
            <SongLook
              song={getResult(props.song, state)}
              parsed={parser.parseSong('my', state.textWithChords)}
              noBack
            />
          )}
        </IFrameSizer>
      )}
    </Columns>
  )
}
export default errorBoundary(({ slug }: { slug: string }) => {
  const { song, methods } = useSong({ slug })
  if (!song || !methods) return <div>Píseň nenalezena</div>

  return <EditSong song={song} refetch={methods.refresh} />
})
