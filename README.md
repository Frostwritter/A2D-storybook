# A2D Storybook

A small static web app for reading your board game’s events and story texts like a storybook.

You maintain the content yourself in [`content/events.json`](content/events.json). Later a BASE agent can help with brainstorming — run `base init` first (see below).

## Preview locally

GitHub Pages and `fetch` need a local server (double-clicking `index.html` often is not enough):

```bash
cd C:\dev\A2D-storybook
npx --yes serve .
```

Then open the URL shown in the browser (usually `http://localhost:3000`).

## Edit the texts

In `content/events.json`:

1. Adjust `meta.title` / `meta.tagline`
2. Extend `chapters` and `types` if needed
3. Add or replace entries under `events`

Fields per event:

| Field | Meaning |
|------|-----------|
| `id` | Stable ID (also in the URL: `#id`) |
| `number` | Spoiler-free list label (e.g. `4`) |
| `spoilerFree` | If true, the list shows only the number; `title` is revealed after click |
| `title` | Heading on the page (leave empty to keep the number) |
| `chapter` | ID from `chapters` |
| `type` | ID from `types` |
| `tags` | Freeform keywords |
| `summary` | Optional short text under the title |
| `body` | Body copy; separate paragraphs with a blank line |
| `choices` | Optional unfoldable options (nested `choices` allowed) |

A choice: `label`, optional `note` / `requires`, `body`, optional nested `choices`.

Outcomes on a page or choice:

- `ongoing` — lasting table rules (permanent effects)
- `once` — one-time gains or losses

## GitHub + Pages

Repo: [Frostwritter/A2D-storybook](https://github.com/Frostwritter/A2D-storybook)

After the first push: in the repo **Settings → Pages**

- Source: **Deploy from a branch**
- Branch: `main` / folder: `/ (root)`
- Save

Then: `https://frostwritter.github.io/A2D-storybook/`

Later text updates: change `events.json` → commit → `git push`.

## BASE (later)

If you want the brainstorm agent: initialize the folder with the BASE framework (`base init` with `framework_dir` pointing to `c:/dev/base-main`), then add an agent/process for events. The storybook files under `content/` stay the source of truth.
