import { hot } from 'react-hot-loader'
import React from 'react'
import Entry from 'components/changelog-entry'

const Changelog = () => (
  <div>
    <Entry date="2018-08-25">
      Drobná vylepšení v editoru písní
      <ul
        css={`
          margin-top: 0;
        `}
      >
        <li>Skryta nápověda (zobrazitelná tlačítkem)</li>
        <li>Tlačítko uložit se zobrazuje pouze pokud je relevantní</li>
        <li>Zdroják písně se automaticky formátuje při uložení</li>
      </ul>
    </Entry>
    <Entry date="2018-08-15">Započata práce na PDF exportu</Entry>
    <Entry date="2018-08-10">Přidán changelog</Entry>
  </div>
)
export default hot(module)(Changelog)
