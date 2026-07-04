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

## AI Policy

I maintained this project for almost a decade with zero AI. Lately, I didn't really touch it except couple of weeks before summer camp, but I needed some features. To do that, I had to let go of my perfectionism (perfect; the enemy of good) and just let ThE aGeNTiC HarNEsS do some of the things I wanted to do for years. I just use it in particular way.

**My approach.** Figure out a small, commit-shaped change first, then ask the model to do that one little thing. Validate that the thing is what you wanted (don't trust anyone that reading code is dead; it's not). Repeat. Basically the same thing that software engineering always was: break it down, figure out how to validate it, do it. LLMs improve the last part - do not outsource the thinking.

> A COMPUTER CAN NEVER BE HELD ACCOUNTABLE
> 
> THEREFORE A COMPUTER MUST NEVER MAKE A MANAGEMENT DECISION
>
> - IBM Training Manual from 1979

**Want to see something improved?** Ask the robot, send PR. Drop a note in the PR description telling me:

- that you used AI;
- whether you *ran* the thing to confirm it works and fits your use case;
- but MOST IMPORTANTLY: what is the the problem you're trying to solve.

I don't care about code beauty or whatever. I care if people enjoy using this thing. And if it'll randomly break and I'll have to fix it two weeks before summer camp (it's kind of a tradition at this point though).

**Comments.** Delete the pointless comments though, please. There might be some that are warranted, but it's about 10% of what the robot produces.

**Training.** There's no license on this code, so by default everything here is copyrighted - all rights reserved. Friends and other creatures who ask nicely will probably get permission to use it for whatever, training included. The big labs won't ask anyway, so this paragraph is mostly for the people who would (the hosting is getting scraped even though this project always had robots.txt set to deny).

(yes, this section was AI-drafted; I didn't have the [spoons](https://en.wikipedia.org/wiki/Spoon_theory) until I hated the AI writing too much. I do have a [favourite spoon](https://www.ikea.com/cz/en/p/dragon-24-piece-cutlery-set-stainless-steel-90091760/) though. I actually ended up rewriting the section a lot though; fuck rule of threes; emdashes are great tho)
