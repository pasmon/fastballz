# Ironball

A brutal future-sport for the browser, built with Three.js. Two armoured teams of five fight over a steel ball in a smelting-pit arena: pass, throw, dive-tackle, score, and leave the floor red.

## Play

Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari). There is no build step; Three.js loads from the jsDelivr CDN, so you need an internet connection.

You can also serve the folder, for example `npx serve .` or `python3 -m http.server`, and open the printed address.

## Controls

| Key | Action |
| --- | --- |
| WASD or arrow keys | Run (you control the red player with the yellow ring) |
| Space | With the ball: pass. Without: dive tackle |
| Hold J (or K) | Charge a throw, release to fire. Aim roughly at the goal and the throw locks on |
| Shift or L | Switch to the teammate nearest the ball |
| 1 / 2 / 3 | Difficulty on the start screen: Easy, Normal, Hard |
| G | Gore on or off |
| M | Sound on or off |
| Enter | Start match / rematch |

Phones and tablets get an on-screen stick and two buttons.

## Rules (v0.1)

- Two 90-second halves, 5 v 5 (keeper, two defenders, two forwards).
- Goal: 10 points. Killing an opponent: 10 points. No fouls.
- Hard tackles and fast throws injure. Big hits can tear off limbs (a missing leg slows the player, a missing arm weakens throws). Dead players are dropped through the floor and a substitute comes on after a few seconds.

## Roadmap

See the game plan for later versions: arena toys (bumpers, score multipliers, power-ups) next, then player stats and real ragdolls, then the league and management loop.
