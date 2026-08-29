# A2D Storybook

Kleine statische Web-App, um Events und Story-Texte deines Brettspiels wie ein Storybook zu lesen.

Inhalt pflegst du selbst in [`content/events.json`](content/events.json). Später kann ein BASE-Agent beim Brainstormen helfen — dafür erst `base init` (siehe unten).

## Lokal ansehen

GitHub Pages und `fetch` brauchen einen lokalen Server (Doppelklick auf `index.html` reicht oft nicht):

```bash
cd C:\dev\A2D-storybook
npx --yes serve .
```

Dann im Browser die angezeigte URL öffnen (meist `http://localhost:3000`).

## Texte einfügen

In `content/events.json`:

1. `meta.title` / `meta.tagline` anpassen  
2. `chapters` und `types` bei Bedarf erweitern  
3. Einträge unter `events` hinzufügen oder ersetzen  

Felder pro Event:

| Feld | Bedeutung |
|------|-----------|
| `id` | stabile ID (auch in der URL: `#id`) |
| `title` | Überschrift |
| `chapter` | ID aus `chapters` |
| `type` | ID aus `types` |
| `tags` | freie Schlagworte |
| `summary` | Kurztext in der Liste / unter dem Titel |
| `body` | Fließtext; Absätze durch Leerzeile trennen |

Beispiel-Einträge (`sample-*`) kannst du löschen, sobald eigene Texte da sind.

## GitHub + Pages

Repo: [Frostwritter/A2D-storybook](https://github.com/Frostwritter/A2D-storybook)

Nach dem ersten Push: im Repo **Settings → Pages**

- Source: **Deploy from a branch**
- Branch: `main` / folder: `/ (root)`
- Speichern

Danach: `https://frostwritter.github.io/A2D-storybook/`

Spätere Text-Updates: `events.json` ändern → commit → `git push`.

## BASE (später)

Wenn du den Brainstorm-Agenten willst: Ordner mit dem BASE-Framework initialisieren (`base init` mit `framework_dir` auf `c:/dev/base-main`), dann Agent/Process für Events anlegen. Die Storybook-Dateien bleiben die Quelle der Wahrheit unter `content/`.
