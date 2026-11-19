# Ironball

A brutal future-sport for the browser, built with Three.js. Two armoured teams of five fight over a steel ball in a smelting-pit arena: pass, throw, dive-tackle, score, and leave the floor red.

## Play

Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari). There is no build step, and Three.js r160 is bundled in `vendor/`, so it also works offline. Only the title fonts come from the web, with system fallbacks.

You can also serve the folder, for example `npx serve .` or `python3 -m http.server`, and open the printed address.

## Controls

| Key | Action |
| --- | --- |
| WASD or arrow keys | Run (you control the red player with the yellow ring) |
| Space | With the ball: pass. Without: dive tackle |
| Hold J (or K) | Charge a throw, release to fire. Aim roughly at the goal and the throw locks on |
| Shift or L | Switch to the teammate nearest the ball |
| 1 / 2 / 3 | Difficulty on the start screen: Easy, Normal, Hard |
| P or Esc | Pause (the game also pauses when you leave the tab) |
| G | Gore on or off |
| M | Sound on or off |
| Enter | Start match / rematch, then kick off from the team sheet |

Phones and tablets get an on-screen stick and two buttons.

## Rules (v0.1)

- Two 90-second halves, 5 v 5 (keeper, two defenders, two forwards).
- Goal: 10 points. Killing an opponent: 10 points. No fouls.
- Players are loud about it: battle cries on a dive, grunts on contact, an "oof" on a whiffed dive, screams on big hits, shrieks when a limb comes off, and death wails that get cut short when the head (or everything) goes. All voices are synthesised live with Web Audio, so there are no sound files, and each player has their own pitch and timbre.
- Hard tackles and fast throws injure. Big hits can tear off limbs (a missing leg slows the player, a missing arm weakens throws). Dead players are dropped through the floor and a substitute comes on after a few seconds.

## Arena toys (v0.2)

| Toy | What it does |
| --- | --- |
| Bumpers | Four steel domes. The ball rebounds faster; the throwing team gets 2 points once per throw. Bodies sliding into them take wall-slam damage. |
| Wall stars | Four on each side wall. Hit one with a thrown ball to claim it in your colour (+2). Own all four on a wall for a star sweep (+10), then they reset. |
| Warp chutes | A teal slot in the middle of each side wall. The ball comes out of the opposite wall with the same speed. |
| Shock pads | Two floor grids. They flicker as a warning, then electrocute anyone on them for about 2.5 seconds. Kills count for the other team. |
| Power-up tokens | One at a time, every 10 seconds or so. Shield (8 s, immune, tacklers bounce off), Frenzy (8 s, faster and 1.7x tackle damage), Freeze (opponents slowed and can't tackle for 3.5 s), Medkit (+50 health to your team). |

## Ragdolls (v0.3)

Knocked-down and dead players go limp and are thrown by the actual hit: the direction and force of a tackle, a throw or a wall slam decide how they tumble and where they land.

- Bodies slide on the steel, bounce off walls and bumpers, and pile up on each other. A body slammed into a wall or bumper takes slam damage from its real impact speed.
- Bumpers are sprung, so bodies come off them faster than they arrive. Bodies that slide into a warp chute come out of the opposite wall.
- Torn-off limbs and heads leave the body where it is, mid-flop, and the stumps keep bleeding. Bleeding bodies leave smears as they slide, and a pool spreads under a fresh corpse.
- Corpses stay on the pitch until they sink away: the ball bounces off them, runners kick them around and can trip over them (and drop the ball), and a hard throw can knock a limb off one.
- Ground and pound: diving onto an opponent who is already down does 30% extra damage, and the AI will do it to you. Diving onto a corpse shoves it and can tear bits off.
- Shock pads keep frying whatever lies on them, corpses included.

## Players (v0.3)

Every player has an old-school Finnish first name (Jorma, Erkki, Väinö and 53 more, drawn fresh each match), five stats from 1 to 10 and a body weight. Before each match a team sheet shows both line-ups, freshly rolled around each position's archetype, and a card in the corner shows the player you control.

| Stat | What it changes |
| --- | --- |
| SPD | Top speed and acceleration |
| POW | Throw and pass speed, tackle damage |
| TGH | Damage taken, how easily limbs come off, and the size of the stamina tank |
| ACC | Aim error on throws, passes and shots |
| AGG | How eagerly the AI dives in, including onto players who are already down |

- Keepers are big and tough, defenders are heavy hitters, forwards are light, fast and accurate.
- Weight is real: hits trade momentum by mass, so a 140 kg defender hitting a 75 kg forward does more damage and throws them much further than the other way round. Heavier players also shoulder lighter ones aside.
- Stamina: running flat out and diving drain it, easing off refills it, half time tops it up. Below about a third, a player runs and dives slower and goes down harder and for longer. It shows as the yellow bar under each health bar.
- Difficulty now lowers the Wardens' stats (most of all their speed) as well as dimming their AI.

## Roadmap

Next: the league and management loop (v0.4).
