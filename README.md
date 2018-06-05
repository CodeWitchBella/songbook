# Songbook

https://songbook.skorepa.info/

## Cíl projektu

Před pár lety jsem pro tábor, na který pravidelně jezdím vytvořil zpěvník, který
má veliký úspěch. Jelikož je to ale podivný mix TeXu a bash scriptů tak to není
snadné udržovat a úpravy jako změna velikosti písma pro jednotlivé písně, nebo
obrázky jsou dosti komplikované. Proto jsem se rozhodl vytvořit webovku, která
tento systém nahradí.

Cílem tedy je vytvořit online (a offline) zpěvník, který bude zároveň dobře
fungovat pro tisk.

## Funkcionalita

Umí zobrazit seznam tagů, seznam písní v tagu a jednotlivé písně. Dále umí
zobrazit všechny písně v daném tagu pod sebe zformátované pro tisk na A6 formát.

Celá webová aplikace funguje díky ServiceWorkeru po prvním otevření offline.
U novějších zařízení je možno ji nainstalovat na domovskou obrazovku (vyzkoušeno
na androidu v chrome).

Písně jsou specifikované v jednoduchém formátě a jsou parsovány na frontendu.
Také je možné k písni přidat zvukový soubor, který se poté u písně dá přehrát
(možno vidět u Alison Gross). Toto samozdřejmě nefunguje v tištěné verzi 😉

Zpěvníkové zobrazení je možno přepínat mezi desktop/mobile-friendly verzí a
verzí, která je blíže tomu, jak to vypadá ve finálním tisku. Tisk bohužel
nefunguje dobře v chrome, ale pouze ve firefoxu (ostatní prohlížeče jsem
nezkoušel). Je to dáno tím, že chrome nerespektuje nastavení stránky (`@page`).

Estetické podání bylo bráno hlavně s ohledem na praktičnost použití - tedy žádné
rušivé prvky.

## Dependencies

This project need `docker` and `node` to run dev environment. Everything else is
included in the docker image so that you don't need to install it.

Optional dependency: `tmux` - if you want to run it in local shell

## Starting

To run whole environment in tmux run `npm run tmux -- <configuration>`

To run in tmux within docker `npm run docker -- tmux <configuration>`

In either of above cases if you do not specify configuration it prints list
of available configurations. Configurations are specified in `package.json`

## Installing packages for IDE

It might be useful to also install `node_modules` outside of docker. To do
that just run `cd backend && npm i && cd frontend && npm i`
