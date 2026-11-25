#!/usr/bin/env node
/* verify.cjs – kontrollerar faktatabellen och frågegeneratorn i partikel.js.
   Kör: node verify.cjs */
'use strict';
const fs = require('fs');
const path = require('path');
const P = require('./public/partikel.js');

let fel = 0;
const seddaFel = new Set();
function ok(villkor, text) {
  if (!villkor) {
    fel++;
    if (!seddaFel.has(text) && seddaFel.size < 25) { seddaFel.add(text); console.log('FEL: ' + text); }
  }
}

/* ---------- 1. Oberoende faktatabell (skriven för hand, inte läst från partikel.js) ---------- */
const SANT = {
  is: 'fast', smor: 'fast', jarn: 'fast', socker: 'fast',
  vatten: 'flytande', mjolk: 'flytande', honung: 'flytande', olja: 'flytande',
  anga: 'gas', ballong: 'gas', gasol: 'gas'
};
P.AMNEN.forEach(a => {
  ok(SANT[a.id] === a.tillstand, `ämnet ${a.id} har tillstånd ${a.tillstand}, facit säger ${SANT[a.id]}`);
  ok(typeof a.forklaring === 'string' && a.forklaring.length > 25, `ämnet ${a.id} saknar förklaring`);
  ok(typeof a.namn === 'string' && a.namn.length > 1, `ämnet ${a.id} saknar namn`);
  ok(a.forklaring.toLowerCase().indexOf(a.namn.toLowerCase()) >= 0, `förklaringen till ${a.id} nämner inte ämnet`);
});
ok(P.AMNEN.length === Object.keys(SANT).length, 'antalet ämnen stämmer inte med faktatabellen');
ok(new Set(P.AMNEN.map(a => a.id)).size === P.AMNEN.length, 'dubbla ämnes-id');
ok(new Set(P.AMNEN.map(a => a.namn.toLowerCase())).size === P.AMNEN.length, 'dubbla ämnesnamn');
P.TILLSTAND.forEach(t => {
  const n = P.AMNEN.filter(a => a.tillstand === t).length;
  ok(n >= 3, `tillståndet ${t} har bara ${n} ämnen (minst 3 behövs för nivå 2)`);
});

/* ---------- 2. Övergångarna, fysik för hand ---------- */
const SANT_OVER = {
  'fast|varm': 'flytande', 'flytande|varm': 'gas', 'gas|kall': 'flytande', 'flytande|kall': 'fast'
};
Object.keys(SANT_OVER).forEach(k => {
  ok(P.OVERGANGAR[k] && P.OVERGANGAR[k].till === SANT_OVER[k], `övergången ${k} är fel eller saknas`);
});
Object.keys(P.OVERGANGAR).forEach(k => {
  ok(k in SANT_OVER, `okänd övergång ${k}`);
  ok(typeof P.OVERGANGAR[k].forklaring === 'string' && P.OVERGANGAR[k].forklaring.length > 30,
    `övergången ${k} saknar förklaring`);
});

/* ---------- 3. Ritningarna i app.js finns ---------- */
const appjs = fs.readFileSync(path.join(__dirname, 'public', 'app.js'), 'utf8');
P.AMNEN.forEach(a => {
  ok(appjs.indexOf(`k === '${a.ritning}'`) >= 0 || appjs.indexOf(`'${a.ritning}'`) >= 0,
    `ritningen ${a.ritning} (${a.id}) finns inte i app.js`);
});

/* ---------- 4. Frågegeneratorn, 20 000 dragningar per nivå ---------- */
function slump() { return Math.random(); }
function unika(vals, nyckel) { return new Set(vals.map(nyckel)).size === vals.length; }

for (let n = 0; n < 20000; n++) {
  /* nivå 1 */
  const f1 = P.fragaL1(slump);
  ok(f1.val.length === 3, 'L1: inte tre alternativ');
  ok(unika(f1.val, v => v), 'L1: dubbla alternativ');
  ok(f1.val.filter(t => t === f1.svar).length === 1, 'L1: inte exakt ett rätt tillstånd');
  ok(f1.svar === f1.amne.tillstand, 'L1: svaret är inte ämnets tillstånd');
  ok(P.TILLSTAND.every(t => f1.val.indexOf(t) >= 0), 'L1: alla tre tillstånd ska finnas som alternativ');
  ok(f1.fraga.toLowerCase().indexOf(f1.amne.namn.toLowerCase()) >= 0, 'L1: frågan nämner inte ämnet');
  ok(typeof f1.forklaring === 'string' && f1.forklaring.length > 25, 'L1: förklaring saknas');

  /* nivå 2 */
  const f2 = P.fragaL2(slump);
  ok(f2.val.length === 3, 'L2: inte tre alternativ');
  ok(unika(f2.val, a => a.id), 'L2: dubbla ämnen bland alternativen');
  const ratt2 = f2.val.filter(a => a.tillstand === f2.modell);
  ok(ratt2.length === 1, 'L2: antalet alternativ med modellens tillstånd är ' + ratt2.length);
  ok(ratt2[0] && ratt2[0].id === f2.amne.id, 'L2: rätt ämne har inte modellens tillstånd');
  ok(f2.fraga.indexOf(f2.amne.namn) < 0, 'L2: frågan avslöjar svaret');
  ok(f2.val.filter(a => a.id === f2.amne.id).length === 1, 'L2: rätt ämne saknas bland alternativen');

  /* nivå 3 */
  const f3 = P.fragaL3(slump);
  ok(f3.val.length === 3, 'L3: inte tre alternativ');
  ok(unika(f3.val, v => v), 'L3: dubbla tillstånd');
  ok(f3.val.filter(t => t === f3.svar).length === 1, 'L3: inte exakt ett rätt tillstånd');
  ok(SANT_OVER[f3.fran + '|' + f3.riktning] === f3.svar, 'L3: svaret stämmer inte med fysiken');
  ok(f3.svar !== f3.fran, 'L3: tillståndet ändras inte');
  ok(f3.fraga.toLowerCase().indexOf(P.TILLSTAND_NAMN[f3.fran]) >= 0, 'L3: frågan nämner inte starttillståndet');
  ok(f3.fraga.indexOf(f3.riktning === 'varm' ? 'värms' : 'kyls') >= 0, 'L3: frågan saknar riktning');
}

/* ---------- 5. Hela rundor: sex frågor utan upprepning ---------- */
for (let r = 0; r < 5000; r++) {
  let anvanda = [];
  for (let i = 0; i < 6; i++) {
    const f = P.fragaL1(slump, anvanda);
    ok(anvanda.indexOf(f.amne.id) < 0, 'L1: samma ämne två gånger i en runda');
    anvanda.push(f.amne.id);
  }
  anvanda = [];
  for (let i = 0; i < 6; i++) {
    const f = P.fragaL2(slump, anvanda);
    ok(anvanda.indexOf(f.amne.id) < 0, 'L2: samma ämne två gånger i en runda');
    anvanda.push(f.amne.id);
  }
  let forra = null;
  for (let i = 0; i < 6; i++) {
    const f = P.fragaL3(slump, forra);
    ok(f.fran + '|' + f.riktning !== forra, 'L3: samma övergång två gånger i rad');
    forra = f.fran + '|' + f.riktning;
  }
}

/* ---------- 6. Alla tillstånd och övergångar nås ---------- */
const sedda = {}, seddaOver = {};
for (let n = 0; n < 4000; n++) {
  sedda[P.fragaL2(slump).modell] = true;
  const f3 = P.fragaL3(slump);
  seddaOver[f3.fran + '|' + f3.riktning] = true;
}
P.TILLSTAND.forEach(t => ok(sedda[t], 'nivå 2 visar aldrig modellen ' + t));
Object.keys(SANT_OVER).forEach(k => ok(seddaOver[k], 'nivå 3 använder aldrig övergången ' + k));

console.log(fel === 0
  ? `OK: ${P.AMNEN.length} ämnen, ${Object.keys(P.OVERGANGAR).length} övergångar, 20 000 frågor per nivå och 5 000 rundor kontrollerade – 0 fel.`
  : `${fel} fel.`);
process.exit(fel ? 1 : 0);