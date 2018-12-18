import React from 'react'
import Entry from 'components/changelog-entry'

const Changelog = () => (
  <div>
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
export default Changelog
