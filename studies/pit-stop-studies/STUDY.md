# Pit stop: three interaction studies

Source: `index.html` (single self-contained file, exported verbatim from the artifact). Line numbers below refer to that file.

## 1. What the study does

A three-step pit stop sequence, each step its own interaction study, shown as tabs. Each step unlocks the next:

1. **Fit the wheel** (drag): carry a fresh tire from a rack onto an empty hub.
2. **Drop the jack** (swipe): flick down on the car fast and far enough to lower it.
3. **Send the car** (pull): pull a lever past a commit line and release to send the car out. The last step is the one irreversible action and ends with a "stop time."

Steps 2 and 3 each have a "Previous step complete" checkbox that stands in for the prior study's result. The three studies are **not yet wired together**; that is the intended job for the connected prototype (see section 7).

Wireframe look: grayscale only, light and dark themes follow `prefers-color-scheme`.

## 2. Main visual and interactive components

| Study | Component | Role |
|---|---|---|
| 1 | `#rack` (dashed box), `#axle` (vertical line) | Starting area and hub reference |
| 1 | `#tire` (88px SVG, grip ticks, hidden check) | The draggable object; `role="slider"` |
| 1 | `#halo` (dashed ring at hub) | Proximity feedback ring |
| 1 | `#socket` (small dashed circle) | Stud target at hub center |
| 1 | `#state`, `#gap` | Status text and "N px off" readout |
| 2 | `#zone` (swipe area), `#car`, `#jack` | Car rises on jack; swipe target; `role="button"` |
| 2 | `.cue` with 3 `.chev` chevrons | Speed meter; all three lit means fast enough |
| 3 | `#track`, `#fill`, `#commit` | Lever track, fill behind lever, dashed commit line |
| 3 | `#handle` (+ `#hlabel`, `.tri`) | The lever; `role="slider"` |
| 3 | `.lane` with `#mini` | Mini car that launches away |
| 3 | `#time` | Running "stop time" readout |
| All | `.chip#next` / `#nextText` | "Next step" gate chip (dashed = closed, solid = open) |
| All | `#reset` button, `.setup` checkbox (2, 3) | Reset; simulate previous step complete |
| All | `.tabs` | Tab bar to switch studies |
| All | `details.spec` | Collapsible interaction spec per study |

## 3. User actions, feedback, states, transitions

### Study 1: Fit (drag)
- **States** (JS `mode`): `rack` -> `carry` -> `fitted`. Halo `data-level`: `far` -> `near` -> `ready` -> `fitted`.
- **Actions:** pointer-drag the tire (or arrow keys to move, Enter/Space to drop).
- **Feedback:**
  - Tire follows the pointer with no lag by default (follow lag 0ms; originally ~70ms of exponential smoothing, adjustable in Behavior Controls).
  - Within 95px of the hub (`PULL`) the tire slows and is drawn toward the hub (power curve); halo border thickens (`near`).
  - Within 40px (`DROP`) halo goes heavy/solid (`ready`), text "Lined up with the studs. Let go."
  - `#gap` shows distance in px.
- **Transitions:**
  - Release inside `DROP`: tire snaps to hub, `seat` bounce animation, after 260ms the halo fills, check appears, text "Fitted", chip opens ("Jack open").
  - Release outside: tire animates back to rack ("Missed...", resets to "On the rack" after 900ms).
  - Reset: back to rack, chip closed.

### Study 2: Drop the jack (swipe)
- **States** (`state`, mirrored to `#zone[data-state]`): `locked` -> `ready` -> `dropped` (`ready` again after a rejected swipe).
- **Actions:** pointer-swipe down on the zone (or Enter/Space/ArrowDown). Judged on distance (`MIN_DIST` 55px) and speed (`MIN_V` 0.9 px/ms, measured over the last ~100ms of samples).
- **Feedback:**
  - Car follows the finger down while the jack height shrinks.
  - Chevrons light top-down in proportion to live speed; three lit means fast enough. Text switches "Faster" / "Fast enough. Keep going and let go."
  - Locked look: hollow dashed car and jack.
- **Transitions:**
  - Fast and far: car drops (90ms ease-in), jack collapses, chip opens ("Release open").
  - Too short or too slow: car overshoots back up with an elastic ease (`.back`, 500ms), message explains why.
  - Checkbox on -> `unlock()`; off -> `lock()` (car returns to start).

### Study 3: Release (pull)
- **States:** lever `data-state`: `locked` -> `ready` -> `armed` -> `released`. Motion modes: `idle`, `drag`, `fall`, `slam`.
- **Actions:** drag lever up (or ArrowUp/ArrowDown in 10px steps, Enter/Space to release). Commit threshold is 85% of travel (`THRESH`).
- **Feedback:**
  - Lever lags the hand (exponential smoothing, ~90ms); `#fill` grows behind it.
  - Crossing the line inverts the lever and relabels it "Let go".
  - Timer (`#time`) starts when unlocked and stops at impact.
- **Transitions:**
  - Release past the line: lever slams to the top (170ms quadratic), track "thud" animation, timer stops, chip shows "Car gone", mini car launches after 110ms.
  - Release early: lever falls under gravity (`G`) with a small bounce, "Not committed...".
  - Checkbox off or Reset: car returns, lever locks, timer zeroed.

### Tabs
Clicking a tab sets `aria-selected`, toggles `hidden` on the panels, and fires a window `resize` (so Study 1 recalculates its layout after being shown).

## 4. Where it is implemented

All in `index.html`.

| Area | Lines |
|---|---|
| CSS tokens, theme (light/dark) | 8-10, repeated at 62-64 and 117-119 |
| CSS Study 1 | 18-59 |
| CSS Study 2 | 72-114 (zone/car/jack 75-87, chevrons 88-92) |
| CSS Study 3 | 127-164 (track/handle 131-142, lane/mini 143-145, thud 162-164) |
| CSS tabs / panel hiding | 166-173 |
| HTML tabs | 178-179 |
| HTML Study 1 / 2 / 3 | 180-220 / 221-258 / 259-299 |
| JS Study 1 (IIFE) | 303-420: `layout`, `place`, `carry`, `drop`, `reset`, pointer and key handlers |
| JS Study 2 (IIFE) | 421-506: `show`, `setArrows`, `speed`, `lock`, `unlock`, `drop`, `reject`, handlers |
| JS Study 3 (IIFE) | 507-628: `render`, `setHandle`, `loop` (rAF), `impact`, `finish`, `lock`, `unlock`, handlers |
| JS tab switching | 630-634 |

Tunable constants: `PULL`, `DROP` (line 311), `LIFT`, `MIN_DIST`, `MIN_V` (429), `H`, `TRACK_H`, `THRESH`, `G` (515-517).

## 5. Dependencies and assets

- **None.** No npm packages, no CDN scripts, no web fonts, no images. Tire, car, and chevrons are CSS/inline SVG. Font is the system stack.
- Needs a modern browser with Pointer Events, CSS custom properties, `prefers-color-scheme`.
- Open `index.html` directly, or serve it: `npm start` (uses `npx serve`) or `npm run dev` (`python3 -m http.server 3000`), then visit http://localhost:3000.

## 6. Gotchas when combining with other studies

- **Duplicate IDs across studies.** `#state`, `#next`, `#nextText`, `#reset` appear in all three sections. The JS avoids collisions by scoping lookups to each section: `root.querySelector('#'+id)`. Keep that scoping, or rename IDs, when merging.
- **Duplicate global CSS.** The theme tokens and base rules (`.chip`, `button.plain`, `.spec`, `dl`, `.row`, `#state`) are repeated three times, one block per study. They are identical, so they can be deduplicated into one block safely.
- **Global CSS ID rules** (`#state`, `#info`, `#time`, `#zone`, `#tire`) are not namespaced; scope them if adding more studies.
- **Study 1 relies on the `resize` event** to lay out correctly after its tab becomes visible; `layout()` reads `field.clientWidth`.
- **No shared state.** Each study is an IIFE with private state. The "next step" is only a chip plus, in studies 2 and 3, a manual checkbox.

## 7. Hook points for the sequential prototype

- **Completion signals** (replace the chip-only signal with an event/callback):
  - Study 1: end of `setTimeout` in `drop()` (~line 360-365), where `next.dataset.open='true'`.
  - Study 2: `drop()` (~line 461-465).
  - Study 3: `impact()` (~line 570-578).
- **Unlock inputs** (replace the checkbox):
  - Study 2: `prev.addEventListener('change', ...)` calls `unlock()` / `lock()` (~line 499-502).
  - Study 3: same pattern (~line 621-624).
- **Reset:** each study's `resetAll`/`reset` already returns to its locked or initial state; a sequence-level reset should call all three and uncheck the checkboxes.

## 8. Behavior Controls (Study 1: Fit)

A collapsible **Behavior Controls** panel under the Study 1 stage tunes the study's real parameters live. Defaults are the original study values, except follow lag (now 0ms) and snap / return duration (now 800ms).

| Control | Parameter it drives | Unit, range | Default |
|---|---|---|---|
| Follow lag (duration) | `LAG`, smoothing time constant in `frame()` | ms, 0-300 | 0 (originally 70) |
| Snap / return duration | `--snap-ms`, `#tire.anim` transition | ms, 100-1000 | 800 (originally 350) |
| Lock-in delay | `SEAT_DELAY`, the `setTimeout` in `drop()` | ms, 0-1000 | 260 |
| Pull zone radius (distance) | `PULL` | px, 40-200 | 95 |
| Seat bounce (amplitude) | `--seat-amp`, `@keyframes seat` | px, 0-30 | 10 |
| Drop threshold (trigger) | `DROP` (always kept at least 5px below `PULL`) | px, 10-90 | 40 |
| Feedback intensity | `--halo-near`, `--halo-ready`, `--halo-fill` | %, 0-100 | 100 |
| Motion curve | `--snap-ease`: Linear, Ease In, Ease Out, Ease In-Out, Spring / Bounce | - | Ease Out (`cubic-bezier(.2,.8,.2,1)`) |

- **Reset state** puts the tire back on the rack (same as the study's Reset) and keeps the current values.
- **Restore defaults** sets every control back to the original values.
- **Copy as prompt** copies the current values, each with its current default, as a ready-to-paste instruction for making them permanent.
