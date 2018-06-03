# Songbook

## Cíl projektu

Vytvořit online (a offline) zpěvník, který bude zároveň dobře fungovat pro tisk.

## Funkcionalita

Umí zobrazit seznam tagů, seznam písní v tagu a jednotlivé písně. Dále umí
zobrazit všechny písně v daném tagu pod sebe zformátované pro tisk na A6 formát.

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
