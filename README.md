# Ali Azgar Rakib — Resume & Playable CV

Live: **https://ali-azgar-rakib.github.io/profile/**

A static, no-build website with two pages that share one data file:

- **`index.html`** — interactive resume homepage (synthwave theme, skill filters, quest-log timeline,
  copy-to-clipboard contact). *Save as PDF* prints a clean white one-page-style resume.
- **`play.html`** — the same resume as a neon side-scrolling platformer. Every world is a CV section.

| World | Section | What's in the level |
|---|---|---|
| 1 · Player Select | About | Your name in lights + a **Profile** terminal (summary, RPG stats, perks, links) |
| 2 · Skill Caverns | Skills | One collectible **crystal per skill** + a Skill Tree terminal |
| 3 · Quest Log City | Experience | One **building per job** — walk in the door to read it |
| 4 · The Arcade | Projects | One **arcade cabinet per project** (screenshot or YouTube trailer, tech, links) |
| 5 · Academy Peaks | Education | One **tower per degree / certificate** |
| 6 · Trophy Hall | Achievements | Trophies on pedestals — jump up to claim them |
| 7 · Final Castle | Contact | Mailbox with email/links, finish flag → score screen |

Bugs 🐞 patrol some levels — jump on them to "fix" them.

## 1. Edit your content

Open **`js/data.js`** — that is the only file you need to change. Both the homepage and the game read it. The levels are generated
from it, so adding a fourth job adds a fourth building, removing all achievements removes
that world, etc.

- Images (avatar, project screenshots, CV PDF) go in **`assets/`**, e.g. `image: "assets/neon-drift.png"` (16:9 looks best).
- `video:` accepts a YouTube link or ID and shows the trailer inside the project panel.
- Leave a field as `""` to hide it.

Preview locally by double-clicking `index.html` (resume) or `play.html` (game).

## 2. Put it online (free)

### GitHub Pages
1. Create a repo — name it **`your-username.github.io`** to get the site at `https://your-username.github.io` (any other name works too and becomes `https://your-username.github.io/repo-name`).
2. Upload everything in this folder (keep the folder structure: `index.html`, `css/`, `js/`, `assets/`).
   *Web upload:* repo → **Add file → Upload files** → drag the files in → Commit.
3. Repo → **Settings → Pages** → *Source:* "Deploy from a branch" → Branch `main`, folder `/ (root)` → Save.
4. Wait ~1 minute and open the URL shown on that page.

### Other free hosts
- **Netlify Drop** – drag the folder onto app.netlify.com/drop.
- **Cloudflare Pages / Vercel** – connect the GitHub repo, no build command, output dir `/`.
- **itch.io** – zip the folder, create an "HTML" project and upload the zip (fits a game dev portfolio nicely).

## Handy links to share
- `https://ali-azgar-rakib.github.io/profile/` — the resume homepage
- `https://ali-azgar-rakib.github.io/profile/play.html` — the game
- `https://ali-azgar-rakib.github.io/profile/play.html#projects` — starts the game at a world (`#skills`, `#experience`, `#education`, `#contact`)

## Controls
`← →` / `A D` move · `Space` / `W` / `↑` jump (twice for double jump) · `↓ + Space` drop through platforms ·
`E` / `Enter` open · `1–7` fast travel (or click the map bar) · `M` sound · `Esc` close.
Phones and tablets get on-screen buttons automatically.

## Customising further
- World names & colours: `ZONE_DEFS` near the top of `js/game.js`.
- Player sprite: `PAL` (colours) and `BODY` (8×12 pixel map) in `js/game.js` — recolour the hoodie to your brand.
- Physics feel: `PHYS` in `js/game.js`.
- Sounds are synthesised in code (no audio files); visitors can mute with `M`.

No frameworks, no build step, no tracking. Fonts: Press Start 2P & Space Grotesk via Google Fonts.
