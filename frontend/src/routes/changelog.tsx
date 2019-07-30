import React from 'react'
import Entry from 'components/changelog-entry'
import { errorBoundary } from 'containers/error-boundary'

const Changelog = () => (
  <div>
    <Entry date="2019-07-15">
      <li>Opravena transpozice více akordů značce</li>
      <li>Přidána možnost tučného textu</li>
      <li>Pokud řádek obsahuje pouze akordy tak pod ním nedělám mezeru</li>
    </Entry>
    <Entry date="2019-07-15">
      <li>Zjednodušeny URL adresy jednotlivých písní</li>
      <li>Upraveno číslování písní pro vícestranné písně</li>
    </Entry>
    <Entry date="2019-06-26">
      <li>
        Umožněno generování A4 PDF pro tisk A6 zpěvníků (po rozstříhnutí
        vzniknou 2 A6 zpěvníky)
        <ul>
          <li>Pokud ho chceš vygenerovat tak za url přidej ?booklet</li>
        </ul>
      </li>
    </Entry>
    <Entry date="2019-06-18">
      <li>
        Přidána možnost stáhnout celou kolekci jako PDF
        <ul>
          <li>Dvojstrany se generují tak aby obě stránky byly vedle sebe</li>
        </ul>
      </li>
      <li>Opraven PDF export písní obsahujících podtržítkové akordy</li>
      <li>Opraven export písní s přenastavenou velikostí písma</li>
    </Entry>
    <Entry date="2019-06-09">
      <li>
        Nyní je možné k písni uložit extra informace
        <ul>
          <li>Jsou rozděleny na vyhledatelné a nevyhledatelné</li>
          <li>Vyhledatelné jdou použít jako klíčová slova v seznamu písní</li>
        </ul>
      </li>
    </Entry>
    <Entry date="2019-05-24">
      <li>Znovupřidány kolekce písní</li>
    </Entry>
    <Entry date="2019-05-23">
      <li>Vylepšen editor textu písní</li>
      <li>
        PDF náhled nyní zobrazuje pouze jednu stranu a umožňuje mezi nimi
        přepínat
      </li>
    </Entry>
    <Entry date="2019-05-21">
      <li>
        Znovu přepsán kód pro aktualizaci písní
        <ul>
          <li>Nyní opravdu stahuje pouze změněné písně</li>
          <li>Zrychlení je přibližně řádové</li>
        </ul>
      </li>
      <li>Profilový obrázek se nyní stáhne pouze jednou</li>
    </Entry>
    <Entry date="2019-05-20">
      <li>Živé zobrazení změn v detailu písně</li>
    </Entry>
    <Entry date="2019-05-19">
      <li>Přihlašování a odhlašování kompletní</li>
      <li>Píseň může přidat pouze přihlášený</li>
      <li>Ukládá se kdo píseň přidal</li>
    </Entry>
    <Entry date="2019-05-18">
      <li>Hezčí PDF náhled</li>
      <li>Opraven spotify přehrávač</li>
      <li>Opraveno zobrazení na "úzkých" telefonech</li>
      <li>Přidáno řazení podle interpreta</li>
      <li>Funkční přihlášení ale zatím pouze skryje tlačítko přihlásit se</li>
    </Entry>
    <Entry date="2019-05-17">
      <li>Rychlejší první načtení písní</li>
      <li>Rychlejší update více písní</li>
      <li>Dokončen přechod na Firebase</li>
      <li>Opraven přechod na editor po přidání písně</li>
    </Entry>
    <Entry date="2019-05-16">
      <li>WIP Přihlášení přes Facebook</li>
      <li>Lepší menu v seznamu písní</li>
      <li>Dialog s aktualizací nyní umožňuje přímý restart</li>
    </Entry>
    <Entry date="2019-05-15">
      <li>
        Vyhledávání se nyní ukládá
        <ul>
          <li>Další stiskem tlačítka zpět se vyhledávací lišta vyčistí</li>
          <li>Také přidáno tlačítko na vyčištění vyhledávání</li>
        </ul>
      </li>
      <li>
        Další pokrok na PDF exportu
        <ul>
          <li>Funkční export jednotlivých písní</li>
        </ul>
      </li>
    </Entry>
    <Entry date="2019-05-14">
      <li>Pokrok na PDF exportu</li>
      <li>Odstraněn jeden z audio přehrávačů</li>
      <li>Opraven odkaz zpět pokud otevřete přímo píseň</li>
      <li>Přidán webfont cantarell</li>
      <li>Opraven bug v načítání písně (stejný problém jako u seznamu)</li>
      <li>Vyčištěn kód</li>
    </Entry>
    <Entry date="2019-04-16">
      <li>Nový pokus o opravení nenačtených písní</li>
      <li>Informace o dostupné aktualizaci a jak ji dostat</li>
    </Entry>
    <Entry date="2019-04-15">
      <li>Znak + jako oddělovač akordů</li>
    </Entry>
    <Entry date="2019-04-14">
      <li>Opravena chyba při které se nezobrazí žádné písně</li>
      <li>Opravena editace písní</li>
    </Entry>
    <Entry date="2019-04-07">
      <li>Zrychleno vyhledávání</li>
    </Entry>
    <Entry date="2019-03-31">
      <li>Transgender day of visibility</li>
      <li>
        Seznam písní by se měl při druhé a další návštěvě načítat rychleji
      </li>
      <li>Opraveno řazení písní pokud se změní její název</li>
      <li>Fulltextové vyhledávání</li>
      <li>Odstraněny horní odkazy</li>
      <li>Přidáno tlačítko zpět</li>
    </Entry>
    <Entry date="2019-03-19">
      <li>Stránky písně se zobrazují vedle sebe, pokud je dost místa</li>
    </Entry>
    <Entry date="2019-03-18">
      <li>Přidáno transponování</li>
      <li>
        Zmigrováno k Azure
        <ul>
          <li>Většina funkcionality byla zachována</li>
          <li>Odstraněny byly pouze štítky</li>
          <li>Ty později znovu přidám a lépe</li>
        </ul>
      </li>
      <li>Instalační tlačítko nyní nebrání otevření posledních písní</li>
    </Entry>
    <Entry date="2019-02-26">
      <li>Započetí migrace k Azure</li>
      <li>Sloupce se nyní plní odshora i při vyhledávání</li>
    </Entry>
    <Entry date="2018-12-19">
      <li>Modernizace nástrojů</li>
      <li>Písně jsou nyní seřazeny ve sloupečcích ne v řádcích</li>
    </Entry>
    <Entry date="2018-09-27">
      <li>Opraveno skrývání tlačítka &ldquo;Nainstalovat jako appku&rdquo;</li>
      <li>
        Implementováno ukládání scroll pozice
        <ul>
          <li>Na seznamu písní to ukládá pozici</li>
          <li>Při rozkliknutí písně to vždy vyscrolluje nahoru</li>
          <li>
            Pozice se ukládá do session storage, takže nevydrží restart
            prohlížeče
          </li>
        </ul>
      </li>
    </Entry>
    <Entry date="2018-09-12">
      <li>Přidán spotify player</li>
      <li>
        Pokud v seznamu písní chcete vidět, které mají a nemají spotify tak za
        URL přidejte ?spotify
      </li>
    </Entry>
    <Entry date="2018-09-01">
      <li>Vyhledávací lišta nyní &quot;plave&quot; nad obsahem</li>
      <li>Úvodní obrazovka je nyní seznam písní</li>
    </Entry>
    <Entry date="2018-08-25">
      <li>
        Drobná vylepšení v editoru písní
        <ul>
          <li>Skryta nápověda (zobrazitelná tlačítkem)</li>
          <li>Tlačítko uložit se zobrazuje pouze pokud je relevantní</li>
          <li>Zdroják písně se automaticky formátuje při uložení</li>
        </ul>
      </li>
      <li>Přidáno vyhledávání do seznamu písní</li>
    </Entry>
    <Entry date="2018-08-15">
      <li>Započata práce na PDF exportu</li>
    </Entry>
    <Entry date="2018-08-10">
      <li>Přidán changelog</li>
    </Entry>
  </div>
)
export default errorBoundary(Changelog)
