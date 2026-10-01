// Tests für wissen.js (Lernpfade, Lektionen, Quellen) und schaubilder.js (Bilder).
//
// Weil es keine Golflehrer-Durchsicht gibt, prüfen wir streng:
// 1. Texte bleiben kurz (Kernsatz, Karten, Quiz, Erklärung, Übungsschritte).
// 2. Jede Lektion hat Quellen und einen Beleg; jede Quelle steht mit Link in docs/wissen/.
// 3. Jedes genannte Bild gibt es, und es benutzt nur Farben aus style.css (hell und dunkel).
// 4. Der Fortschritt lässt sich auch aus kaputten Daten sicher lesen.
// Ausführen im Projektordner:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  PFADE, LEKTIONEN, QUELLEN, BELEGE, lektionenImPfad, pfadeFuerLevel, fortschritt,
  naechsteLektion, leseFortschritt, setzeErledigt, uebungFuer, quelleText, lektion,
  BALLFLUG_AUSWAHL, BALLFLUG_NAMEN, ballflugErgebnis,
} from "../wissen.js";
import { gibtBild, schaubild, ballflugBild, FIGUREN, SCHAUBILD_NAMEN } from "../schaubilder.js";
import { zeichnung, gesamtDauer, poseZurZeit, UEBUNGEN_MIT_BILDERN, POSEN } from "../uebungsbilder.js";
import { LEVEL_OPTIONEN, AB_LEVEL } from "../level.js";

const PROJEKT = fileURLToPath(new URL("..", import.meta.url));
const woerter = (text) => text.match(/[A-Za-zÄÖÜäöüß0-9]+/g) || [];

test("Pfad 1 „Start“ hat alle 8 Lektionen – mit festen IDs (daran hängt der gespeicherte Fortschritt)", () => {
  assert.deepEqual(lektionenImPfad("start").map((l) => l.id), [
    "start-weg", "start-schlaeger", "start-griff", "start-ausrichtung",
    "start-haltung", "start-putt", "start-chip", "start-regeln",
  ]);
});

test("Pfad 2 „Vollschwung“ und Pfad 3 „Ballflug“ haben je 7 Lektionen – mit festen IDs", () => {
  assert.deepEqual(lektionenImPfad("vollschwung").map((l) => l.id), [
    "voll-phasen", "voll-stand", "voll-rueckschwung", "voll-abschwung",
    "voll-treffmoment", "voll-finish", "voll-driver-eisen",
  ]);
  assert.deepEqual(lektionenImPfad("ballflug").map((l) => l.id), [
    "ball-gesetze", "ball-neun", "ball-treffpunkt", "ball-slice",
    "ball-fett-getoppt", "ball-shank", "ball-weitere",
  ]);
});

test("Pfade 4–6 haben je 6 Lektionen – mit festen IDs; insgesamt 40 Lektionen wie im Plan", () => {
  assert.deepEqual(lektionenImPfad("gruen").map((l) => l.id), [
    "gruen-auswahl", "gruen-chip", "gruen-pitch", "gruen-bunker", "gruen-putt-laenge", "gruen-lesen",
  ]);
  assert.deepEqual(lektionenImPfad("strategie").map((l) => l.id), [
    "platz-streuung", "platz-annaeherung", "platz-par", "platz-hang", "platz-wind", "platz-routine",
  ]);
  assert.deepEqual(lektionenImPfad("ueben").map((l) => l.id), [
    "ueben-fokus", "ueben-bilder", "ueben-verteilt", "ueben-range", "ueben-aufwaermen", "ueben-app",
  ]);
  assert.equal(PFADE.length, 6);
  assert.equal(LEKTIONEN.length, 40);
});

test("Jede Lektion hat alle Felder, eindeutige ID, bekannten Pfad und Level", () => {
  const level = LEVEL_OPTIONEN.map((o) => o.wert);
  const ids = LEKTIONEN.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length, "IDs doppelt");
  for (const pfad of PFADE) assert.ok(level.includes(pfad.level), `${pfad.id}: Level`);
  for (const l of LEKTIONEN) {
    for (const feld of ["id", "pfad", "level", "titel", "kern", "bild", "karten", "quiz", "kennzahlen", "quellen", "beleg"]) {
      assert.ok(feld in l, `${l.id}: Feld ${feld} fehlt`);
    }
    assert.ok(PFADE.some((p) => p.id === l.pfad), `${l.id}: Pfad unbekannt`);
    assert.ok(level.includes(l.level), `${l.id}: Level unbekannt`);
    assert.ok(Array.isArray(l.kennzahlen), `${l.id}: kennzahlen ist keine Liste`);
    // Für die spätere Verknüpfung Baustellen-Karte → Lektion: nur Kennzahlen, die die App kennt
    for (const k of l.kennzahlen) assert.ok(k in AB_LEVEL, `${l.id}: Kennzahl ${k} unbekannt`);
  }
});

test("Texte bleiben kurz: Kernsatz ≤ 15, Karte ≤ 35, Erklärung ≤ 25 Wörter", () => {
  for (const l of LEKTIONEN) {
    assert.ok(woerter(l.kern).length <= 15, `${l.id}: Kernsatz hat ${woerter(l.kern).length} Wörter`);
    assert.ok(l.karten.length >= 2 && l.karten.length <= 4, `${l.id}: 2–4 Inhaltskarten`);
    for (const k of l.karten) {
      assert.ok(woerter(k.text).length <= 35, `${l.id}: Karte mit ${woerter(k.text).length} Wörtern: ${k.text}`);
    }
    assert.ok(woerter(l.quiz.erklaerung).length <= 25, `${l.id}: Erklärung hat ${woerter(l.quiz.erklaerung).length} Wörter`);
  }
});

test("Quiz: eine Frage, genau 3 verschiedene Antworten, genau eine richtig", () => {
  for (const { id, quiz } of LEKTIONEN) {
    assert.ok(quiz.frage.trim().length > 0, `${id}: Frage fehlt`);
    assert.equal(quiz.antworten.length, 3, `${id}: nicht genau 3 Antworten`);
    assert.equal(new Set(quiz.antworten).size, 3, `${id}: Antworten doppelt`);
    // "richtig" ist genau EIN Index – so kann es nie zwei richtige Antworten geben
    assert.ok(Number.isInteger(quiz.richtig) && quiz.richtig >= 0 && quiz.richtig <= 2, `${id}: richtig`);
  }
});

test("Die richtige Antwort steht nicht immer an derselben Stelle", () => {
  assert.ok(new Set(LEKTIONEN.map((l) => l.quiz.richtig)).size > 1);
});

test("Jede Lektion hat Quellen und einen Beleg; jede Quelle steht mit Link in docs/wissen/", () => {
  for (const l of LEKTIONEN) {
    assert.ok(l.quellen.length >= 1, `${l.id}: keine Quelle`);
    assert.ok(l.beleg in BELEGE, `${l.id}: Beleg „${l.beleg}“ unbekannt`);
    if (l.beleg === "zwei-quellen") assert.ok(l.quellen.length >= 2, `${l.id}: zwei Quellen nötig`);
    for (const kennung of l.quellen) assert.ok(kennung in QUELLEN, `${l.id}: Quelle ${kennung} fehlt in QUELLEN`);
  }
  for (const kennung of Object.keys(QUELLEN)) {
    const [datei, kuerzel] = kennung.split(":");
    const pfad = `${PROJEKT}docs/wissen/${datei}.md`;
    assert.ok(fs.existsSync(pfad), `${kennung}: Datei docs/wissen/${datei}.md fehlt`);
    const text = fs.readFileSync(pfad, "utf8");
    const zeile = text.split("\n").find((z) => z.startsWith(`- [${kuerzel}] `));
    assert.ok(zeile, `${kennung}: steht nicht in der Quellenliste von ${datei}.md`);
    assert.match(zeile, /https:\/\//, `${kennung}: ohne Link in ${datei}.md`);
  }
});

test("Quellen erscheinen in der App nur als Text, ohne Links", () => {
  for (const name of Object.values(QUELLEN)) assert.doesNotMatch(name, /https?:|www\.|\//);  // Namen wie „GOLF.com“ sind erlaubt, Adressen nicht
  assert.equal(quelleText("grundlagen:HM1"), "HackMotion: Golf Grip 101");
});

test("Jede genannte Übung passt in den Übungsmodus", () => {
  for (const l of LEKTIONEN.filter((x) => x.uebung)) {
    const u = uebungFuer(l);
    assert.ok(u, `${l.id}: Übung nicht gefunden`);
    assert.ok(u.name && u.wiederholungen > 0, `${l.id}: Name/Wiederholungen`);
    if (l.uebung.tipp) {
      // Vorhandene Übung aus tipps.js – mit Figuren
      assert.ok(UEBUNGEN_MIT_BILDERN.includes(u.name), `${l.id}: ${u.name} hat keine Figuren`);
    } else {
      // Neue Übung nur als Text: gleiche Regeln wie in tipps.js und kein Namensvetter
      // einer Übung mit Figuren (sonst zeigte der Übungsmodus fremde Bilder)
      assert.ok(!UEBUNGEN_MIT_BILDERN.includes(u.name), `${l.id}: Name ${u.name} ist schon vergeben`);
      assert.ok(u.schritte.length >= 2 && u.schritte.length <= 4, `${l.id}: 2–4 Schritte`);
      for (const s of u.schritte) assert.ok(woerter(s).length <= 12, `${l.id}: Schritt zu lang: ${s}`);
    }
  }
  assert.equal(uebungFuer(LEKTIONEN.find((l) => l.id === "start-haltung")).name, "Schläger am Rücken");
});

test("Jedes genannte Bild existiert", () => {
  for (const l of LEKTIONEN) {
    assert.ok(gibtBild(l.bild), `${l.id}: Bild ${l.bild} fehlt`);
    for (const k of l.karten) if (k.bild) assert.ok(gibtBild(k.bild), `${l.id}: Kartenbild ${k.bild} fehlt`);
  }
  assert.equal(gibtBild("gibtEsNicht"), false);
});

// Farben der Schaubilder: jede Variable muss im dunklen und in beiden hellen Farbsätzen stehen
const CSS = fs.readFileSync(`${PROJEKT}style.css`, "utf8");
const farbsatz = (anfang) => {
  const start = CSS.indexOf(anfang);
  assert.ok(start >= 0, `Farbsatz ${anfang} fehlt in style.css`);
  return CSS.slice(start, CSS.indexOf("}", start));
};
const FARBSAETZE = [farbsatz(":root {"), farbsatz(':root:not([data-darstellung="dunkel"])'), farbsatz(':root[data-darstellung="hell"]')];

test("Schaubilder: gültige Elemente, Zahlen statt NaN, Farben aus style.css", () => {
  const arten = new Set(["linie", "kreis", "rechteck", "pfad", "text"]);
  const zahlen = (el) => [el.von, el.bis, el.mitte, el.bei, ...(el.punkte || [])].filter(Boolean).flat()
    .concat([el.x, el.y, el.breite, el.hoehe, el.radius].filter((z) => z !== undefined));
  // Alle Schaubilder plus die hervorgehobene Variante und die Bilder des Ballflug-Helfers
  const bilder = [
    ...SCHAUBILD_NAMEN.map((name) => [name, schaubild(name)]),
    ["neunFlugkurven hervorgehoben", schaubild("neunFlugkurven", { start: "links", kurve: "rechts" })],
    ...["links", "gerade", "rechts"].map((k) => [`ballflugBild rechts/${k}`, ballflugBild("rechts", k)]),
  ];
  for (const [name, bild] of bilder) {
    assert.ok(bild.ausschnitt.breite > 0 && bild.ausschnitt.hoehe > 0, `${name}: Ausschnitt`);
    assert.ok(bild.elemente.length > 0, `${name}: leer`);
    assert.ok(bild.elemente.some((el) => el.art === "text"), `${name}: ohne Beschriftung`);
    for (const el of bild.elemente) {
      assert.ok(arten.has(el.art), `${name}: Art ${el.art}`);
      for (const z of zahlen(el)) assert.ok(Number.isFinite(z), `${name}: ungültige Zahl`);
      for (const farbe of [el.farbe, el.fuellung].filter(Boolean)) {
        // Nur einfache Namen – app.js macht daraus var(--name)
        assert.match(farbe, /^[a-z-]+$/, `${name}: Farbname ${farbe}`);
        assert.ok(FARBSAETZE[0].includes(`--${farbe}:`), `${name}: --${farbe} fehlt im dunklen Farbsatz`);
        for (const satz of FARBSAETZE.slice(1)) {
          assert.ok(satz.includes(`--${farbe}:`), `${name}: --${farbe} fehlt in einem hellen Farbsatz`);
        }
      }
      if (el.art === "text") assert.ok(el.inhalt.trim().length > 0, `${name}: leerer Text`);
      // Strichstärke: bei Rechtecken eigenes Feld (breite = Breite), sonst "breite" – nie dicker als 8
      const strich = el.art === "rechteck" ? el.strich : el.breite;
      if (el.art !== "text") assert.ok(strich > 0 && strich <= 8, `${name}: Strichstärke ${strich}`);
    }
  }
});

test("Kinematische Kette: Im Treffmoment bremsen die Körperglieder, stehen aber nicht still", () => {
  // Quelle (TPI): Jedes Glied bremst nach seiner Spitze ab – Stillstand im Treffmoment wäre falsche Technik
  const kurven = schaubild("kinematischeKette").elemente.filter((el) => el.art === "pfad");
  assert.equal(kurven.length, 4, "Becken, Brust, Arme, Schläger");
  const boden = 150;
  kurven.forEach((k, i) => {
    const hoechst = Math.max(...k.punkte.map(([, y]) => boden - y));
    const imTreffen = boden - k.punkte.at(-1)[1];
    if (i < 3) assert.ok(imTreffen > 0.25 * hoechst, `Kurve ${i + 1}: im Treffmoment nur ${Math.round((imTreffen / hoechst) * 100)} %`);
    else assert.ok(imTreffen >= 0.99 * hoechst, "Der Schläger ist im Treffmoment am schnellsten");
  });
});

test("Figuren der Wissensseite stammen aus uebungsbilder.js und lassen sich zeichnen", () => {
  for (const [name, bild] of Object.entries(FIGUREN)) {
    const { elemente } = zeichnung(bild, 0, true);
    assert.ok(elemente.length > 5, `${name}: Figur leer`);
    // Von hinten nur Standbilder (Regel aus uebungsbilder.js)
    if (bild.ansicht === "hinten") assert.equal(bild.folge.length, 1, `${name}: von hinten nur ein Standbild`);
    // Von vorn nur die echten Profi-Posen – keine selbst ausgedachten Posen
    if (bild.ansicht === "vorne") {
      for (const f of bild.folge) assert.ok(typeof f.pose === "string" && f.pose in POSEN, `${name}: Pose ${f.pose} ist keine Profi-Pose`);
    }
  }
});

test("Bewegte Figuren laufen nur vorwärts (Ansprechen → … → Finish), Neuanfang nur als Sprung", () => {
  // Rückwärts animiert wäre keine echte Bewegung – das darf eine Figur nie zeigen
  const reihenfolge = ["ansprechen", "halbRueck", "top", "abschwung", "treff", "halbDurch", "finish"];
  for (const [name, bild] of Object.entries(FIGUREN)) {
    if (bild.ansicht !== "vorne" || bild.folge.length < 2) continue;
    bild.folge.forEach((f, i) => {
      if (i === 0 || !(f.dauer > 0)) return; // Sprung (dauer 0) oder erste Pose
      const vorher = bild.folge[i - 1].pose;
      assert.ok(reihenfolge.indexOf(f.pose) > reihenfolge.indexOf(vorher), `${name}: ${vorher} → ${f.pose} läuft rückwärts`);
    });
  }
});

test("Animierte Figur P1–P10: Beschriftung nur beim Anhalten in der Position, Zahlen gültig", () => {
  const bild = FIGUREN.schwungPhasen;
  // Jede Pause trägt eine P-Nummer, jeder Weg dorthin ist unbeschriftet
  for (const f of bild.folge) {
    if (f.halten) assert.match(f.text, /^P\d+ · /, `${f.pose}: Pause ohne P-Nummer`);
    else assert.equal(f.text, "", `${f.pose}: unterwegs beschriftet`);
  }
  const gesamt = gesamtDauer(bild);
  let beschriftet = 0;
  for (let ms = 0; ms < gesamt; ms += 97) {
    const { elemente, text } = zeichnung(bild, ms, true);
    if (text) beschriftet++;
    for (const el of elemente) {
      for (const z of [el.von, el.bis, el.mitte].filter(Boolean).flat()) assert.ok(Number.isFinite(z), `bei ${ms} ms: ungültige Zahl`);
    }
  }
  assert.ok(beschriftet > 0);
  // Mitten in der Pause bei P6 steht der Schaft wirklich waagerecht (Winkel 180°)
  let zeit = 0;
  for (const f of bild.folge) {
    zeit += f.dauer || 0;
    if (f.text?.startsWith("P6")) {
      const mitte = zeit + f.halten / 2;
      assert.equal(zeichnung(bild, mitte, true).text, "P6 · Schaft waagerecht");
      assert.equal(poseZurZeit(bild, mitte).pose.w, 180);
      break;
    }
    zeit += f.halten || 0;
  }
});

test("Ballflug-Helfer: jede der 9 Kombinationen hat Namen, kurze Erklärung, Bild und gültige Lektion", () => {
  const namen = new Set();
  for (const { wert: start } of BALLFLUG_AUSWAHL.start) {
    for (const { wert: kurve } of BALLFLUG_AUSWAHL.kurve) {
      const e = ballflugErgebnis(start, kurve);
      assert.ok(e, `${start}/${kurve}: kein Ergebnis`);
      namen.add(e.name);
      assert.equal(e.name, BALLFLUG_NAMEN[start][kurve], "Name wie im Schaubild");
      assert.ok(e.saetze.length >= 2, `${start}/${kurve}: Erklärung fehlt`);
      const laenge = woerter(e.saetze.join(" ")).length;
      assert.ok(laenge <= 40, `${start}/${kurve}: Erklärung hat ${laenge} Wörter`);
      if (e.lektion) assert.ok(lektion(e.lektion), `${start}/${kurve}: Lektion ${e.lektion} fehlt`);
      assert.ok(ballflugBild(start, kurve).elemente.length > 3, `${start}/${kurve}: Bild leer`);
      assert.ok(schaubild("neunFlugkurven", { start, kurve }).elemente.length > 9, "Hervorhebung klappt");
    }
  }
  assert.equal(namen.size, 9, "neun verschiedene Namen");
  // Unbekannte Werte führen nicht zum Absturz – auf beiden Seiten (Start und Kurve)
  for (const falsch of ["oben", "__proto__", "toString", "constructor"]) {
    assert.equal(ballflugErgebnis(falsch, "links"), null, `Start ${falsch}`);
    assert.equal(ballflugErgebnis("links", falsch), null, `Kurve ${falsch}`);
    assert.equal(ballflugBild(falsch, "links"), null, `Bild Start ${falsch}`);
    assert.equal(ballflugBild("links", falsch), null, `Bild Kurve ${falsch}`);
  }
  // Nur die Lektion mit Werkzeug zeigt den Helfer
  assert.deepEqual(LEKTIONEN.filter((l) => l.werkzeug).map((l) => [l.id, l.werkzeug]), [["ball-neun", "ballflugHelfer"]]);
});

test("Pfade: passender Pfad oben, Fortschritt „x von y“, nächste Lektion", () => {
  assert.equal(pfadeFuerLevel("einsteiger")[0].id, "start");
  assert.deepEqual(pfadeFuerLevel("fortgeschritten").map((p) => p.id), ["vollschwung", "ballflug", "gruen", "strategie", "start", "ueben"]);
  assert.deepEqual(pfadeFuerLevel("einsteiger").map((p) => p.id), ["start", "ueben", "vollschwung", "ballflug", "gruen", "strategie"]);
  assert.equal(pfadeFuerLevel("koenner").length, PFADE.length);
  assert.deepEqual(fortschritt("ballflug", ["ball-neun", "start-weg"]), { erledigt: 1, gesamt: 7 });
  assert.equal(naechsteLektion("voll-driver-eisen"), null, "Pfadende – kein Sprung in den nächsten Pfad");
  assert.deepEqual(fortschritt("start", ["start-weg", "start-griff", "fremd"]), { erledigt: 2, gesamt: 8 });
  assert.equal(naechsteLektion("start-weg").id, "start-schlaeger");
  assert.equal(naechsteLektion("start-regeln"), null);
  assert.equal(naechsteLektion("gibtEsNicht"), null);
});

test("Fortschritt: nur bekannte Lektions-IDs, kaputte Daten führen nicht zum Absturz", () => {
  assert.deepEqual(leseFortschritt(null), []);
  assert.deepEqual(leseFortschritt("kaputt{"), []);
  assert.deepEqual(leseFortschritt('{"a":1}'), []);
  assert.deepEqual(leseFortschritt('["start-weg", "start-weg", 5, "<img>", "start-chip"]'), ["start-weg", "start-chip"]);
  const liste = setzeErledigt(["start-weg"], "start-chip", true);
  assert.deepEqual(liste, ["start-weg", "start-chip"]);
  assert.deepEqual(setzeErledigt(liste, "start-weg", false), ["start-chip"]);
  assert.deepEqual(setzeErledigt(liste, "start-chip", true), ["start-weg", "start-chip"], "kein doppelter Eintrag");
});
