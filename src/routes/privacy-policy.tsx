/** @jsx jsx */
import { jsx } from '@emotion/core'
import { errorBoundary } from 'containers/error-boundary'

function PrintRoute() {
  return (
    <div css={{ maxWidth: 650, fontSize: 18, margin: 'auto' }}>
      <h2>Zásady ochrany osobních údajů</h2>
      <p>Tak jsem teda zvědavá, jestli tohle někdo bude číst ;-)</p>
      <p>
        O co jde? V podstatě jde o to, že možná ze zákona, ale hlavně Facebook
        po mě požaduje, abych tuhle stránku měla a na ní Ti sdělila jakéže
        informace o tobě sbírám a co s nimi dělám
      </p>
      <h3>Co tedy sbírám?</h3>
      <p>
        Osobní informace. Duh. Jméno, příjmení, obrázek a email. Prostě chci
        vědět, kdo mi smazal půlku písní, nebo komu můžu poděkovat za přidání
        super akordů
      </p>
      <p>
        Taky si ukládám nastavení která si nastavíš. V momentě psaní tohoto
        dokumentu nic takového nemám, ale mám v plánu přidat dark mód a
        right-handed mód. Nebo taky mám v plánu přidat režim akordů uvnitř textu
        (ne nad ním). Ale jak možná víš tak toho mám v plánu hodně a času málo
      </p>
      <h3>Co s nimi dělám</h3>
      <p>
        Email nikdy nezobrazuji, pouze si ho ukládám, protože v některých
        situacích se po mě chce abych Tě o některých věcech informovala, takže
        tak jako pro jistotu. Taky kdybych náhodou chtěla přidat přihlášení přes
        email tak abych to měla jak napojit.
      </p>
      <p>
        Jméno, příjmení a obrázek zobrazuji tobě a taky to zobrazuji u písní
        které jsi přidal/a.
      </p>
      <p>
        A uložené hodnoty nastavení používám k aplikování změn, které to
        nastavení ovládá... Kdo by to byl řekl?
      </p>
      <h3>Závěrem</h3>
      <p>
        No prostě myslím si, že nedělám nic divného. Údaje sdílím jenom s mým
        poskytovatelem úložiště což je Google Cloud Platform. Jejich podmínky
        jsem si teda nečetla (kdo ano?) ale mám pocit že by do toho lézt neměli.
      </p>
      <p>
        Ale pokud máš obavu z americké vlády nebo podobných věcí tak asi nemůžu
        pomoci. (Ale data momentálně ukládám do Frankfurtu, takže to by taky
        neměl být problém?)
      </p>
    </div>
  )
}
export default errorBoundary(PrintRoute)
