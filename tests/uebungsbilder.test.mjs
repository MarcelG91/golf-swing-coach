// Tests für uebungsbilder.js (Strichfiguren zu den Übungen).
//
// Anforderung: Die Figuren dürfen keine falsche Technik zeigen. Deshalb prüfen wir
// die Posen mit denselben Grenzwerten, mit denen die App deinen Schwung bewertet.
// Ausführen im Projektordner:  node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import { POSEN, HINTEN, STAB_X, UEBUNGEN_MIT_BILDERN, bildZuSchritt, poseZurZeit, zeichnung, gesamtDauer } from "../uebungsbilder.js";
import { tipp, TIPP_IDS, VARIANTEN } from "../tipps.js";

const mitte = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const winkel = (a, b, c) => {
  const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
  return Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2))) * 180 / Math.PI;
};
// Seitneigung (von vorne): positiv = Oberkörper vom Ziel weg (Ziel = rechts im Bild)
const neigung = (p) => {
  const s = mitte(p.sv, p.sh), h = mitte(p.hv, p.hh);
  return Math.atan2(h[0] - s[0], h[1] - s[1]) * 180 / Math.PI;
};
const A = POSEN.ansprechen;
const rumpf = Math.hypot(mitte(A.sv, A.sh)[0] - mitte(A.hv, A.hh)[0], mitte(A.sv, A.sh)[1] - mitte(A.hv, A.hh)[1]);

// Alle Übungen aus tipps.js einsammeln (jede Spielart jeder Kennzahl)
function alleUebungen() {
  const liste = new Map();
  const messwerte = { armeAnsprechen: [0.3, -0.4], vorneigungAnsprechen: [15, 55], seitneigungAnsprechen: [-8, 30],
    tempo: [1.8, 5], kopfhoehe: [0.2, -0.5], kopfSeitlich: [0.2, -0.1] };
  for (const id of TIPP_IDS) {
    for (const messwert of messwerte[id] || [1]) {
      const t = tipp({ id, messwert, bewertung: "verbessern" });
      if (t?.uebung) liste.set(t.uebung.name, t.uebung);
    }
  }
  return [...liste.values()];
}

test("Jede Übung hat pro Schritt einen Bild-Eintrag (Bild oder bewusst nur Text)", () => {
  const uebungen = alleUebungen();
  assert.deepEqual(uebungen.map((u) => u.name).sort(), [...UEBUNGEN_MIT_BILDERN].sort());
  for (const u of uebungen) {
    const bilder = u.schritte.map((_, i) => bildZuSchritt(u.name, i));
    assert.equal(bildZuSchritt(u.name, u.schritte.length), null, `${u.name}: mehr Bilder als Schritte`);
    assert.ok(bilder.some(Boolean), `${u.name}: gar kein Bild`);
  }
});

test("Profi-Posen erfüllen die Grenzwerte der App (keine falsche Technik)", () => {
  const T = POSEN.top, I = POSEN.treff;
  // Linker Arm im Treffmoment gestreckt (gut ab 155°)
  assert.ok(winkel(I.sv, I.ev, I.hand) >= 155, "Arm im Treffmoment");
  // Beide Arme lang bei Hüfthöhe im Durchschwung
  assert.ok(winkel(POSEN.halbDurch.sv, POSEN.halbDurch.ev, POSEN.halbDurch.hand) >= 155);
  assert.ok(winkel(POSEN.halbDurch.sh, POSEN.halbDurch.eh, POSEN.halbDurch.hand) >= 155);
  // Linker Arm am Top gestreckt (korrigiert)
  assert.ok(winkel(T.sv, T.ev, T.hand) >= 170, "Arm am Top");
  // Oberkörper im Treffmoment vom Ziel weg (gut 8–30°), am Top nicht zum Ziel (gut ab −3°)
  assert.ok(neigung(I) >= 8 && neigung(I) <= 30, `Neigung Treffmoment ${neigung(I)}`);
  assert.ok(neigung(T) >= -3, `Neigung Top ${neigung(T)}`);
  // Hüfte schiebt im Rückschwung nicht zur Seite (gut bis 15 % der Rumpflänge)
  const sway = (mitte(A.hv, A.hh)[0] - mitte(T.hv, T.hh)[0]) / rumpf;
  assert.ok(sway <= 0.15, `Sway ${sway}`);
  // Treffmoment: Hände leicht vor dem Ball, Kopf hinter dem Ball, rechte Schulter tiefer
  assert.ok(I.hand[0] >= 100 && I.kopf[0] < 100);
  assert.ok(I.sh[1] > I.sv[1]);
  // Hüfte im Treffmoment Richtung Ziel verschoben
  assert.ok(mitte(I.hv, I.hh)[0] > mitte(A.hv, A.hh)[0]);
});

test("Ansprechhaltung von hinten erfüllt die Grenzwerte (Vorneigung, Arme)", () => {
  const p = HINTEN.ansprechen;
  const l = Math.hypot(p.schulter[0] - p.huefte[0], p.schulter[1] - p.huefte[1]);
  const vorneigung = Math.atan2(p.schulter[0] - p.huefte[0], p.huefte[1] - p.schulter[1]) * 180 / Math.PI;
  assert.ok(vorneigung >= 25 && vorneigung <= 45, `Vorneigung ${vorneigung}`);
  const arme = (p.hand[0] - p.schulter[0]) / l;
  assert.ok(arme >= -0.25 && arme <= 0.15, `Arme ${arme}`);
});

test("Schläger dreht sich nie sprunghaft – im Abschwung kommt er hinter dem Körper herunter", () => {
  for (const name of UEBUNGEN_MIT_BILDERN) {
    for (let i = 0; ; i++) {
      const bild = bildZuSchritt(name, i);
      if (bild === undefined || (bild === null && i > 5)) break;
      if (!bild || bild.ansicht !== "vorne") continue;
      const w = bild.folge.map((f) => (typeof f.pose === "string" ? POSEN[f.pose] : f.pose).w);
      bild.folge.forEach((f, j) => {
        if (j === 0 || !f.dauer) return; // dauer 0 = bewusster Sprung (Neustart)
        // Vom halben Durchschwung ins Finish wandert der Schläger wirklich ca. 200° (hoch und
        // hinter den Kopf). Mehr wäre ein falscher Kreisel (z. B. Finish → Ansprechen ohne Sprung).
        assert.ok(Math.abs(w[j] - w[j - 1]) <= 210, `${name} Schritt ${i + 1}: Schläger dreht ${w[j - 1]}° → ${w[j]}°`);
      });
    }
  }
  // Vom Top zum Treffmoment immer über den halben Abschwung (Schaft zeigt vom Ziel weg)
  const zeitlupe = bildZuSchritt("Treffposition in Zeitlupe", 0);
  assert.deepEqual(zeitlupe.folge.map((f) => f.pose), ["top", "abschwung", "treff"]);
  assert.equal(POSEN.abschwung.w, 180);
  // Richtung: im Rückschwung nimmt der Winkel zu, danach bis ins Finish nur noch ab
  const w = ["ansprechen", "halbRueck", "top", "abschwung", "treff", "halbDurch", "finish"].map((p) => POSEN[p].w);
  assert.ok(w[0] < w[1] && w[1] < w[2], "Rückschwung");
  for (let i = 3; i < w.length; i++) assert.ok(w[i] < w[i - 1], "Abschwung und Durchschwung");
});

test("Stab-Übung: Der Stab steht außerhalb von Fuß, Knie und Hüfte – auch am Top", () => {
  for (const name of ["ansprechen", "halbRueck", "top"]) {
    const p = POSEN[name];
    for (const punkt of [p.fh, p.kh, p.hh]) assert.ok(punkt[0] > STAB_X, `${name}: Körper am Stab`);
  }
});

test("Mitzählen: Rückschwung dauert dreimal so lange wie der Abschwung", () => {
  const bild = bildZuSchritt("Mitzählen", 1);
  const d = (pose) => bild.folge.find((f) => f.pose === pose).dauer;
  const rueck = d("halbRueck") + d("top");
  const ab = d("abschwung") + d("treff");
  assert.ok(Math.abs(rueck / ab - 3) < 0.01, `${rueck} : ${ab}`);
  assert.equal(bild.folge.find((f) => f.pose === "top").halten ?? 0, 0, "oben keine Pause");
  // Takt: "und" beim Start, "drei" genau oben, "vier" genau im Treffmoment
  const ankunft = (pose) => { let t = 0; for (const f of bild.folge) { t += f.dauer || 0; if (f.pose === pose) return t; t += f.halten || 0; } };
  assert.equal(poseZurZeit(bild, 801).text, "und");
  assert.match(poseZurZeit(bild, ankunft("top") + 1).text, /^drei/);
  assert.match(poseZurZeit(bild, ankunft("treff") + 1).text, /^vier/);
  assert.equal(poseZurZeit(bild, ankunft("treff") - 20).text.startsWith("vier"), false);
});

test("Animation: Anfang = erste Pose, nach einer Runde wieder von vorne", () => {
  const bild = bildZuSchritt("Stab-Übung", 1);
  assert.deepEqual(poseZurZeit(bild, 0).pose, POSEN.ansprechen);
  assert.deepEqual(poseZurZeit(bild, gesamtDauer(bild) + 10).pose, POSEN.ansprechen);
  // mitten im Übergang liegt die Hand zwischen den beiden Posen
  const mitteZeit = 700 + 450;
  const hand = poseZurZeit(bild, mitteZeit).pose.hand;
  assert.ok(hand[0] < POSEN.ansprechen.hand[0] && hand[0] > POSEN.halbRueck.hand[0]);
});

test("Linkshänder: Figur gespiegelt, Ausschnitt passt", () => {
  const bild = bildZuSchritt("Hüfte bis Hüfte", 2);
  const rechts = zeichnung(bild, 0, true);
  const links = zeichnung(bild, 0, false);
  rechts.elemente.forEach((el, i) => {
    if (el.von) assert.deepEqual(links.elemente[i].von, [200 - el.von[0], el.von[1]]);
  });
  assert.equal(links.ausschnitt.x, 200 - rechts.ausschnitt.x - rechts.ausschnitt.breite);
});

// Golf-App-Check: app.js zeichnet jedes Element als SVG und baut das Bild in der Animation
// ca. 30-mal pro Sekunde neu. Deshalb: nur Elementarten, die app.js kennt (sonst landet
// "undefined" im Bild), nur endliche Zahlen (NaN ergibt Fehler im Browser) und wenige
// Elemente pro Bild (schont den Akku auf dem iPhone).
test("Alle Übungsbilder: nur bekannte Elemente, endliche Zahlen, wenige Elemente pro Bild", () => {
  const ARTEN = ["linie", "kreis", "rechteck", "text"];
  const zahlen = (el) => [el.von, el.bis, el.mitte, el.bei].filter(Boolean).flat()
    .concat([el.radius, el.breite, el.x, el.y, el.hoehe].filter((z) => z !== undefined));
  for (const name of UEBUNGEN_MIT_BILDERN) {
    for (let schritt = 0; schritt < 10; schritt++) { // keine Übung hat mehr als 10 Schritte
      const bild = bildZuSchritt(name, schritt);
      if (!bild) continue;
      const dauer = gesamtDauer(bild) || 1;
      for (const ms of [0, dauer * 0.25, dauer * 0.5, dauer * 0.75]) {
        for (const rechtshaender of [true, false]) {
          const { ausschnitt, elemente } = zeichnung(bild, ms, rechtshaender);
          assert.ok(Object.values(ausschnitt).every(Number.isFinite), `${name} ${schritt}: Ausschnitt`);
          assert.ok(elemente.length <= 40, `${name} ${schritt}: ${elemente.length} Elemente`);
          for (const el of elemente) {
            assert.ok(ARTEN.includes(el.art), `${name} ${schritt}: unbekannte Art ${el.art}`);
            assert.ok(zahlen(el).every(Number.isFinite), `${name} ${schritt}: keine Zahl in ${el.art}`);
          }
        }
      }
    }
  }
});
