# Sequential-Interaction-Prototype
Codebase for my sequential interaction project in IXD 107-03, working with Claude code

**Live site:** https://dbalsam.github.io/Sequential-Interaction-Prototype/

**Study (with Behavior Controls):** https://dbalsam.github.io/Sequential-Interaction-Prototype/study/

## Pit stop training drill

One linear interaction sequence built from the three pit stop studies. Each step unlocks only after the previous one succeeds:

0. **Car in** (tap *Start drill*): the car rolls into the pit box and is raised on the jack.
1. **Fit the wheel** (drag): carry the tire from the rack onto the hub. The drill clock starts on first touch.
2. **Drop the jack** (swipe): flick down fast and far enough to drop the car.
3. **Send the car** (pull): pull the lever past the commit line and let go. The clock stops when the lever slams.

The drill ends with a result card (total time, split per step, best time saved in this browser) and a *Run it again* button that returns to the start.

## Files

- `docs/` is the published website (GitHub Pages source: `main` branch, `/docs` folder). It's plain HTML, CSS and JS, with no build step.
  - `index.html`, `css/style.css`, `js/sequence.js`, `.nojekyll`
  - `study/index.html` is a published copy of `studies/pit-stop-studies/index.html`. Edit the studies file, then copy it here.
- `studies/pit-stop-studies/` holds the original interaction studies, extracted from `pit-stop-studies.zip`, with notes in `STUDY.md`.
- `index.html` and `test image.jpg` at the root are the earlier "Hello class!" page.

To preview locally, open `docs/index.html` in a browser.
