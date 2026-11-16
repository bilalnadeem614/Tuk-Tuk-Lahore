# Tuk Tuk Lahore — Plan

## Architecture
- **Vite + vanilla ES modules + Three.js.** No assets: geometry in code, textures from `<canvas>`, sound from Web Audio.
- **Coordinates:** rickshaw sits at `z = 0` facing `-z`. The world scrolls toward `+z` (toward the camera). Lanes at `x = -3.2, 0, 3.2`.
- **`models/kit.js`** — shared unit geometries, cached materials, and `bake()`: merges a model's
  meshes into one vertex-coloured mesh (plus one mesh per textured/emissive material). This is the
  main draw-call lever.
- **`game/state.js`** — state machine (`menu | playing | paused | gameover`), run stats, localStorage save.
- **`game/world.js`** — 8 recycled road chunks × 40 units; each chunk borrows two building strips
  from a pool of pre-baked strips. Sky/fog/lights driven by a time-of-day cycle.
- **`game/traffic.js`** — per-type obstacle pools, coin pool, row spawner, AABB collisions.
- **`game/landmarks.js`** — 7 lazy-built set pieces attached to a recycled chunk on a distance schedule.
- **`game/missions.js`** — roadside passenger → pickup → timed ride to the next landmark.
- **`game/audio.js`** — synth engine/horns/SFX + tabla-and-melody loop on a lookahead scheduler.
- **`game/ui.js`** — HTML/CSS overlay: HUD, menus, landmark card, speech bubble, debug overlay.
- **`game/input.js`** — keyboard + pointer swipes mapped to actions.
- **`main.js`** — renderer, camera, loop, glue.

## Build order
- M1: road + rickshaw + lane controls + camera
- M2: traffic, collisions, lives, coins, score, game over
- M3: landmarks + popups + time-of-day
- M4: passenger missions + dialogue
- M5: audio, menus, customization, localStorage
- M6: polish, mobile, performance pass, debug overlay

`npm run build` after each milestone.

## Risks
| Risk | Mitigation |
|---|---|
| Draw calls explode with box-built scenery | `bake()` everything static; pooled strips |
| Unwinnable traffic walls (moving + parked traffic aligning) | Spawner never lets row lanes ∪ moving-traffic lanes cover all 3 lanes |
| Mission timing depends on landmark arrival | Landmarks scheduled by distance; pickup reschedules the next landmark |
| Shadow maps too slow on phones | No shadow maps; blob shadow under the rickshaw |
| Autoplay policy | AudioContext created on first input; suspended on pause / hidden tab |
| Landmarks unrecognisable in low-poly | Lean on silhouette: domes, minarets, bastions, tower taper, colour |
| Urdu rendering | Noto Nastaliq Urdu web font, falls back to system Arabic-script font |
