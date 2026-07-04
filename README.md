# Songbook

https://zpevnik.skorepova.info/

> [!NOTE]
> The canonical repository lives at [forgejo.isbl.cz](https://forgejo.isbl.cz/isabella/songbook). If you're viewing this anywhere else, it's a mirror.
>
> I accept pull requests from both [code.nolog.cz](https://code.nolog.cz/isbl/songbook) and GitHub. You can also just email me a patch — that's fun.

## Developing

Two setups are available. Fullstack also works for frontend-only work, but is more involved to set up — in particular, Nix doesn't work on Windows outside of WSL. You can start with the frontend-only setup and move to fullstack later. However, since I use fullstack setup for developing, it's generally more polished.

### Frontend-only

Use this if you're only working on the frontend and don't want the extra setup of running the backend locally.

Prerequisites: [pnpm](https://pnpm.io/)

```sh
cd frontend
pnpm i
pnpm run gen:api
```

The dev server proxies `/api` to https://zpevnik.skorepova.info by default (override with the `API_PROXY_TARGET` env var if needed). Now you can run:

```sh
pnpm run dev
```

or, for Storybook:

```sh
pnpm run storybook
```

### Fullstack

Use this if you're working on the backend, or want the full stack running locally.

Prerequisites: [Nix](https://nixos.org/) with flakes enabled

Run `nix run` in the repo root to get everything running (backend, frontend, and database) in one go.

If you'd rather run things yourself, run `nix develop` in the repo root to enter the dev shell (Node, pnpm, etc.)
(for convenience, you can instead use [direnv](https://direnv.net/) and run `direnv allow` once).
