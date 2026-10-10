# A2D Storybook

A small static web app for reading your board game’s events and story texts like a storybook.

You maintain the content yourself in [`content/events.json`](content/events.json). Later a BASE agent can help with brainstorming; run `base init` first (see below).

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
2. Extend `chapters` if needed
3. Add POIs under `events`, combats under `combats`

The sidebar has two sections: **POI** and **Combats**. Search is in the HTML but hidden for now.

**Items** in `once` / `ongoing` use square brackets:

```text
Gain [Torch (2)].
Gain [Pelt (6)] and [Steak (7)].
```

Everything inside `[...]` is rendered as an item chip (frame + optional icon). The icon is looked up by the name before the number, e.g. `Torch` from `[Torch (2)]`.

**Inline icons** (no chip) use colons with the same name lookup:

```text
Lose 1 :Energy:.
Costs 2 :Energy: and a :Torch:.
```

Top-level `icons` maps names to files under `content/`:

```json
"icons": {
  "Torch": "assets/icons/torch.svg",
  "Energy": "assets/icons/energy_black.png"
}
```

Put icons in `content/assets/icons/` and illustrations in `content/assets/images/`.

**Combat** example:

```json
{
  "id": "combat-i",
  "label": "I",
  "setup": {
    "body": "Short flavour text.",
    "image": "assets/images/combat-i-setup.png",
    "goal": "Kill all enemies."
  },
  "conclusion": [
    "10 gold per character",
    { "info": "Optional note between rows." },
    ":Card: Strike",
    "Gain [Torch (2)]."
  ]
}
```

Fields per POI (`events`):

| Field | Meaning |
|------|-----------|
| `id` | Stable ID (also in the URL: `#id`) |
| `number` | Spoiler-free list label (e.g. `4`) |
| `spoilerFree` | If true, the list shows only the number; `title` is revealed after click |
| `title` | Heading on the page (leave empty to keep the number) |
| `chapter` | ID from `chapters` |
| `tags` | Freeform keywords |
| `summary` | Optional short text under the title |
| `image` | Optional illustration |
| `body` | Body copy; separate paragraphs with a blank line |
| `info` | Optional short highlighted note shown in an info box |
| `choices` | Optional unfoldable options (nested `choices` allowed) |

A choice: `label`, optional `note` / `requires` / `info` / `image`, `body`, optional nested `choices`.

`requires` is marked text like `once` / `note` (use `[Item]` / `:Icon:` yourself), e.g. `"requires": "[Ancient Tablet (5)]"`.

Outcomes on a page or choice:

- `ongoing`: lasting table rules (permanent effects)
- `once`: one-time gains or losses (mark items with `[Name (nr)]`)
- `repeatable`: effects that can be done again (same markup as `once`)

Panel order follows the key order in JSON for `image`, `body`, `info`, `ongoing`, `once`, `repeatable`, and nested `choices`. Put `info` above or below effects by placing the key accordingly.

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
