// ===============================================================
// Schwungphasen erkennen
// Eingabe: eine Liste von Bildern { zeit (Sekunden), punkte (33 Körperpunkte) }
// Ausgabe: Zeitpunkte für Ansprechen, Top, Treffmoment, Finish + Tempo
//
// Diese Datei kennt keinen Browser und kein Video, nur Zahlen.
// Dadurch lässt sie sich einzeln testen (siehe tests/phasen.test.mjs).
// ===============================================================

// Nummern der Körperpunkte bei MediaPipe Pose
const SCHULTER_L = 11, SCHULTER_R = 12;
const HANDGELENK_L = 15, HANDGELENK_R = 16;
const HUEFTE_L = 23, HUEFTE_R = 24;

// Unter dieser Handgeschwindigkeit gelten die Hände als "ruhig".
// Einheit: Rumpflängen pro Sekunde (so ist es egal, wie groß du im Bild bist).
const RUHE_SCHWELLE = 0.4;

function mitte(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function abstand(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function median(werte) {
  const sortiert = [...werte].sort((a, b) => a - b);
  return sortiert[Math.floor(sortiert.length / 2)];
}

// Gleitender Mittelwert: glättet das "Zittern" der Pose-Erkennung
function glaetten(werte, fenster = 5) {
  const halb = Math.floor(fenster / 2);
  return werte.map((_, i) => {
    const von = Math.max(0, i - halb);
    const bis = Math.min(werte.length - 1, i + halb);
    let summe = 0;
    for (let j = von; j <= bis; j++) summe += werte[j];
    return summe / (bis - von + 1);
  });
}

// Nur Bilder, in denen eine Person erkannt wurde
export function gueltigeBilder(bilder) {
  return bilder.filter((b) => b.punkte && b.punkte.length >= 25);
}

// Wie bewegen sich die Hände? Wird von erkennePhasen und von schwuenge.js
// (mehrere Schwünge in einem Video finden) gemeinsam genutzt.
// Eingabe: nur gültige Bilder (siehe gueltigeBilder).
// seitenverhaeltnis = Videobreite / Videohöhe. MediaPipe liefert x und y jeweils von 0 bis 1,
// bei einem Hochkant-Video ist 0,1 in x aber viel weniger Strecke als 0,1 in y.
// Deshalb rechnen wir x in "Bildhöhen" um, damit Abstände in alle Richtungen vergleichbar sind.
export function handBewegung(gueltigeListe, seitenverhaeltnis = 1) {
  const gueltig = gueltigeListe.map((b) => ({
    zeit: b.zeit,
    punkte: b.punkte.map((p) => ({ x: p.x * seitenverhaeltnis, y: p.y })),
  }));
  const zeit = gueltig.map((b) => b.zeit);

  // 1. Position der Hände (Mitte beider Handgelenke) in jedem Bild
  const haende = gueltig.map((b) => mitte(b.punkte[HANDGELENK_L], b.punkte[HANDGELENK_R]));

  // 2. Maßstab: typische Rumpflänge (Schultermitte bis Hüftmitte)
  const rumpf = median(
    gueltig.map((b) =>
      abstand(
        mitte(b.punkte[SCHULTER_L], b.punkte[SCHULTER_R]),
        mitte(b.punkte[HUEFTE_L], b.punkte[HUEFTE_R])
      )
    )
  );

  // 3. Handbahn glätten. Achtung: y wächst nach UNTEN (0 = oberer Bildrand)
  const x = glaetten(haende.map((h) => h.x));
  const y = glaetten(haende.map((h) => h.y));

  // 4. Geschwindigkeit der Hände in jedem Bild (in Rumpflängen pro Sekunde)
  const tempoHaende = [];
  const tempoRunter = []; // nur die Bewegung nach unten
  for (let i = 0; i < gueltig.length; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(gueltig.length - 1, i + 1);
    const dt = zeit[b] - zeit[a] || 1;
    tempoHaende.push(Math.hypot(x[b] - x[a], y[b] - y[a]) / dt / rumpf);
    tempoRunter.push((y[b] - y[a]) / dt / rumpf);
  }
  return { zeit, haende, rumpf, y, tempoHaende, tempoRunter };
}

export function erkennePhasen(bilder, seitenverhaeltnis = 1) {
  const gueltig = gueltigeBilder(bilder);
  if (gueltig.length < 20) {
    return { fehler: "Zu wenige Bilder mit erkannter Person. Ist dein ganzer Körper im Bild?" };
  }
  // Schritte 1–4: Handbahn und Handgeschwindigkeit (siehe handBewegung oben)
  const { zeit, haende, rumpf, y, tempoHaende, tempoRunter } = handBewegung(gueltig, seitenverhaeltnis);

  // 5. Schnellster Moment im Abschwung: Hände bewegen sich am schnellsten nach unten
  let iSchnell = 0;
  for (let i = 1; i < gueltig.length; i++) {
    if (tempoRunter[i] > tempoRunter[iSchnell]) iSchnell = i;
  }

  // 6. TOP: Umkehrpunkt – vom schnellsten Abschwung-Moment rückwärts bis dahin,
  //    wo die Hände noch nicht nach unten gingen (Richtungswechsel oben → unten).
  let iTop = iSchnell;
  while (iTop > 0 && tempoRunter[iTop - 1] > 0 && zeit[iSchnell] - zeit[iTop] <= 3) iTop--;

  // 7. TREFFMOMENT: tiefster Punkt der Hände kurz nach dem schnellsten Moment.
  //    Hier nehmen wir die ungeglätteten Werte, weil das Glätten den Punkt verschieben würde.
  const yRoh = haende.map((h) => h.y);
  let iTreff = iSchnell;
  for (let i = iSchnell; i < gueltig.length && zeit[i] - zeit[iSchnell] <= 0.25; i++) {
    if (yRoh[i] > yRoh[iTreff]) iTreff = i;
  }

  // 8. ANSPRECHEN: Am Top stehen die Hände kurz fast still. Deshalb suchen wir erst den
  //    schnellsten Moment im Rückschwung (Hände gehen nach oben) und gehen von dort
  //    rückwärts, bis die Hände ruhig waren.
  let iRueckSchnell = iTop;
  for (let i = iTop; i >= 0 && zeit[iTop] - zeit[i] <= 3; i--) {
    if (tempoRunter[i] < tempoRunter[iRueckSchnell]) iRueckSchnell = i;
  }
  let iAnsprechen = iRueckSchnell;
  while (iAnsprechen > 0 && tempoHaende[iAnsprechen] >= RUHE_SCHWELLE) iAnsprechen--;
  // Der Rückschwung beginnt sehr langsam. Deshalb gehen wir noch weiter zurück,
  // solange die Hände davor noch ruhiger waren – bis zum ruhigsten Moment.
  while (iAnsprechen > 0 && tempoHaende[iAnsprechen - 1] < tempoHaende[iAnsprechen]) iAnsprechen--;

  // 9. FINISH: in den 2 Sekunden nach dem Treffmoment der Moment, in dem die Hände
  //    hoch und wieder ruhig sind. Findet sich keiner (z. B. weil du direkt danach
  //    weitergehst), nehmen wir den höchsten Punkt der Hände in diesem Zeitraum.
  let iFinish = -1;
  let iHoechster = iTreff;
  for (let i = iTreff + 1; i < gueltig.length && zeit[i] - zeit[iTreff] <= 2; i++) {
    if (y[i] < y[iHoechster]) iHoechster = i;
    const hochGenug = y[i] < y[iTreff] - 0.5 * rumpf;
    if (hochGenug && tempoHaende[i] < RUHE_SCHWELLE) {
      iFinish = i;
      break;
    }
  }
  if (iFinish === -1) iFinish = iHoechster;

  // 10. Tempo: Rückschwung-Dauer : Abschwung-Dauer (Profis liegen bei etwa 3 : 1)
  const rueckschwung = zeit[iTop] - zeit[iAnsprechen];
  const abschwung = zeit[iTreff] - zeit[iTop];

  // 11. Plausibilitätsprüfung: passen die Zeiten zu einem echten Golfschwung?
  const warnungen = [];
  if (iAnsprechen === 0 && tempoHaende[0] >= RUHE_SCHWELLE) {
    warnungen.push("Am Videoanfang bewegen sich die Hände schon. Starte die Aufnahme etwas früher.");
  }
  const tempoPlausibel =
    abschwung >= 0.1 && abschwung <= 0.8 && rueckschwung >= 0.3 && rueckschwung <= 2.5;
  if (abschwung < 0.1 || abschwung > 0.8) {
    warnungen.push("Der Abschwung wirkt ungewöhnlich. Ist es eine Zeitlupe oder ein Probeschwung ohne Schläger?");
  }
  if (rueckschwung < 0.3 || rueckschwung > 2.5) {
    warnungen.push("Der Rückschwung wirkt ungewöhnlich lang oder kurz. Die Erkennung ist evtl. unsicher.");
  }

  const phase = (i) => ({ index: i, zeit: zeit[i] });
  return {
    ansprechen: phase(iAnsprechen),
    top: phase(iTop),
    treffmoment: phase(iTreff),
    finish: phase(iFinish),
    tempo: {
      rueckschwung,
      abschwung,
      verhaeltnis: abschwung > 0 ? rueckschwung / abschwung : null,
      plausibel: tempoPlausibel,
    },
    warnungen,
  };
}
