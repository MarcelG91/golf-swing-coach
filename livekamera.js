// Live-Kamera (Etappe 12a, Machbarkeitstest)
//
// Öffnet die Kamera des Geräts und rechnet für jedes neue Kamerabild das Skelett aus.
// Dabei wird gemessen, wie schnell das geht – das entscheidet, ob eine Live-Analyse
// auf dem iPhone überhaupt flüssig möglich ist.
//
// Wichtig für den Datenschutz: Das Kamerabild wird hier NUR angezeigt und ausgewertet.
// Es wird nicht gespeichert und nicht gesendet (die Speicherung kommt erst in einer
// späteren Etappe, und auch dann nur lokal).

// Kamera starten. "video" ist das <video>-Element, in dem das Live-Bild erscheint.
// Gibt eine Funktion zurück, mit der man die Kamera wieder abschaltet.
// seite: "user" = Frontkamera, "environment" = Rückkamera
export async function starteKamera(video, beiStrom = () => {}, seite = "user") {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Dieses Gerät oder dieser Browser erlaubt keinen Kamerazugriff.");
  }
  const strom = await navigator.mediaDevices.getUserMedia({
    // "ideal": Hat das Gerät die gewünschte Kamera nicht, nimmt es die andere. 1280 × 720 reicht für die Pose-Erkennung
    // und ist deutlich schneller als 4K. Kein Ton nötig.
    video: { facingMode: { ideal: seite }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
    audio: false,
  });
  video.srcObject = strom;
  // Klappt das Abspielen nicht, die Kamera sofort wieder abschalten und den Fehler weitergeben
  await video.play().catch((fehler) => {
    for (const spur of strom.getTracks()) spur.stop();
    video.srcObject = null;
    throw fehler;
  });
  beiStrom(strom); // z. B. damit aufnahme.js dieselbe Kamera aufnehmen kann
  return function stoppeKamera() {
    // Jede Spur einzeln stoppen, sonst bleibt die Kamera-Anzeige am iPhone an
    for (const spur of strom.getTracks()) spur.stop();
    video.srcObject = null;
  };
}

// Rechnet die Messwerte aus den letzten Bild-Zeiten aus (reine Rechnung, ohne Browser).
//   rechenZeiten  = so lange hat die Pose-Erkennung pro Bild gebraucht (ms)
//   bildAbstaende = so viel Zeit lag zwischen zwei verarbeiteten Bildern (ms)
export function messwerte(rechenZeiten, bildAbstaende) {
  const mittel = (liste) => (liste.length ? liste.reduce((a, b) => a + b, 0) / liste.length : 0);
  const abstand = mittel(bildAbstaende);
  return {
    msProBild: Math.round(mittel(rechenZeiten)),
    bilderProSekunde: abstand > 0 ? Math.round(10000 / abstand) / 10 : 0,
  };
}

// Schleife: Bei jedem neuen Kamerabild wird "erkenne(video)" aufgerufen (die Pose-Erkennung
// aus app.js) und danach "zeige(punkte, werte)" (Skelett zeichnen, Messwerte anzeigen).
// Gibt eine Funktion zurück, die die Schleife beendet.
export function starteSchleife(video, erkenne, zeige, fensterGroesse = 30) {
  const rechenZeiten = [];
  const bildAbstaende = [];
  let laeuft = true;
  let letzteAnkunft = null;
  let rueckruf = null;

  function naechstesBild() {
    // requestVideoFrameCallback meldet sich genau bei jedem neuen Kamerabild.
    // Ohne diese Funktion (ältere Browser) nehmen wir ersatzweise den Bildschirmtakt.
    rueckruf = "requestVideoFrameCallback" in video
      ? video.requestVideoFrameCallback(bild)
      : requestAnimationFrame(bild);
  }

  function bild() {
    if (!laeuft) return;
    const start = performance.now();
    let punkte = null;
    try {
      punkte = erkenne(video);
    } catch (fehler) {
      console.warn("Live-Erkennung:", fehler);
    }
    const ende = performance.now();

    rechenZeiten.push(ende - start);
    if (letzteAnkunft !== null) bildAbstaende.push(start - letzteAnkunft);
    letzteAnkunft = start;
    // Nur die letzten Bilder zählen, sonst bremsen alte Werte die Anzeige
    if (rechenZeiten.length > fensterGroesse) rechenZeiten.shift();
    if (bildAbstaende.length > fensterGroesse) bildAbstaende.shift();

    zeige(punkte, messwerte(rechenZeiten, bildAbstaende));
    naechstesBild();
  }

  naechstesBild();
  return function stoppeSchleife() {
    laeuft = false;
    if (rueckruf !== null) {
      if ("cancelVideoFrameCallback" in video) video.cancelVideoFrameCallback(rueckruf);
      else cancelAnimationFrame(rueckruf);
    }
  };
}
