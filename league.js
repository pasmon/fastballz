// Ironball league (v0.4): six teams, a five-round season, squads that persist, permanent death,
// experience and level-ups, the hub between matches and the match report.
// Plain script (no modules) so the game still runs straight from the folder. Loaded before the
// match engine in index.html, which reads the shared data from window.IronLeague.
(() => {
'use strict';

// ---------------------------------------------------------------- shared data
// Old-school Finnish first names. Big enough that a whole league rarely repeats one.
const NAME_POOL = ['Jorma', 'Erkki', 'Pertti', 'Seppo', 'Kalevi', 'Raimo', 'Tauno', 'Veikko', 'Reijo', 'Pentti',
  'Arvo', 'Eino', 'Toivo', 'Urho', 'Onni', 'Väinö', 'Aarne', 'Esko', 'Martti', 'Olavi', 'Paavo', 'Rauno', 'Sulo',
  'Taisto', 'Unto', 'Viljo', 'Yrjö', 'Heikki', 'Kauko', 'Matti', 'Oiva', 'Pekka', 'Risto', 'Tapio', 'Uuno',
  'Voitto', 'Aimo', 'Hannes', 'Jaakko', 'Keijo', 'Mauno', 'Niilo', 'Reino', 'Sakari', 'Teuvo', 'Veli', 'Lauri',
  'Ensio', 'Aulis', 'Topi', 'Vilho', 'Kustaa', 'Allan', 'Leevi', 'Eero', 'Ilmari',
  'Aatu', 'Akseli', 'Alpo', 'Antero', 'Armas', 'Aukusti', 'Eemeli', 'Eljas', 'Hemmo', 'Heino', 'Iivari', 'Jalmari',
  'Juho', 'Kaarlo', 'Kosti', 'Lennart', 'Nestori', 'Oskari', 'Pauli', 'Pietari', 'Sampo', 'Tahvo', 'Taneli',
  'Valto', 'Vihtori', 'Ahti', 'Alvar', 'Arvi', 'Aleksi', 'Frans', 'Kyösti', 'Lyyti', 'Mooses', 'Paavali', 'Ragnar',
  'Sigurd', 'Uolevi', 'Valde', 'Eliel', 'Joel', 'Lauri', 'Oswald', 'Severi', 'Toivo', 'Vertti', 'Hjalmar',
].filter((n, i, a) => a.indexOf(n) === i);
const STATS = ['spd', 'pow', 'tgh', 'acc', 'agg'];
const ARCHETYPES = {
  GK: { spd: 4, pow: 6, tgh: 8, acc: 6, agg: 4, size: 1.12, label: 'KEEPER' },
  D:  { spd: 5, pow: 8, tgh: 7, acc: 4, agg: 7, size: 1.09, label: 'DEFENDER' },
  F:  { spd: 8, pow: 5, tgh: 4, acc: 7, agg: 5, size: 0.92, label: 'FORWARD' },
};
const SLOTS = ['GK', 'DL', 'DR', 'FL', 'FR'];
const SLOT_POS = { GK: 'GK', DL: 'D', DR: 'D', FL: 'F', FR: 'F' };
const LIMBS = ['armL', 'armR', 'legL', 'legR'];
const LIMB_SHORT = { armL: 'L ARM', armR: 'R ARM', legL: 'L LEG', legR: 'R LEG' };

// The six teams. `style` shifts the stats (and size) of every player the team signs.
// `css` is the colour used for the team's name in menus and the feed.
const TEAM_DEFS = [
  { name: 'CRIMSON HOUNDS', short: 'HOUNDS', color: 0xb8231a, trim: 0xffb347, visor: 0xff5a1f, css: '#e0392c', blurb: 'Your team',
    style: {} },
  { name: 'COBALT WARDENS', short: 'WARDENS', color: 0x2452c4, trim: 0xd9e4ff, visor: 0x4fd2ff, css: '#4b86ff', blurb: 'Balanced',
    style: {} },
  { name: 'RUST JACKALS', short: 'JACKALS', color: 0xc8701c, trim: 0x2b1c10, visor: 0xffe14a, css: '#f0962e', blurb: 'Small, fast, accurate',
    style: { spd: 1.2, acc: 1, pow: -1, tgh: -1, size: 0.95 } },
  { name: 'ASHEN MAULS', short: 'MAULS', color: 0x7d838b, trim: 0x25282c, visor: 0xff3a2a, css: '#b9c0c8', blurb: 'Huge, slow, hit like trucks',
    style: { spd: -1.2, pow: 2, tgh: 1, acc: -1, size: 1.07 } },
  { name: 'VENOM SAINTS', short: 'SAINTS', color: 0x2f9a35, trim: 0xd8ff6a, visor: 0xb6ff3a, css: '#6ee05a', blurb: 'Vicious, love ground and pound',
    style: { agg: 3, pow: 1, tgh: -1, acc: -0.5 } },
  { name: 'BONE SMELTERS', short: 'SMELTERS', color: 0xd2c7ab, trim: 0x5a3b22, visor: 0xff9a1a, css: '#e8dcc0', blurb: 'Tough and dirty, the champions',
    style: { spd: 0.5, pow: 1, tgh: 1, acc: 0.5, agg: 1 } },
];
const ROUNDS = 5, SQUAD_MAX = 8, SQUAD_MIN = 5;
const SAVE_KEY = 'ironball.career', SAVE_V = 1;

// ---------------------------------------------------------------- helpers
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const poisson = l => { let k = 0, p = 1; const L = Math.exp(-l); do { k++; p *= Math.random(); } while (p > L); return k - 1; };
const kg = p => Math.round(96 * p.size ** 3);
const byId = (t, id) => t.roster.find(p => p.id === id);
const xpNeed = lvl => 8 + 4 * lvl;                // level 1 -> 2 needs 12, 2 -> 3 needs 16, ...
const cap = s => s.charAt(0) + s.slice(1).toLowerCase();

function usedNames(c) { const s = new Set(); for (const t of c.teams) for (const p of t.roster) s.add(p.name); return s; }
function freshName(c) {
  const used = usedNames(c), free = NAME_POOL.filter(n => !used.has(n));
  return pick(free.length ? free : NAME_POOL);
}
// shift: extra offset on every stat (conscripts are worse, free agents a bit worse)
function genPlayer(c, pos, teamId, shift = 0) {
  const A = ARCHETYPES[pos], S = TEAM_DEFS[teamId].style;
  const base = {};
  for (const k of STATS) base[k] = clamp(Math.round(A[k] + (S[k] || 0) + shift + rand(-1.6, 1.6)), 1, 10);
  const p = {
    id: c.nextId++, name: freshName(c), pos, base,
    size: clamp(A.size * (S.size || 1) * rand(0.94, 1.06), 0.85, 1.2),
    limbs: { armL: 1, armR: 1, legL: 1, legR: 1 },
    xp: 0, lvl: 1, pts: 0, mp: 0, k: 0, g: 0, since: c.season,
  };
  return p;
}
function wounds(p) { return LIMBS.filter(k => !p.limbs[k]); }
function rating(p) {
  let r = STATS.reduce((s, k) => s + p.base[k], 0) / 5;
  for (const k of wounds(p)) r -= k.startsWith('leg') ? 1.6 : 0.8;
  return r;
}
// how well a player fits a slot: their own position counts most
function fit(p, slot) {
  const want = SLOT_POS[slot];
  let f = rating(p) + (p.pos === want ? 3 : 0);
  if (want === 'GK') f += p.pos === 'GK' ? 3 : (p.base.tgh - 5) * 0.3;
  return f;
}

// ---------------------------------------------------------------- season
function makeFixtures() {
  // circle method: team 0 stays put, the others rotate. Home side alternates each round.
  const ids = [0, ...shuffle([1, 2, 3, 4, 5])], rounds = [];
  for (let r = 0; r < ROUNDS; r++) {
    const games = [];
    for (let i = 0; i < 3; i++) {
      let a = ids[i], b = ids[5 - i];
      if ((r + i) % 2) [a, b] = [b, a];
      games.push({ home: a, away: b, done: false, score: null });
    }
    rounds.push(games);
    ids.splice(1, 0, ids.pop());
  }
  return rounds;
}
function freshTable() { return TEAM_DEFS.map((_, id) => ({ id, p: 0, w: 0, d: 0, l: 0, pf: 0, pa: 0, k: 0, pts: 0 })); }
function standings(c) {
  return c.table.slice().sort((a, b) => b.pts - a.pts || (b.pf - b.pa) - (a.pf - a.pa) || b.pf - a.pf || a.id - b.id);
}
function newCareer() {
  const c = { v: SAVE_V, season: 2189, round: 0, nextId: 1, teams: [], fixtures: null, table: null, news: [], fallen: [], done: false, champion: -1, titles: [] };
  for (let id = 0; id < TEAM_DEFS.length; id++) {
    const t = { id, roster: [], lineup: [] };
    c.teams.push(t);
    for (const pos of ['GK', 'D', 'D', 'F', 'F', 'D', 'F', Math.random() < 0.5 ? 'D' : 'F']) t.roster.push(genPlayer(c, pos, id));
    t.lineup = t.roster.slice(0, 5).map(p => p.id);
  }
  c.fixtures = makeFixtures(); c.table = freshTable();
  c.news = [{ cls: 'hd', text: `SEASON ${c.season} · SIX TEAMS · FIVE ROUNDS · NO SURVIVORS GUARANTEED` }];
  save(c);
  return c;
}
function nextSeason(c) {
  c.titles.push({ season: c.season, team: c.champion });
  c.season++; c.round = 0; c.done = false; c.champion = -1;
  c.fixtures = makeFixtures(); c.table = freshTable();
  c.news = [{ cls: 'hd', text: `SEASON ${c.season} BEGINS` }];
  save(c);
}
function fixture(c) {
  if (c.done) return null;
  const g = c.fixtures[c.round].find(f => f.home === 0 || f.away === 0);
  return { round: c.round, home: g.home, away: g.away, opp: g.home === 0 ? g.away : g.home, homeGame: g.home === 0 };
}
// Repair a lineup: drop the dead, fill the holes with the best fit from the bench. Always five slots, -1 = empty.
function fixLineup(t) {
  const ids = [];
  for (let i = 0; i < 5; i++) { const id = t.lineup[i]; ids.push(id != null && byId(t, id) && !ids.includes(id) ? id : -1); }
  for (let i = 0; i < 5; i++) {
    if (ids[i] !== -1) continue;
    const pool = t.roster.filter(p => !ids.includes(p.id));
    if (!pool.length) break;
    pool.sort((a, b) => fit(b, SLOTS[i]) - fit(a, SLOTS[i]));
    ids[i] = pool[0].id;
  }
  t.lineup = ids;
}
// AI teams pick their best five every match
function autoLineup(t) {
  const ids = [], pool = t.roster.slice();
  // keeper first, then defenders, then forwards
  for (const i of [0, 1, 2, 3, 4]) {
    if (!pool.length) { ids.push(-1); continue; }
    pool.sort((a, b) => fit(b, SLOTS[i]) - fit(a, SLOTS[i]));
    ids.push(pool.shift().id);
  }
  t.lineup = ids;
}
// What the engine needs for one team: five starters in slot order (null for an empty slot) and the bench
function squadFor(c, teamId) {
  const t = c.teams[teamId];
  if (teamId === 0) fixLineup(t); else autoLineup(t);
  const starters = SLOTS.map((_, i) => byId(t, t.lineup[i]) || null);
  const bench = t.roster.filter(p => !starters.includes(p));
  return { starters, bench };
}

// ---------------------------------------------------------------- results
function addResult(c, home, away, sh, sa, kh, ka) {
  const H = c.table[home], A = c.table[away];
  H.p++; A.p++; H.pf += sh; H.pa += sa; A.pf += sa; A.pa += sh; H.k += kh; A.k += ka;
  if (sh > sa) { H.w++; A.l++; H.pts += 3; } else if (sa > sh) { A.w++; H.l++; A.pts += 3; } else { H.d++; A.d++; H.pts++; A.pts++; }
}
function gainXp(p, n, rep) {
  p.xp += n;
  let ups = 0;
  while (p.xp >= xpNeed(p.lvl)) { p.xp -= xpNeed(p.lvl); p.lvl++; p.pts++; ups++; }
  if (ups && rep) rep.push(p);
  return ups;
}
// AI teams spend level-ups on what their position needs most
function autoSpend(p) {
  const A = ARCHETYPES[p.pos];
  while (p.pts > 0) {
    const opts = STATS.filter(k => p.base[k] < 10);
    if (!opts.length) { p.pts = 0; break; }
    opts.sort((a, b) => (A[b] - p.base[b] * 0.5) - (A[a] - p.base[a] * 0.5));
    p.base[opts[0]]++; p.pts--;
  }
}
function obit(d) {
  const by = d.killer ? `${cap(d.killer)} of the ${cap(TEAM_DEFS[d.killerTeam].short)}` : null;
  const how = {
    paste: 'turned to paste', decap: 'decapitated', dead: 'killed', ko: 'knocked out for good',
  }[d.style] || 'killed';
  const cause = {
    tackle: by ? ` by a tackle from ${by}` : '', pound: by ? `, ground and pounded by ${by}` : '',
    throw: by ? ` by a throw from ${by}` : '', wall: ' against the wall', shock: ' on a shock pad',
  }[d.how] || (by ? ` by ${by}` : '');
  return `${cap(d.name)} (${TEAM_DEFS[d.team].short}), ${how}${cause}.`;
}
function bury(c, t, p, d) {
  t.roster = t.roster.filter(q => q !== p);
  c.fallen.unshift({ name: p.name, team: t.id, lvl: p.lvl, mp: p.mp, k: p.k, season: c.season, round: c.round + 1, text: obit(d) });
  if (c.fallen.length > 80) c.fallen.length = 80;
}
// Quick simulation of a fixture the player isn't in
function simGame(c, g, news) {
  const str = id => {
    const s = squadFor(c, id).starters.filter(Boolean);
    return { s, r: s.reduce((a, p) => a + rating(p) + 0.25 * (p.lvl - 1), 0) / Math.max(1, s.length) - (5 - s.length) * 1.2 };
  };
  const H = str(g.home), A = str(g.away);
  const goals = (x, y) => poisson(clamp(1.7 + 0.45 * (x.r - y.r), 0.3, 4.5));
  const kills = (x, y) => poisson(clamp(0.55 + 0.08 * (x.s.reduce((a, p) => a + p.base.agg, 0) / Math.max(1, x.s.length) - 5) + 0.05 * (x.r - y.r), 0.1, 1.6));
  const gh = goals(H, A), ga = goals(A, H), kh = Math.min(kills(H, A), A.s.length), ka = Math.min(kills(A, H), H.s.length);
  const toys = () => 2 * poisson(1.5);
  const sh = gh * 10 + kh * 10 + toys(), sa = ga * 10 + ka * 10 + toys();
  g.done = true; g.score = [sh, sa];
  addResult(c, g.home, g.away, sh, sa, kh, ka);
  const line = { cls: 'res', text: `${TEAM_DEFS[g.home].short} ${sh} · ${sa} ${TEAM_DEFS[g.away].short}` };
  news.push(line);
  for (const p of H.s.concat(A.s)) { p.mp++; gainXp(p, 4 + Math.floor(rand(0, 4))); }
  const killSome = (n, victims, vt, kt, killers) => {
    for (let i = 0; i < n && victims.length; i++) {
      const v = victims.splice(Math.floor(Math.random() * victims.length), 1)[0];
      const kp = pick(killers); if (kp) { kp.k++; gainXp(kp, 4); }
      const d = { name: v.name, team: vt, killer: kp ? kp.name : null, killerTeam: kt, style: pick(['paste', 'decap', 'dead', 'dead']), how: pick(['tackle', 'tackle', 'pound', 'throw', 'wall', 'shock']) };
      bury(c, c.teams[vt], v, d);
      news.push({ cls: 'dead', text: obit(d) });
    }
  };
  killSome(kh, A.s.slice(), g.away, g.home, H.s);
  killSome(ka, H.s.slice(), g.home, g.away, A.s);
  // a few limbs come off too
  for (const [s, id] of [[H.s, g.home], [A.s, g.away]]) {
    const live = s.filter(p => c.teams[id].roster.includes(p));
    if (live.length && Math.random() < 0.35) {
      const p = pick(live), opts = LIMBS.filter(k => p.limbs[k]);
      if (opts.length) { const k = pick(opts); p.limbs[k] = 0; news.push({ cls: 'wound', text: `${cap(p.name)} (${TEAM_DEFS[id].short}) loses the ${LIMB_SHORT[k].toLowerCase().replace('l ', 'left ').replace('r ', 'right ')}.` }); }
    }
  }
}
// Top up squads after a round. Rivals sign free agents up to eight. The Hounds get one
// weak league conscript per round while under eight, and never drop below five.
function refill(c, news) {
  for (const t of c.teams) {
    const need = () => {
      const n = { GK: 0, D: 0, F: 0 }; for (const p of t.roster) n[p.pos]++;
      return n.GK < 1 ? 'GK' : n.D <= n.F ? 'D' : 'F';
    };
    if (t.id === 0) {
      let added = 0;
      while (t.roster.length < SQUAD_MIN || (t.roster.length < SQUAD_MAX && added < 1)) {
        const p = genPlayer(c, need(), 0, -1.2); p.conscript = true; t.roster.push(p); added++;
        news.push({ cls: 'join', text: `League conscript ${cap(p.name)} (${ARCHETYPES[p.pos].label.toLowerCase()}) reports to the Hounds.` });
      }
    } else {
      while (t.roster.length < SQUAD_MAX) t.roster.push(genPlayer(c, need(), t.id, -0.4));
      for (const p of t.roster) autoSpend(p);
    }
  }
}
// The engine reports the finished match. res = { fixture, score:[us, them] (engine slots: 0 = Hounds),
//   stats: { id: { g, k, toy } }, played: [ids], deaths: [{ id, team, killer, killerTeam, style, how }], limbs: [{ id, team, key }] }
function finishMatch(c, res) {
  const f = res.fixture, opp = f.opp, rep = { round: c.round + 1, season: c.season, opp, score: res.score.slice(), homeGame: f.homeGame, deaths: [], wounds: [], players: [], others: [], joined: [], levelUps: [] };
  const us = res.score[0], them = res.score[1];
  rep.result = us > them ? 'WIN' : us < them ? 'LOSS' : 'DRAW';
  const killsBy = [0, 0];
  for (const d of res.deaths) killsBy[d.team === 0 ? 1 : 0]++;
  const [sh, sa] = f.homeGame ? [us, them] : [them, us], [kh, ka] = f.homeGame ? killsBy : [killsBy[1], killsBy[0]];
  addResult(c, f.home, f.away, sh, sa, kh, ka);
  const g = c.fixtures[c.round].find(x => x.home === f.home && x.away === f.away); g.done = true; g.score = [sh, sa];
  const deadIds = new Set(res.deaths.map(d => d.id));
  // experience
  const lvBefore = new Map();
  for (const id of res.played) {
    for (const t of [c.teams[0], c.teams[opp]]) {
      const p = byId(t, id); if (!p) continue;
      const st = res.stats[id] || { g: 0, k: 0, toy: 0 };
      const won = (t.id === 0 && us > them) || (t.id !== 0 && them > us);
      const gain = 2 + (deadIds.has(id) ? 0 : 2) + 4 * st.g + 4 * st.k + st.toy + (won ? 2 : 0);
      p.mp++; p.g += st.g; p.k += st.k;
      lvBefore.set(id, p.lvl);
      gainXp(p, gain, t.id === 0 ? rep.levelUps : null);
      if (t.id === 0) rep.players.push({ name: p.name, pos: p.pos, xp: gain, g: st.g, k: st.k, toy: st.toy, dead: deadIds.has(id), lvl: p.lvl, up: p.lvl > lvBefore.get(id) });
    }
  }
  for (const w of res.limbs) {
    const p = byId(c.teams[w.team === 0 ? 0 : opp], w.id);
    if (p && !deadIds.has(w.id)) rep.wounds.push({ team: w.team === 0 ? 0 : opp, text: `${cap(p.name)} (${TEAM_DEFS[w.team === 0 ? 0 : opp].short}) loses the ${{ armL: 'left arm', armR: 'right arm', legL: 'left leg', legR: 'right leg' }[w.key]}.` });
  }
  const news = [{ cls: 'hd', text: `ROUND ${c.round + 1}` }];
  news.push({ cls: 'res', text: `${TEAM_DEFS[f.home].short} ${sh} · ${sa} ${TEAM_DEFS[f.away].short}` });
  for (const d of res.deaths) {
    const tid = d.team === 0 ? 0 : opp, t = c.teams[tid], p = byId(t, d.id); if (!p) continue;
    const rec = { name: p.name, team: tid, killer: d.killer, killerTeam: d.killerTeam === 0 ? 0 : opp, style: d.style, how: d.how };
    rep.deaths.push({ team: tid, text: obit(rec), lvl: p.lvl, mp: p.mp, k: p.k });
    news.push({ cls: 'dead', text: obit(rec) });
    bury(c, t, p, rec);
  }
  for (const w of rep.wounds) news.push({ cls: 'wound', text: w.text });
  // the rest of the round
  for (const og of c.fixtures[c.round]) if (!og.done) {
    const before = news.length; simGame(c, og, news);
    rep.others.push(...news.slice(before));
  }
  const beforeJoin = news.length;
  refill(c, news);
  rep.joined = news.slice(beforeJoin).map(n => n.text);
  c.round++;
  if (c.round >= ROUNDS) {
    c.done = true; c.champion = standings(c)[0].id;
    news.push({ cls: 'hd', text: `${TEAM_DEFS[c.champion].name} ARE THE CHAMPIONS OF ${c.season}` });
    rep.champion = c.champion;
  }
  c.news = news.concat(c.news).slice(0, 40);
  rep.table = standings(c).map(r => r.id);
  save(c);
  return rep;
}

// ---------------------------------------------------------------- saving
function save(c) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(c)); return true; } catch (e) { return false; } }
function load() {
  try {
    const s = localStorage.getItem(SAVE_KEY); if (!s) return null;
    const c = JSON.parse(s);
    if (!c || c.v !== SAVE_V || !Array.isArray(c.teams) || c.teams.length !== TEAM_DEFS.length) return null;
    return c;
  } catch (e) { return null; }
}
function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* storage unavailable */ } }

// ---------------------------------------------------------------- UI: hub and match report
const $ = id => document.getElementById(id);
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function teamSpan(id, text) { const s = el('span', 'tn', text || TEAM_DEFS[id].short); s.style.color = TEAM_DEFS[id].css; return s; }
const ui = { c: null, tab: 'table', sel: null, cb: { play() {}, menu() {} }, open: null };

function statBar(v, color) {
  const bar = el('span', 'bar'), fill = el('i'); fill.style.width = v * 10 + '%'; if (color) fill.style.background = color; bar.appendChild(fill); return bar;
}
function renderTable(body) {
  const c = ui.c, f = fixture(c);
  const nx = el('p', 'nextfx');
  if (f) {
    nx.append(`ROUND ${f.round + 1} OF ${ROUNDS} · `, teamSpan(0), f.homeGame ? ' vs ' : ' at ', teamSpan(f.opp, TEAM_DEFS[f.opp].name));
    const b = el('small', null, TEAM_DEFS[f.opp].blurb.toUpperCase()); nx.appendChild(b);
  } else {
    nx.append('SEASON OVER · ', teamSpan(c.champion, TEAM_DEFS[c.champion].name), ' ARE CHAMPIONS');
  }
  body.appendChild(nx);
  const wrap = el('div', 'scroll'), t = el('table', 'lg');
  const h = t.insertRow();
  for (const x of ['', 'TEAM', 'P', 'W', 'D', 'L', 'PF', 'PA', 'K', 'PTS']) h.appendChild(el('th', null, x));
  standings(c).forEach((r, i) => {
    const tr = t.insertRow(); if (r.id === 0) tr.className = 'me';
    tr.insertCell().textContent = i + 1;
    const nm = tr.insertCell(); nm.className = 'nm'; nm.appendChild(teamSpan(r.id, TEAM_DEFS[r.id].name));
    for (const k of ['p', 'w', 'd', 'l', 'pf', 'pa', 'k']) tr.insertCell().textContent = r[k];
    const pts = tr.insertCell(); pts.className = 'pts'; pts.textContent = r.pts;
  });
  wrap.appendChild(t); body.appendChild(wrap);
  body.appendChild(el('p', 'note', 'Win 3 · Draw 1 · PF/PA match points for and against · K kills'));
  const nw = el('div', 'news'); nw.appendChild(el('h3', null, 'NEWS'));
  for (const n of c.news.slice(0, 18)) nw.appendChild(el('p', n.cls, n.text));
  body.appendChild(nw);
}
function renderSquad(body) {
  const c = ui.c, t = c.teams[0];
  fixLineup(t);
  body.appendChild(el('p', 'note', 'Tap a player, then another, to swap them. Starters play the next match; the bench comes on when a starter dies. Spend level-up points with the + buttons.'));
  const wrap = el('div', 'scroll'), tb = el('table', 'sq');
  const h = tb.insertRow();
  for (const x of ['', 'PLAYER', 'LV', 'KG', 'SPD', 'POW', 'TGH', 'ACC', 'AGG', 'MP', 'K']) h.appendChild(el('th', null, x));
  const order = t.lineup.map(id => byId(t, id)).filter(Boolean).concat(t.roster.filter(p => !t.lineup.includes(p.id)));
  order.forEach(p => {
    const i = t.lineup.indexOf(p.id), tr = tb.insertRow();
    tr.className = (i >= 0 ? 'start' : 'bench') + (ui.sel === p.id ? ' sel' : '');
    tr.tabIndex = 0;
    tr.insertCell().textContent = i >= 0 ? SLOTS[i] : 'BENCH';
    const nm = tr.insertCell(); nm.className = 'nm'; nm.textContent = p.name.toUpperCase();
    const w = wounds(p);
    const sm = el('small', null, ARCHETYPES[p.pos].label + (p.conscript ? ' · CONSCRIPT' : '') + (w.length ? ' · NO ' + w.map(k => LIMB_SHORT[k]).join(', NO ') : ''));
    if (w.length) sm.classList.add('hurt');
    nm.appendChild(sm);
    const lv = tr.insertCell(); lv.textContent = p.lvl; if (p.pts) { lv.appendChild(el('b', 'pts', ` +${p.pts}`)); }
    tr.insertCell().textContent = kg(p);
    for (const k of STATS) {
      const cell = tr.insertCell(); cell.className = 'stc';
      cell.appendChild(statBar(p.base[k])); cell.appendChild(document.createTextNode(p.base[k]));
      if (p.pts > 0 && p.base[k] < 10) {
        const b = el('button', 'plus', '+'); b.type = 'button'; b.setAttribute('aria-label', `Raise ${k.toUpperCase()} of ${p.name}`);
        b.addEventListener('click', e => { e.stopPropagation(); p.base[k]++; p.pts--; save(c); render(); });
        cell.appendChild(b);
      }
    }
    tr.insertCell().textContent = p.mp;
    tr.insertCell().textContent = p.k;
    const choose = () => {
      if (ui.sel == null) ui.sel = p.id;
      else if (ui.sel === p.id) ui.sel = null;
      else { swap(t, ui.sel, p.id); ui.sel = null; save(c); }
      render();
    };
    tr.addEventListener('click', choose);
    tr.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); choose(); } });
  });
  wrap.appendChild(tb); body.appendChild(wrap);
  body.appendChild(el('p', 'note', `${t.roster.length} of ${SQUAD_MAX} players · Lost limbs never grow back · The dead stay dead`));
}
function swap(t, a, b) {
  const L = t.lineup, ia = L.indexOf(a), ib = L.indexOf(b);
  if (ia >= 0 && ib >= 0) { L[ia] = b; L[ib] = a; }
  else if (ia >= 0) L[ia] = b;
  else if (ib >= 0) L[ib] = a;
}
function renderFallen(body) {
  const c = ui.c;
  if (!c.fallen.length) { body.appendChild(el('p', 'note', 'Nobody has died yet. Give it a round.')); return; }
  const list = el('div', 'news');
  for (const d of c.fallen) {
    const p = el('p', d.team === 0 ? 'dead mine' : 'dead');
    p.appendChild(el('b', null, `${d.season} R${d.round} · `));
    p.appendChild(document.createTextNode(d.text + ` Level ${d.lvl}, ${d.mp} matches, ${d.k} kills.`));
    list.appendChild(p);
  }
  body.appendChild(list);
}
function render() {
  const c = ui.c;
  $('hubTitle').textContent = `SEASON ${c.season}`;
  $('hubSub').textContent = c.done ? 'SEASON OVER' : `ROUND ${c.round + 1} OF ${ROUNDS}`;
  document.querySelectorAll('#hubTabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === ui.tab)));
  const body = $('hubBody'); body.textContent = '';
  ({ table: renderTable, squad: renderSquad, fallen: renderFallen })[ui.tab](body);
  const pts = c.teams[0].roster.reduce((s, p) => s + p.pts, 0);
  $('hubTabs').querySelector('[data-tab="squad"]').textContent = pts ? `SQUAD +${pts}` : 'SQUAD';
  $('hubPlay').textContent = c.done ? `START SEASON ${c.season + 1}` : `PLAY ROUND ${c.round + 1}`;
}
function showHub(c, tab) {
  ui.c = c; if (tab) ui.tab = tab; ui.sel = null; ui.open = 'hub';
  $('reportView').hidden = true; $('hubView').hidden = false;
  render();
  $('hubView').scrollTop = 0; $('hubPlay').focus({ preventScroll: true });
}
function hide() { $('hubView').hidden = true; $('reportView').hidden = true; ui.open = null; }
function showReport(c, rep) {
  ui.c = c; ui.open = 'report';
  $('hubView').hidden = true; const v = $('reportView'); v.hidden = false;
  const body = $('repBody'); body.textContent = '';
  $('repTitle').textContent = rep.result === 'WIN' ? 'VICTORY' : rep.result === 'LOSS' ? 'DEFEAT' : 'DRAW';
  const sc = el('p', 'fixture'); sc.append(teamSpan(0), ` ${rep.score[0]} · ${rep.score[1]} `, teamSpan(rep.opp));
  sc.appendChild(el('small', null, `SEASON ${rep.season} · ROUND ${rep.round} OF ${ROUNDS} · ${rep.homeGame ? 'HOME' : 'AWAY'}`));
  body.appendChild(sc);
  const sec = (title, lines, cls) => {
    if (!lines.length) return;
    const d = el('div', 'news'); d.appendChild(el('h3', null, title));
    for (const l of lines) d.appendChild(typeof l === 'string' ? el('p', cls, l) : l);
    body.appendChild(d);
  };
  const mine = rep.deaths.filter(d => d.team === 0).length, theirs = rep.deaths.length - mine;
  sec(`OBITUARIES · ${theirs} OF THEIRS, ${mine} OF OURS`, rep.deaths.map(d => {
    const p = el('p', d.team === 0 ? 'dead mine' : 'dead', d.text);
    if (d.team === 0) p.appendChild(el('small', null, ` Level ${d.lvl}, ${d.mp} matches, ${d.k} kills. Gone for good.`));
    return p;
  }));
  sec('WOUNDS', rep.wounds.map(w => el('p', w.team === 0 ? 'wound mine' : 'wound', w.text)));
  const rows = rep.players.map(p => {
    const bits = [];
    if (p.g) bits.push(`${p.g} goal${p.g > 1 ? 's' : ''}`);
    if (p.k) bits.push(`${p.k} kill${p.k > 1 ? 's' : ''}`);
    if (p.toy) bits.push(`${p.toy} toy hit${p.toy > 1 ? 's' : ''}`);
    const r = el('p', p.dead ? 'dead mine' : 'res');
    r.appendChild(el('b', null, p.name.toUpperCase()));
    r.appendChild(document.createTextNode(` ${p.dead ? '· died' : `+${p.xp} XP`}${bits.length ? ' · ' + bits.join(', ') : ''}`));
    if (p.up && !p.dead) r.appendChild(el('span', 'lvup', ` LEVEL ${p.lvl}!`));
    return r;
  });
  sec('THE HOUNDS', rows);
  sec('ELSEWHERE THIS ROUND', rep.others.map(n => el('p', n.cls, n.text)));
  sec('ARRIVALS', rep.joined, 'join');
  if (rep.champion != null) {
    const ch = el('p', 'champ'); ch.append(teamSpan(rep.champion, TEAM_DEFS[rep.champion].name), ' ARE THE CHAMPIONS');
    body.appendChild(ch);
  }
  v.scrollTop = 0; $('repGo').focus({ preventScroll: true });
}
function onEnter() {
  if (ui.open === 'report') { showHub(ui.c, 'table'); return true; }
  if (ui.open === 'hub') { $('hubPlay').click(); return true; }
  return false;
}
function bind(cb) {
  ui.cb = cb;
  document.querySelectorAll('#hubTabs button').forEach(b => b.addEventListener('click', () => { ui.tab = b.dataset.tab; ui.sel = null; render(); }));
  $('hubPlay').addEventListener('click', () => {
    if (ui.open !== 'hub') return;
    if (ui.c.done) { nextSeason(ui.c); ui.tab = 'table'; render(); return; }
    hide(); ui.cb.play(ui.c);
  });
  $('hubMenu').addEventListener('click', () => { hide(); ui.cb.menu(); });
  $('repGo').addEventListener('click', () => showHub(ui.c, 'table'));
}

window.IronLeague = {
  NAME_POOL, STATS, ARCHETYPES, SLOTS, TEAM_DEFS, ROUNDS, SQUAD_MAX,
  newCareer, nextSeason, load, save, wipe, fixture, squadFor, finishMatch, standings, kg, wounds, obit,
  ui: { bind, showHub, showReport, hide, onEnter, isOpen: () => ui.open },
};
})();
