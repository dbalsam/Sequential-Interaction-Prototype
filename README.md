# Sequential-Interaction-Prototype
Codebase for my sequential interaction project in IXD 107-03, working with Claude code

**Live site:** https://dbalsam.github.io/Sequential-Interaction-Prototype/

**Study (with Behavior Controls):** https://dbalsam.github.io/Sequential-Interaction-Prototype/study/

**Trackside (motorsports photographer):** https://dbalsam.github.io/Sequential-Interaction-Prototype/photographer/

## Trackside: a motorsports photographer experience

Follows the Week 7 Figma flow (*Motorsports Photographer*). It's a branching sequence: every choice leads to a Great shot or a Weak shot, and each result's button returns to the start.

- **Start**: You're a race photographer. What moment do you want to capture?
  - **Trackside**: What type of settings do I need?
    - **Panning shot**: slower shutter, track smoothly. Telephoto lens? Yes = Great shot, No = Weak shot (the car is a tiny dot).
    - **Sharp action shot**: faster shutter, burst mode. Telephoto lens? Yes = Great shot, No = Weak shot.
  - **Possible Podium**: Who should I focus on?
    - **The Team**: fast shutter, burst mode. Can you fit the whole team? Yes = Great shot (they want to hire you), No = Weak shot (team cropped out).
    - **Driver**: shorter lens, smaller f-stop. Right settings and lens? Yes = Great shot (used for advertising worldwide), No = Weak shot (busy background).

The photos move: trackside screens pan sideways like a camera following a car, the others push in slowly, and the viewfinder sways like a handheld camera. Some photos are partly live: on the podium the champagne bottles tilt and spray, the driver tips his bottle back while drinking, and the confetti keeps falling over the team (a canvas layer in `app.js`, see `FX`). Turning on "reduce motion" on your device stops all of it.

Between the last answer and the result you take the shot, and it works like a DSLR, not a phone. You look through an optical viewfinder with etched AF points and a green info line (shutter, aperture, exposure scale, ISO, focus confirmation, frames left). Below it is the camera's top plate: status LCD, mode dial and a two-stage shutter button. Half-press (hold the button, or Space) to focus: the active AF point flashes red and the camera beeps when focus locks. Full press (push the button down, or Enter) to take the picture. The camera is in focus priority, so a full press fires as soon as focus locks, and a quick press does both. Letting go of a half-press cancels focus. Each frame plays a mirror-slap sound and blacks out the viewfinder. Burst-mode paths fire 6 frames at 10 fps.

Files: `docs/photographer/index.html`, `style.css`, `app.js`, and the photos in `docs/photographer/img/` (named by what they show, e.g. `astemo-panning.jpg`, `team-confetti.jpg`). To swap a photo, save a new one over it with the same name; the code reads each photo's real size. `weak-tiny-car.jpg` and `weak-wide-turn.jpg` are still low-resolution crops from the Figma screenshot.

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
