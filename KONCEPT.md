# Partikelverkstaden – koncept

**Mål (en sak per app):** eleven ska kunna koppla ihop ett ämnes tillstånd med en enkel
partikelmodell – tätt ordnade partiklar som vibrerar (fast), partiklar nära varandra som glider
(flytande) och partiklar som far omkring och fyller utrymmet (gas) – och förstå att partiklarna är
desamma när ämnet smälter, kokar, kondenserar eller stelnar.

**Målgrupp:** kemi åk 4–6 (10–12 år). Kräver läsning av en kort fråga, men allt läses också upp.

**Kärnmekanik (touch först):** tre stora kort längst ned, ett tryck = ett svar. Ingen dragning,
inga menyer. Modellerna är animerade i canvas hela tiden, så rörelsen är beviset: i fast form
vibrerar partiklarna kring fasta platser, i vätskan driver de långsamt i botten, i gasen far de
omkring och studsar mot väggarna.

**Nivåer (6 frågor var, 18 per runda):**
1. Ett ämne visas (is, honung, ånga …) – välj rätt partikelmodell bland tre.
2. En modell visas – välj rätt ämne bland tre bilder. Här ligger lockbetena: honung är flytande
   men trög, gasol är gas under tryck, smör i kylen är fast.
3. En modell värms eller kyls – välj modellen som blir resultatet (smältning, kokning,
   kondensering, stelning). Samma övergång visas aldrig två gånger i rad.

**5-minuterssession:** 18 frågor med omedelbar förklaring, ca 4 minuter, "Nästa nivå" mellan
nivåerna och "Spela igen" på slutet.

**Belöning barnet kan berätta om:** upp till 18 stjärnor, en per fråga som klarades på första
försöket, och slutskärmen säger att partiklarna alltid är desamma – det är avståndet och rörelsen
som ändras.

**Vad barnet lär:** materiens uppbyggnad med enkla partikelmodeller; att ett ämne kan vara fast,
flytande eller gas utan att partiklarna byts ut; att värme och kyla ändrar hur partiklarna rör sig
och hur tätt de ligger.

**Lgr22:** KE.4-6.1.1 – ”Materiens uppbyggnad visualiserad med hjälp av enkla partikelmodeller.”
(ordagrant citerat på startskärmen, källa Skolverket).

**Varför det funkar på iPad:** allt ritas i kod (canvas + SVG), inga bildfiler eller CDN; tre
tryckytor på en rad som är minst 119×186 px även på en 390 px telefon; frågan står både som text
och läses upp; fel svar kostar inget och efter två försök pulserar rätt kort med förklaringen.

**Testplan (mätbar):**
- `node verify.cjs` 0 fel: 11 ämnen mot handskriven faktatabell, 4 övergångar mot fysiken,
  20 000 frågor per nivå, 5 000 hela rundor utan upprepning.
- 0 px scroll i 1024×768, 768×1024, 390×844 och 1440×900, både startskärm och spel.
- Hela rundan spelad med `Input.dispatchTouchEvent`: 18 frågor till "Alla nivåer klara!".
- Avsiktligt fel två gånger: uppgiften flyttar sig först efter andra felet, rätt kort pulserar,
  ingen stjärna delas ut, ingen förlust.
- Alla bilder och kort ligger innanför sina rutor (mätt med getBoundingClientRect i alla tre
  frågetyper på tre skärmstorlekar).