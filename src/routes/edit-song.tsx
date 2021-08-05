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
import { RootView, TH2, TH3, TP, TText } from 'components/themed'
import { ListButton } from 'components/interactive/list-button'
import { useTranslation } from 'react-i18next'

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
  padding: 5px;

  border: 1px solid black;
  background: #eee;
  color: black;
  @media screen and (prefers-color-scheme: dark) {
    background-color: #222;
    color: white;
    border: 1px solid white;
  }
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

const Help: React.SFC<{ title: string; hiddenTitle: string }> = ({
  children,
  title,
  hiddenTitle,
}) => (
  <Togglable defaultState={false}>
    {({ toggled, toggle }) => (
      <HelpWrap>
        <ListButton onPress={toggle}>
          {toggled ? title : hiddenTitle}
        </ListButton>
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
  const { t } = useTranslation()
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
          <TH2>
            <BackButton style={{ paddingBottom: 10 }}>
              <BackArrow />
            </BackButton>
            {t('edit.Edit song')}
          </TH2>
          <InputLine>
            <Input label="Autor" value={state.author} onChange={authorChange} />
            <Input
              label={t('edit.Song name')}
              value={state.title}
              onChange={titleChange}
            />
          </InputLine>
          <Input
            label={t('edit.Spotify link')}
            value={state.spotify}
            onChange={spotifyChange}
          />
          <InputLine>
            <Checkbox
              label={t('edit.Show preview')}
              checked={state.preview}
              onChange={previewChange}
            />
            {state.preview && (
              <Checkbox
                label={t('edit.PDF preview')}
                checked={state.pdfPreview}
                onChange={pdfPreviewChange}
              />
            )}
          </InputLine>
          <Checkbox
            label={t('edit.Simplified editor (use this on phones)')}
            checked={state.simpleEditor}
            onChange={simpleEditorChange}
          />
          <Checkbox
            label={t('edit.Advanced settings')}
            checked={state.advanced}
            onChange={advancedChange}
          />
          {state.advanced && (
            <>
              <Input
                label={t('edit.Font size')}
                value={state.fontSize}
                onChange={fontSizeChange}
              />
              <Input
                label={t('edit.Space between paragraphs')}
                value={state.paragraphSpace}
                onChange={paragraphSpaceChange}
              />
              <Input
                label={t('edit.Space below title')}
                value={state.titleSpace}
                onChange={titleSpaceChange}
              />
              <Input
                label={t('edit.Predefined transposition')}
                value={state.pretranspose}
                onChange={onPretransposeChange}
              />
            </>
          )}
          {editor('song', state.textWithChords, textWithChordsChange)}

          {state.saveStatus === 'FAILED' && (
            <button>{t('edit.Save changes')}</button>
          )}
          <i>{translateStatus(state.saveStatus)}</i>
        </Form>
        <Help title={t('edit.Hide help')} hiddenTitle={t('edit.Show help')}>
          <TH2>Jak se tahle věc ovládá?</TH2>
          <TP>
            Myslím, že horní políčka nemusím nikomu vysvětlovat - ty jsou na
            vyplnění údajů o songu.
          </TP>
          <TP>
            Pod tím je pole na vyplnění songu. Do něj píšeš text písně a pokud
            chceš začít psát akord tak ho napiš do hranatých závorek [A].
          </TP>
          <TP>
            Změny se automaticky ukládají, nebo je můžeš uložit ručně kliknutím
            na tlačítko uložit. Současný stav je:{' '}
            <i>{translateStatus(state.saveStatus, true)}</i>
          </TP>
          <TP>
            Pro označení sloky se používá <b>S:</b> na začátku řádku. Pokud je
            sloka stejná jako jiná sloka tak stačí napsat <b>S:2</b>. Pro
            označení refrénu se používá <b>R:</b> nebo alternativně, pokud je
            refrénů víc <b>R1:</b>, <b>R2:</b> atd
          </TP>
          <TP>
            Pokud potřebuješ udělat oddělovač stran tak napiš{' '}
            <b>---&nbsp;page&nbsp;break&nbsp;---</b>
          </TP>
          <TP>
            Tučný text (například pro označení speciálních sekcí) se píše takto:
            [*tučný text]
          </TP>
          <TP>
            Akord, který pro sebe udělá místo v textu se zapisuje takto [_C]
          </TP>
          <TP>
            Editor umí pár chytrých funkcí, které bys nutně nečekal. Například
            Ctrl+Z. Nejzajímavější funkce je posouvání akordů doleva a doprava
            pomocí Ctrl+H a Ctrl+L. Další funkce jako mazání akordů ve vybrané
            sekci jdou zobrazit kliknutím pravého tlačítka myši a nebo
            zmáčknutím klávesy F1.
          </TP>
          <TP>Hodně štěstí a díky za pomoc</TP>
        </Help>
        <Help
          title={t('edit.Hide extra information')}
          hiddenTitle={t('edit.Show extra information')}
        >
          <TH3>{t('edit.Searchable')}</TH3>
          <TText>
            Např: pro "Mám doma kočku" sem napíšu kočka aby se to slovo také
            dalo použít při vyhledávání
          </TText>
          {editor('none', state.extraSearchable || '', extraSearchableChange)}
          <TH3>{t('edit.Non-searchable')}</TH3>
          <TText>Např: odkaz na ultimate guitar</TText>
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
    <RootView>
      <EditSong song={song} refetch={methods.refresh} />
    </RootView>
  )
}
