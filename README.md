# Cyber Trust Dashboard

An animated, cyber-security themed profile dashboard laid out like an ecosystem infographic: the person sits in a
glowing hub at the centre, and data strands flow in from their expertise and toolkit (blue) and out to their roles
and projects (amber).

## Edit the content

Everything on the page comes from **`src/data/profile.ts`**. Replace the placeholder values ("Your Name",
"Skill One" …) and the whole dashboard updates — no other file needs to change. The numbers in `stats` are the ones
that count up. To offer a "Download CV" button, put the file in `public/` and set `cvUrl`.

| On the page | Field in `profile.ts` |
| --- | --- |
| Title + blue line (top left) | `headline` (role) and `tagline` |
| Five amber pillars | first five `skills` (icon and line chosen in `src/lib/security.ts`) |
| Toolkit | the next `skills` |
| Trust framework wheel | `certifications` (topped up with `interests`) |
| Hub | `name`, role, `stats.years` over a sunrise on the earth's curve |
| Trust & Track Record | years, certifications, roles, projects, skills |
| Career Flow | strand chart seeded from the profile, plus years / projects |
| Experience · Projects & Engagements | `experience` and `projects` |
| Key Outcomes | `achievements` |
| World map | `motto` as the title, a pin near `location` |
| Interests & Goals | `interests` and `goals` on an orbit |

## Motion

- Data strands are measured from the real positions of the panels (re-measured on resize), with light pulses and
  packets travelling along them; hovering a row lights up its own strand.
- Every card border carries a travelling light (conic gradient on a masked ring) and a pointer-follow glow.
- The role title decodes letter by letter, numbers count up as they scroll into view, and the sun rises behind the
  hub on load.
- Everything respects `prefers-reduced-motion`.

## Develop

```bash
npm install
npm run dev          # local dev server
npm run typecheck
npm run build        # static build in dist/ (deployed to GitHub Pages by .github/workflows/deploy.yml)
npm run build:single # one self-contained dist-single/index.html
```

Stack: Vite, React 18, TypeScript. Fonts (Inter, Barlow Condensed) are bundled locally, so the page makes no
third-party requests.

## Structure

```
src/
  data/profile.ts          all the content
  lib/security.ts          maps skills to icons / one-line descriptions, shortens certification names
  components/Ecosystem.tsx intro, pillars, wheel, hub, trust layer, career flow, side panels
  components/FlowLines.tsx the measured SVG data strands
  components/BottomRow.tsx outcomes, world map, interests & goals orbit
  components/Chrome.tsx    top bar and footer
```
