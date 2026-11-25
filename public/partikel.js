/* Partikelverkstaden – data och frågegenerator. Kemi åk 4–6, Lgr22 KE.4-6.1.1.
   Samma fil används av appen (webbläsare) och av verify.cjs (node). */
(function (root) {
  'use strict';

  var TILLSTAND = ['fast', 'flytande', 'gas'];

  var TILLSTAND_NAMN = {
    fast: 'fast form',
    flytande: 'flytande form',
    gas: 'gasform'
  };

  var MODELL_TEXT = {
    fast: 'Partiklarna sitter på fasta platser och vibrerar lite.',
    flytande: 'Partiklarna ligger nära varandra men glider omkring.',
    gas: 'Partiklarna far omkring och fyller hela utrymmet.'
  };

  /* Riktiga ämnen. tillstand = det tillstånd ämnet har i rumstemperatur (ånga: i luften). */
  var AMNEN = [
    { id: 'is', namn: 'Is', tillstand: 'fast', ritning: 'is',
      forklaring: 'Is är vatten i fast form. Partiklarna sitter på fasta platser och vibrerar lite.' },
    { id: 'smor', namn: 'Smör', tillstand: 'fast', ritning: 'smor',
      forklaring: 'Smör i kylen är fast. Partiklarna sitter stilla på sina platser, även om smöret är mjukt.' },
    { id: 'jarn', namn: 'Järnspik', tillstand: 'fast', ritning: 'jarn',
      forklaring: 'Järnspiken är fast. Partiklarna sitter tätt på fasta platser – därför håller spiken sin form.' },
    { id: 'socker', namn: 'Sockerbit', tillstand: 'fast', ritning: 'socker',
      forklaring: 'Sockerbiten är fast. Partiklarna sitter ordnade på platser och biten behåller sin form.' },

    { id: 'vatten', namn: 'Vatten', tillstand: 'flytande', ritning: 'vatten',
      forklaring: 'Vatten är flytande. Partiklarna ligger nära varandra men glider omkring, så vattnet rinner.' },
    { id: 'mjolk', namn: 'Mjölk', tillstand: 'flytande', ritning: 'mjolk',
      forklaring: 'Mjölk är flytande. Partiklarna ligger tätt men kan glida, så mjölken rinner ur glaset.' },
    { id: 'honung', namn: 'Honung', tillstand: 'flytande', ritning: 'honung',
      forklaring: 'Honung är flytande men trög. Partiklarna ligger tätt och glider långsamt – därför rinner honung sakta.' },
    { id: 'olja', namn: 'Olja', tillstand: 'flytande', ritning: 'olja',
      forklaring: 'Olja är flytande. Partiklarna ligger nära varandra och glider, så oljan kan hällas.' },

    { id: 'anga', namn: 'Ånga', tillstand: 'gas', ritning: 'anga',
      forklaring: 'Ånga är vatten i gasform. Partiklarna far omkring och fyller hela luften ovanför grytan.' },
    { id: 'ballong', namn: 'Ballong', tillstand: 'gas', ritning: 'ballong',
      forklaring: 'Ballongen är fylld av luft, som är gas. Partiklarna far omkring och trycker på ballongens insida.' },
    { id: 'gasol', namn: 'Gasolflaska', tillstand: 'gas', ritning: 'gasol',
      forklaring: 'Gasolflaskan innehåller gas under tryck. Partiklarna far omkring och fyller hela flaskan.' }
  ];

  /* Övergångar: nyckel "från|varm" eller "från|kall". */
  var OVERGANGAR = {
    'fast|varm': { till: 'flytande', namn: 'smälter',
      forklaring: 'När det blir varmare vibrerar partiklarna kraftigare, lossnar från sina platser och kan glida. Då smälter ämnet och blir flytande.' },
    'flytande|varm': { till: 'gas', namn: 'kokar eller avdunstar',
      forklaring: 'Vid uppvärmning rör sig partiklarna så fort att de lämnar ytan och far ut i luften. Då blir ämnet gas.' },
    'gas|kall': { till: 'flytande', namn: 'kondenserar',
      forklaring: 'När gasen kyls saktar partiklarna in och samlas igen till droppar. Då kondenserar gasen och blir flytande.' },
    'flytande|kall': { till: 'fast', namn: 'stelnar eller fryser',
      forklaring: 'När vätskan kyls rör sig partiklarna allt långsammare och stannar på fasta platser. Då stelnar ämnet och blir fast.' }
  };

  function blandning(a, rng) {
    var b = a.slice(), i, j, t;
    for (i = b.length - 1; i > 0; i--) {
      j = Math.floor((rng || Math.random)() * (i + 1));
      t = b[i]; b[i] = b[j]; b[j] = t;
    }
    return b;
  }

  function annatTillstand(t, rng) {
    var andra = TILLSTAND.filter(function (x) { return x !== t; });
    return andra[Math.floor((rng || Math.random)() * andra.length)];
  }

  /* Nivå 1: ett ämne visas, barnet väljer rätt partikelmodell. */
  function fragaL1(rng, undvik) {
    rng = rng || Math.random;
    var kvar = AMNEN.filter(function (a) { return !undvik || undvik.indexOf(a.id) < 0; });
    if (!kvar.length) kvar = AMNEN;
    var amne = kvar[Math.floor(rng() * kvar.length)];
    return {
      typ: 'L1',
      amne: amne,
      svar: amne.tillstand,
      val: blandning(TILLSTAND, rng),
      fraga: 'Vilken partikelmodell passar till ' + amne.namn.toLowerCase() + '?',
      forklaring: amne.forklaring
    };
  }

  /* Nivå 2: en animerad modell visas, barnet väljer rätt ämne bland tre bilder. */
  function fragaL2(rng, undvik) {
    rng = rng || Math.random;
    var tillgangliga = AMNEN.filter(function (a) { return !undvik || undvik.indexOf(a.id) < 0; });
    if (!tillgangliga.length) tillgangliga = AMNEN;
    var amne = tillgangliga[Math.floor(rng() * tillgangliga.length)];
    var tillstand = amne.tillstand;
    var andra = AMNEN.filter(function (a) { return a.tillstand !== tillstand; });
    var t1 = andra[Math.floor(rng() * andra.length)];
    var t2 = andra[Math.floor(rng() * andra.length)];
    if (t2.tillstand === t1.tillstand && andra.length > 2) {
      t2 = andra.filter(function (a) { return a.tillstand !== t1.tillstand; })[0] || t2;
    }
    return {
      typ: 'L2',
      modell: tillstand,
      amne: amne,
      svar: amne.id,
      val: blandning([amne, t1, t2], rng),
      fraga: 'Vilket ämne visar modellen?',
      forklaring: amne.forklaring
    };
  }

  /* Nivå 3: en modell + en pil (värms/kyls), barnet väljer modellen som blir resultatet. */
  function fragaL3(rng, undvik) {
    rng = rng || Math.random;
    var nycklar = Object.keys(OVERGANGAR);
    if (undvik) {
      var kvar = nycklar.filter(function (k) { return k !== undvik; });
      if (kvar.length) nycklar = kvar;
    }
    var nyckel = nycklar[Math.floor(rng() * nycklar.length)];
    var delar = nyckel.split('|');
    var fran = delar[0], riktning = delar[1];
    var over = OVERGANGAR[nyckel];
    var fel = TILLSTAND.filter(function (t) { return t !== over.till; });
    return {
      typ: 'L3',
      fran: fran,
      riktning: riktning,
      svar: over.till,
      overgang: over.namn,
      val: blandning(fel.concat([over.till]), rng),
      fraga: riktning === 'varm'
        ? 'Vad blir det när ' + TILLSTAND_NAMN[fran] + ' värms?'
        : 'Vad blir det när ' + TILLSTAND_NAMN[fran] + ' kyls?',
      forklaring: over.forklaring
    };
  }

  var P = {
    TILLSTAND: TILLSTAND,
    TILLSTAND_NAMN: TILLSTAND_NAMN,
    MODELL_TEXT: MODELL_TEXT,
    AMNEN: AMNEN,
    OVERGANGAR: OVERGANGAR,
    blandning: blandning,
    fragaL1: fragaL1,
    fragaL2: fragaL2,
    fragaL3: fragaL3
  };

  root.PARTIKEL = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);