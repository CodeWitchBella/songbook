import { hot } from 'react-hot-loader'
import React from 'react'
import Entry from 'components/changelog-entry'

const Changelog = () => (
  <div>
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
export default hot(module)(Changelog)
