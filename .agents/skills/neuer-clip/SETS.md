# Set library: finished places to copy and redress

All in `src/videos/whalefull/` (the whale short, 2026-11). They use the older per-clip `./room` (no shot table in the
constructor). To reuse one: copy it to `src/videos/<name>/<place>.ts`, import from `../../lib/room` instead of `./room`,
pass the clip's table (`super(cam, PSHOTS)`, `camOf(CAMS, PSHOTS)`), replace `A()`/`beat()` with the clip's
`./shots`, delete the whale-specific stage code and write the new beats. Keep the place building code (constructor).

| Place | File | What is built | Light | Good for |
|---|---|---|---|---|
| Beach | beach.ts | sand with ripples and shells, sea with foam lines, forested headland, sea stack, dunes with grass, driftwood, barricade, rope posts, 3D whale (intact and blown up), crates, detonator with wire, TV camera on tripod, bulldozer, 3D blubber chunks, opaque inked dust column, dusk sky | warm, golden | coast, outdoor events, explosions |
| Office 1970s | office.ts | walnut panelling, cork board with road map, rain window, wall clock, filing cabinets, desk with lamp, rotary phone, mug with steam, folders, Kenney furniture, idea bulb | warm | any office, authority, "the idea" |
| Chalkboard | board.ts | big green board with a live chalk canvas that draws itself on beats, chalk tray, lamp, cork board, calendar, poster, window day/night | warm, night | explanations, "Die Sache ist die" |
| Truck road | truck.ts | sandy road between dunes, orange 1970s dump truck (cab, bed, wheels, beacon), cones, sawhorses, sand fence, telegraph poles | warm | roadside, workers, warnings |
| Dunes crest | dunes.ts | displaced dune with ~700 grass tufts, picnic camp (blanket, basket, thermos, binoculars, umbrella, scope), a 1:4 miniature beach far below, sky dome | warm, golden | crowds watching, distance shots |
| Parking lot | parking.ts | gravel lot with lines and wheel stops, 1970s station wagons, split-rail fence, signs, snack kiosk, poles with wires, a new car that gets crushed | warm | cars, crowds running, impacts |
| Kitchen | kitchen.ts | modern night kitchen, microwave with turning plate (geometry), splats on 16 surfaces, fridge with magnets, cat, pendant lamp | night | everyday analogies today |
| Newsroom | newsroom.ts | 1970s newspaper office, blinds with light stripes, sunset window, cork board, typewriter, banker lamp, 3D newspaper with a drawn front page | golden | headlines, "the next day" |

Cast and drawings: `src/videos/whale/draw.ts` (outfits THORNTON engineer, VET veteran, WOMAN, crowd(v); dynamite,
crates, car, gull, chunks, boom star, puffs, chalk diagrams, newspaper page, egg splat, sign, dozer) and
`src/videos/pigeon/toon.ts` (bodyFront/bodySide, expressions, arm poses), `src/videos/pigeon/props.ts` (Kenney furniture).
Add every new place here when a clip is finished.
