# Cyber Trust CV Dashboard

Candidates upload a CV (PDF, DOCX or TXT) and get an animated, cyber-security themed dashboard laid out like an
ecosystem infographic: the candidate sits in a glowing hub at the centre, and data strands flow in from their
expertise and toolkit (blue) and out to their roles and projects (amber).

The CV is read **in the browser** — nothing is uploaded to a server. The parsed profile is kept in `localStorage`
on the candidate's own device.

## What goes where

| On the page | Filled from the CV |
| --- | --- |
| Title + blue line (top left) | Headline (role) and tagline |
| Five amber pillars | First five skills, each with an icon and a line taken from the CV's own bullets when one mentions it |
| Toolkit | The next skills / tools |
| Trust framework wheel | Certifications (topped up with interests so the wheel is always complete) |
| Hub | Name, role and years of experience (counts up) over a sunrise on the earth's curve |
| Trust & Track Record | Years, certifications, roles, projects, skills — all counting up |
| Career Flow | Strand chart seeded from the CV, plus counting years / projects |
| Experience · Projects & Engagements | Roles (with company and dates) and project titles |
| Key Outcomes | Achievements |
| World map | Motto as the title, a pin near the candidate's location, animated connection arcs |
| Interests & Goals | Interests and goals on an orbit that walks round on its own (hover to take over) |

Before anything is uploaded the page shows the full design with neutral placeholders ("Your Name", "Skill One" …).

## Motion

- Data strands are measured from the real DOM positions of the panels (re-measured on resize), with light pulses and
  packets travelling along them; hovering a row lights up its own strand.
- Borders of every card carry a travelling light (conic gradient on a masked ring) and a pointer-follow glow.
- The role title decodes letter by letter, numbers count up when they scroll into view, and the sun rises behind the
  hub on load.
- Everything respects `prefers-reduced-motion`.

## Develop

```bash
npm install
npm run dev          # local dev server
npm test             # parser tests (vitest)
npm run build        # static build in dist/ (deployed to GitHub Pages by .github/workflows/deploy.yml)
npm run build:single # one self-contained dist-single/index.html
```

Stack: Vite, React 18, TypeScript, pdf.js and mammoth for reading files. Fonts (Inter, Barlow Condensed) are
bundled locally, so the page makes no third-party requests.

## Structure

```
src/
  App.tsx                  upload → read → review → dashboard flow
  lib/parseResume.ts       turns CV text into a structured profile (tested in parseResume.test.ts)
  lib/security.ts          maps skills to icons / one-line descriptions, shortens certification names
  components/Ecosystem.tsx intro, pillars, wheel, hub, trust layer, career flow, side panels
  components/FlowLines.tsx the measured SVG data strands
  components/BottomRow.tsx outcomes, world map, interests & goals orbit
  data/sample-cv.txt       a fictional sample CV for trying the flow
```

The sample CV and every name, email and company in it are fictional.
