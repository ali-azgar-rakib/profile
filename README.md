# Ali Azgar Rakib — Resume & Playable CV

Live: **https://ali-azgar-rakib.github.io/profile/**

A static, no-build website with two pages that share one data file:

- **`index.html`** — interactive resume homepage (synthwave theme, skill filters, quest-log timeline,
  copy-to-clipboard contact). *Save as PDF* prints a clean white one-page-style resume.
- **`play.html`** — the same resume as a 3D open-world game (Three.js): roam a village with houses, a river, forest and a rain cycle. Every villager and animal carries part of the CV — tag them with the blaster to read it.


## 1. Edit your content

Open **`js/data.js`** — that is the only file you need to change. Both the homepage and the game read it. The levels are generated
from it, so adding a fourth job adds a fourth building, removing all achievements removes
that world, etc.

- Images (avatar, project screenshots, CV PDF) go in **`assets/`**, e.g. `image: "assets/neon-drift.png"` (16:9 looks best).
- `video:` accepts a YouTube link or ID and shows the trailer inside the project panel.
- Leave a field as `""` to hide it.

Preview locally: double-click `index.html` for the resume. The 3D game uses JavaScript modules, so run a tiny local server first (`python -m http.server` in this folder, then open http://localhost:8000/play.html).

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

## Controls
Desktop: `WASD` walk · mouse look · click to tag · `Shift` run · `Space` jump · `M` sound · `Esc` release mouse.
Phones: left stick to walk, drag to look, ● to tag, ▲ to jump.

## Customising further
- Characters, colours and world layout: `js/game3d.js` (`buildNPCs`, `SPECIES`, `PEOPLE`, `ACCENT`).
- Three.js is bundled in `js/vendor/` (MIT licence), so the site needs no CDN.

No build step, no tracking. Fonts: Press Start 2P & Space Grotesk via Google Fonts.
