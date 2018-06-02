# Downloading project

```
git clone git@gitlab.com:martin1703/MICE_Agency.git mice-agency
cd mice-agency
```

# Dependencies

This project need `docker` and `node` to run dev environment. Everything else is
included in the docker image so that you don't need to install it.

Optional dependency: `tmux` - if you want to run it in local shell

# Login to npm registry

```
npm run login
```

# Starting

To run whole environment in tmux run `npm run tmux -- <configuration>`

To run in tmux within docker `npm run docker -- tmux <configuration>`

In either of above cases if you do not specify configuration it prints list
of available configurations. Configurations are specified in `package.json`

# Installing packages for IDE

It might be useful to also install `node_modules` outside of docker. To do
that just run `cd backend && npm i && cd frontend && npm i`
