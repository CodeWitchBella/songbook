/** @jsxImportSource @emotion/react */

import { css } from '@emotion/react'
import React, { useRef, PropsWithChildren, useReducer } from 'react'
import styled from '@emotion/styled'
import Input from 'components/input'
import { SongLook } from 'components/song-look/song-look'
import * as parser from 'utils/song-parser/song-parser'
import Checkbox from 'components/checkbox'
import PDF from 'components/pdf'
import Togglable from 'components/togglable'
import { useSong } from 'store/store'
import { DateTime } from 'luxon'
import { SongTextEditor } from 'components/song-editor/song-text-editor'
import { SongType, updateSong } from 'store/store-song'
import { BackButton, BackArrow } from 'components/back-button'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  font-size: 18px;
  max-width: 600px;
  margin: 20px auto 0 auto;
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
    onChange={(evt) => {
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
  pretranspose: string
  advanced: boolean
  preview: boolean
  pdfPreview: boolean
  simpleEditor: boolean
  extraSearchable: string | null
  extraNonSearchable: string | null
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

const akordykytary = `
var theCopy = typeof copy === 'function' ? copy : console.log.bind(console)
theCopy(Array.from(document.querySelector('#snippet--sheetContent').children).map(sec => ({
  type: sec.dataset.type,
  content: Array.from(sec.children).map(line => 
    Array.from(line.childNodes).map(atom => atom.className === 'scs-chord' ? '['+atom.textContent+']' : atom.textContent).join('')
  ).join('\\n'),
})).map(sec => (sec.type === 'chorus' ? 'R: ' : 'S: ') + sec.content).join('\\n\\n'))
`

function safeParseFloat(text: string, fallback: number) {
  const res = Number.parseFloat(text)
  if (!Number.isFinite(res)) return fallback
  return res
}

function safeParseInt(text: string, fallback: number) {
  const res = Number.parseFloat(text)
  if (!Number.isFinite(res)) return fallback
  if (!Number.isSafeInteger(res)) return fallback
  return res
}

const getResult = (propsSong: SongType, theState: State): SongType => {
  const { author, title, textWithChords } = theState
  return {
    author,
    title,
    lastModified: DateTime.utc(),
    text: textWithChords,
    fontSize: safeParseFloat(theState.fontSize, 1),
    paragraphSpace: safeParseFloat(theState.paragraphSpace, 1),
    titleSpace: safeParseFloat(theState.titleSpace, 1),
    spotify: theState.spotify || null,
    pretranspose: safeParseInt(theState.pretranspose, 0),

    extraSearchable: theState.extraSearchable,
    extraNonSearchable: theState.extraNonSearchable,

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
    pretranspose: props.song.pretranspose?.toFixed(0) || '0',
    extraSearchable: props.song.extraSearchable,
    extraNonSearchable: props.song.extraNonSearchable,
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
      extraSearchable: result.extraSearchable || '',
      extraNonSearchable: result.extraNonSearchable || '',
      pretranspose: result.pretranspose || 0,
    })
      .then(() => props.refetch())
      .then(() => {
        if (version === changeCounterRef.current) {
          setState({ saveStatus: 'SAVED' })
        } else {
          change({})
        }
      })
      .catch((e) => {
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

  const checkFloat = (val: string) => {
    // only allow - at start, only one . and otherwise numeric
    if (!/^-?[0-9]*\.?[0-9]*$/.test(val)) return false
    if (val === '') return true
    return Number.isFinite(Number.parseFloat(val))
  }
  const checkInt = (val: string) => {
    // only allow - at start, only one . and otherwise numeric
    if (!/^-?[0-9]*$/.test(val)) return false
    if (val === '' || val === '-') return true
    return Number.isSafeInteger(Number.parseFloat(val))
  }

  const fontSizeChange = (val: string) => {
    if (!checkFloat(val)) return
    change({ fontSize: val })
  }
  const paragraphSpaceChange = (val: string) => {
    if (!checkFloat(val)) return
    change({ paragraphSpace: val })
  }
  const titleSpaceChange = (val: string) => {
    if (!checkFloat(val)) return
    change({ titleSpace: val })
  }
  const onPretransposeChange = (val: string) => {
    if (!checkInt(val)) return
    change({ pretranspose: val })
  }
  const spotifyChange = (val: string) => change({ spotify: val })
  const extraSearchableChange = (val: string) =>
    change({ extraSearchable: val })
  const extraNonSearchableChange = (val: string) =>
    change({ extraNonSearchable: val })

  const advancedChange = (value: boolean) => setState({ advanced: value })
  const simpleEditorChange = (value: boolean) =>
    setState({ simpleEditor: value })
  const previewChange = (value: boolean) => setState({ preview: value })
  const pdfPreviewChange = (value: boolean) => setState({ pdfPreview: value })

  const editor = (
    lang: 'song' | 'none',
    value: string,
    onChange: (v: string) => void,
  ) =>
    state.simpleEditor ? (
      <Textarea value={value} onChange={onChange} />
    ) : (
      <SongTextEditor
        initialValue={value}
        onChange={onChange}
        language={lang}
      />
    )

  return (
    <Columns number={state.preview ? 2 : 1}>
      <div>
        <Form onSubmit={submit}>
          <BackButton style={{ paddingBottom: 10, color: 'black' }}>
            <BackArrow />
          </BackButton>
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
                value={state.fontSize}
                onChange={fontSizeChange}
              />
              <Input
                label="Místo mezi odstavci"
                value={state.paragraphSpace}
                onChange={paragraphSpaceChange}
              />
              <Input
                label="Místo pod nadpisem"
                value={state.titleSpace}
                onChange={titleSpaceChange}
              />
              <Input
                label="Předdefinovaná transpozice"
                value={state.pretranspose}
                onChange={onPretransposeChange}
              />
            </>
          )}
          {editor('song', state.textWithChords, textWithChordsChange)}

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
          <p>
            Tučný text (například pro označení speciálních sekcí) se píše takto:
            [*tučný text]
          </p>
          <p>
            Akord, který pro sebe udělá místo v textu se zapisuje takto [_C]
          </p>
          <p>
            Editor umí pár chytrých funkcí, které byste nutně nečekali.
            Například Ctrl+Z. Nejzajímavější funkce je posouvání akordů doleva a
            doprava pomocí Ctrl+H a Ctrl+L. Další funkce jdou zobrazit kliknutím
            pravého tlačítka myši a nebo zmáčknutím klávesy F1.
          </p>
          <p>Hodně štěstí a díky za pomoc</p>
        </Help>
        <Help title="cheaty">
          Script pro extrakci textu z{' '}
          <a href="https://na-kytaru-s-honzou.cz/">na-kytaru-s-honzou.cz</a>
          <br />
          <Code text={nakytarushonzou} />
          <br />
          Script pro extrakci textu z{' '}
          <a href="https://akordy.kytary.cz/">akordy.kytary.cz</a>
          <br />
          <Code text={akordykytary} />
        </Help>
        <Help title="Extra info o této písni">
          <h3>Vyhledatelná</h3>
          Např: pro "Mám doma kočku" sem napíšu kočka aby se to slovo také dalo
          použít při vyhledávání
          {editor('none', state.extraSearchable || '', extraSearchableChange)}
          <h3>NE-Vyhledatelná</h3>
          Např: odkaz na ultimate guitar
          {editor(
            'none',
            state.extraNonSearchable || '',
            extraNonSearchableChange,
          )}
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
export default function EditSongRoute({ slug }: { slug: string }) {
  const { song, methods } = useSong({ slug })
  if (!song || !methods) return <div>Píseň nenalezena</div>

  return (
    <div
      style={{ backgroundColor: 'white', minHeight: '100%', color: 'black' }}
    >
      <EditSong song={song} refetch={methods.refresh} />
    </div>
  )
}
