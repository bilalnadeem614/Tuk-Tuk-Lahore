# Tuk Tuk Lahore 🛺

A 3D endless runner in the browser. Drive a decorated auto-rickshaw through Lahore: dodge
trucks, cows and potholes, collect rupee coins, carry passengers, and discover seven landmarks.

Everything is procedural — no model, texture, image or audio files. Geometry is built in code,
textures are painted on `<canvas>`, and all sound is synthesised with the Web Audio API.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build in dist/ (deploy to Vercel as a Vite project, no config needed)
npm run preview  # serve the build locally
```

Requires Node 20+.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Change lane | `←` `→` or `A` `D` | swipe left / right |
| Hop (over potholes) | `↑` `W` `Space` | swipe up |
| Horn | `H` | tap |
| Pause | `P` `Esc` | ❚❚ button |
| Mute | `M` | 🔊 button |
| Debug overlay (FPS, draw calls, objects) | `` ` `` | — |

## Features

- **3-lane endless road** built from recycled chunks; speed ramps from 36 to 92 km/h.
- **Traffic:** cars, truck-art trucks, motorbikes, a donkey cart, cows, potholes (hoppable) and
  road-work barriers. Some parked, some moving slower than you. The spawner guarantees a lane is
  always open.
- **3 lives** with an invulnerability blink, camera shake and screen flash on a hit.
- **Coins** in lines, diagonals and arcs over potholes; pitch climbs on streaks.
- **Seven landmarks** — Badshahi Mosque, Minar-e-Pakistan, Lahore Fort (Alamgiri Gate), Wazir Khan
  Mosque, Shalimar Gardens, Data Darbar, Anarkali Bazaar / Food Street — every ~45–60 s, each with
  a popup card (English + Urdu name, a historical fact) and a +500 Explorer bonus. Undiscovered
  landmarks are scheduled first; progress (X/7) is shown on the menu.
- **Passenger missions:** drive in the lane beside a waving passenger to pick them up, then reach
  the next landmark within 60 s for a Rs. 200–500 fare. 30+ Roman Urdu/English lines.
- **Street life:** shops with signboards, balconies, laundry, water tanks, tangled wires,
  streetlights, trees, chai / gol gappay / fruit vendors, bunting.
- **Day → sunset → night cycle** with matching fog, glowing windows, signs, lamps, tail lights,
  stars and a headlight pool.
- **Customization:** 4 paint jobs and 3 horns, saved along with high score, discoveries and mute.
- **Audio:** putt-putt engine that rises with speed, horns, coin / crash / jingles, and a
  tabla-and-melody background loop.
- **Responsive:** desktop, phone landscape and portrait.

Score = distance (m) + coins × 10 + fares + explorer bonuses.

## Project structure

```
index.html, style.css     UI markup and truck-art styling
src/
  main.js                 bootstrap, loop, camera, glue between systems
  game/
    state.js              state machine, run stats, tuning constants, localStorage save
    world.js              chunk ring, building-strip pool, sky / fog / time of day
    player.js             rickshaw movement, hop, tilt, blink
    traffic.js            obstacle + coin pools, row spawner, AABB collisions
    landmarks.js          7 landmark builders + distance-based schedule
    missions.js           passenger pickup, timer, fares, dialogue
    audio.js              Web Audio synth + music scheduler
    ui.js                 HUD, screens, popups (DOM)
    input.js              keyboard + pointer swipes → actions
  models/
    kit.js                shared geometries/materials, bake() draw-call merger
    textures.js           all canvas textures (road, signs, truck art, tiles, …)
    rickshaw.js car.js truck.js motorbike.js donkeyCart.js cow.js
    pothole.js barrier.js coin.js passenger.js vendors.js buildings.js
```

### How it stays fast

- `bake()` (in `models/kit.js`) merges each model into one vertex-coloured mesh plus one mesh per
  textured/emissive material. A whole 40 m block of shops is ~4 draw calls.
- Road chunks, building strips, obstacles and coins are pooled; nothing is allocated per frame.
- No shadow maps — a blob decal under the rickshaw instead. Lambert materials throughout.
- Typical frame: ~150–190 draw calls, ~60k triangles.

## Known limitations / next ideas

- Landmarks are stylised silhouettes, not accurate models; Data Darbar's dome is gold as specified
  (the real shrine's is green).
- Distant shop rows are swapped for park strips next to a landmark while still in fog; a faint
  pop can be visible in clear daylight.
- Moving traffic keeps its lane and simply queues behind whatever is ahead; no overtaking.
- Collision is one AABB per obstacle (deliberately ~12% forgiving).
- The Urdu web font (Noto Nastaliq Urdu) loads from Google Fonts; offline it falls back to the
  system Arabic-script font.
- Ideas: power-ups (magnet, shield), near-miss bonus, oncoming traffic lane, weather (monsoon,
  winter fog, Basant kites), more landmarks (Lahore Museum, Shahi Hammam, Liberty Market),
  daily challenges, a low-quality toggle for old phones.
