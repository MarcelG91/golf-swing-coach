# Plan: Schwünge speichern und Fortschritt messen

Stand: 27.09.2026 · Status: **Etappe 7 und 8 umgesetzt** (Version 0.9.0), Etappe 9 und 10 offen

## Ziel

1. Du und 1–2 Freunde nutzt die App jeweils **auf dem eigenen Handy**.
2. Analysierte Schwünge **bleiben gespeichert** – inklusive **gekürztem Video**.
3. Die App **misst den Fortschritt** über Wochen und gibt **langfristiges Feedback**
   („Deine Vorneigung hat sich in 4 Wochen von −18° auf −9° verbessert“).

## Entscheidungen (27.09.2026)

| Frage | Entscheidung | Folge |
|---|---|---|
| Wo werden Daten gespeichert? | **Nur auf dem jeweiligen Handy** | Kein Server, keine Kosten, keine Daten bei Dritten |
| Profile / Passwörter? | **Jeder nutzt sein eigenes Handy** | Keine Anmeldung nötig – das Handy *ist* das Profil |
| Was wird gespeichert? | **Kennzahlen, Posedaten, Schlüsselbilder + gekürztes Video** | ca. 3–6 MB pro Schwung |
| Sehen Freunde sich gegenseitig? | **Nein** | Ergibt sich automatisch – nichts verlässt das Handy |

**Freunde einladen** = Link schicken: https://marcelg91.github.io/golf-swing-coach/
→ in Safari öffnen → „Zum Home-Bildschirm“. Jeder hat damit seine eigene, private App.

**Verworfen:** Online-Dienst mit Konten (Supabase). Wäre nötig für Geräte-übergreifende
Daten oder gemeinsame Ranglisten. Kann später ergänzt werden – der Plan unten hält das offen.

### Entscheidungen zu Etappe 8 (27.09.2026, nach „mehrere Schwünge“ in 0.8.0)

| Frage | Entscheidung | Warum |
|---|---|---|
| Einzeln oder ganze Sitzung speichern? | **Jeder Schwung einzeln + „Sitzung“ als Klammer** | Fortschritt braucht jeden Schwung einzeln; einzelne Schwünge löschbar. Die Gesamtauswertung wird beim Öffnen neu berechnet, nicht gespeichert. |
| Schläger | **Einer pro Sitzung** | Einfach zu bedienen. Schlägerwechsel = getrennt analysieren und speichern. |
| Welche Schwünge? | **Häkchen-Liste**, sichere vorausgewählt | Probeschwünge und unsichere Erkennungen landen nicht aus Versehen im Fortschritt. |
| Schlüsselbilder | **1 Vorschaubild (Top) statt 4** | Die anderen Phasen stecken im Clip und lassen sich für Vorher/Nachher (Etappe 10) schnell daraus holen. |
| Clip lässt sich nicht aufnehmen | **Ohne Video speichern** (statt Originalvideo) | Ein langes Originalvideo mit mehreren Schwüngen wäre schnell mehrere hundert MB groß. |
| `formelVersion` | **`appVersion`** übernimmt die Rolle | Wird ohnehin bei jeder Änderung erhöht. Neuberechnung aus Posedaten + Phasen ist getestet (`tests/speicher.test.mjs`). |

## Architektur

```
iPhone (Safari / Home-Bildschirm-App)
┌───────────────────────────────────────────────────────────────┐
│ App-Dateien (von GitHub Pages, offline zwischengespeichert)   │
│                                                               │
│ Analyse (wie bisher)  ──▶  Speichern  ──▶  IndexedDB           │
│  MediaPipe, phasen.js,       speicher.js    ├─ Schwünge (Daten)│
│  kennzahlen.js               video-kuerzen  ├─ Schlüsselbilder │
│                                             └─ gekürzte Videos │
│ Fortschritt  ◀──────────  fortschritt.js  ◀── alle Schwünge   │
│ Sicherung  ──▶ eine Datei in „Dateien“ / iCloud Drive          │
└───────────────────────────────────────────────────────────────┘
```

### Bausteine und warum

| Baustein | Wofür | Warum dieser |
|---|---|---|
| **IndexedDB** | Datenbank im Browser | Einziger Browser-Speicher, der große Dateien (Videos) aufnehmen kann. `localStorage` schafft nur ca. 5 MB Text. |
| **Eigenes Modul `speicher.js`** | Einfache Befehle wie `speichereSchwung()`, `ladeAlle()` | IndexedDB ist umständlich. Ein kleiner eigener Wrapper (ca. 60 Zeilen) statt einer weiteren Bibliothek – dabei lernst du, wie es funktioniert. |
| **Canvas + MediaRecorder** | Video kürzen und verkleinern | Im Browser eingebaut, auch in Safari. Spielt nur den Schwung ab (1 s vor dem Ansprechen bis 1 s nach dem Finish) und nimmt ihn in 720p neu auf. Alternative ffmpeg.wasm wäre ca. 30 MB groß und auf dem iPhone zu schwer. |
| **Web-App-Manifest + Service Worker** | App auf den Home-Bildschirm, offline nutzbar | Startet wie eine echte App, funktioniert auf der Range auch ohne Netz, und Safari löscht die Daten einer Home-Bildschirm-App nicht einfach. |
| **`navigator.storage.persist()`** | Browser bitten, die Daten dauerhaft zu behalten | Wird Home-Bildschirm-Apps in der Regel gewährt. |
| **JSZip** (von cdnjs) | Sicherung als eine ZIP-Datei | Standardformat, lässt sich in „Dateien“/iCloud ablegen und am Mac öffnen. |
| **`fortschritt.js`** | Trends, Fokus, Meilensteine | Reine Rechenlogik wie `phasen.js` → mit `node --test` prüfbar. |

### Speicherplatz

- Safari erlaubt einer Web-App bis zu **60 % des freien Speichers** des iPhones.
- Pro Schwung ca. **3–6 MB** (gekürztes 720p-Video 2–5 MB, 4 Bilder 0,25 MB, Daten 0,1 MB).
  Bei 10 GB freiem Speicher reicht das für über 1.000 Schwünge.
- Die App zeigt den belegten Speicher an und bietet an, alte Videos zu löschen,
  aber die Kennzahlen zu behalten (die reichen für den Fortschritt).

## Was pro Schwung gespeichert wird

| Daten | Größe | Wofür |
|---|---|---|
| Datum, Ansicht (frontal/hinten), **Schläger** (z. B. Eisen 7, Driver), Notiz | < 1 KB | Filtern, Vergleichbarkeit |
| Alle Kennzahlen + Bewertungen | < 1 KB | Fortschrittskurven |
| Phasen-Zeitpunkte + Posedaten | ca. 60–100 KB | Skelett über dem gespeicherten Video, spätere Neuauswertung |
| 4 Schlüsselbilder mit Skelett | ca. 250 KB | Schnelle Übersicht, Vorher/Nachher |
| Gekürztes Video (720p) | ca. 2–5 MB | Schwung erneut anschauen |

**Schläger mit erfassen ist wichtig:** Driver- und Eisenschwünge unterscheiden sich –
Fortschritt wird pro Schlägergruppe (Hölzer / Eisen / Wedges) verglichen.

## Datenmodell (IndexedDB-Datenbank `golf-swing-coach`)

*So umgesetzt in Etappe 8 (`speicher.js`):*

**Speicher `sitzungen`** (ein Eintrag pro gespeicherter Analyse)
- `id` (Speicherzeitpunkt in ms), `datum` („2026-09-27“), `schlaeger`, `notiz`, `schwungIds`, `appVersion`

**Speicher `schwuenge`** (ein Eintrag pro Schwung, ca. 10–20 KB)
- `id` (`<sitzungId>-<nummer>`), `sitzungId`, `nummer`, `datum`, `schlaeger`, `ansicht`, `sicher`, `grund`
- `kennzahlen`: vollständige Kennzahlen wie in der App (`id`, `messwert`, `bewertung`, Texte …)
- `phasen` (Zeiten ab Clip-Beginn), `bewertung`, `technik`, `seitenverhaeltnis`, `videoName`
- `appVersion` – damit alte Schwünge nach Formel-Verbesserungen neu ausgewertet werden können

**Speicher `medien`** (große Dateien getrennt, damit die Liste schnell lädt)
- Schlüssel `<id>/video` (MP4-Clip), `<id>/posedaten` (Körperpunkte im 1/30-s-Raster ab Clip-Beginn), `<id>/vorschau` (JPEG)

## Fortschritt und Langzeit-Feedback

1. **Verlauf je Kennzahl:** Diagramm über die Zeit, getrennt nach Ansicht und Schlägergruppe.
   Einzelne Schwünge als Punkte, dazu ein gleitender Mittelwert (Linie).
2. **Trend:** Mittelwert der letzten 10 Schwünge gegen die 10 davor.
   „Verbessert“ / „stabil“ / „verschlechtert“ nur, wenn der Unterschied größer ist als die
   normale Streuung – sonst „noch zu wenig Daten“.
3. **Dein Fokus:** Immer **eine** Kennzahl als Trainingsschwerpunkt – die mit dem geringsten
   Grün-Anteil in den letzten 10 Schwüngen – mit passender Übung. Ist sie in 7 von 10
   Schwüngen grün, schlägt die App den nächsten Fokus vor.
4. **Meilensteine:** z. B. „Erstmals 5 Schwünge in Folge mit gehaltener Vorneigung“.
5. **Wochenrückblick:** Anzahl Schwünge, größte Verbesserung, aktueller Fokus.
6. **Vorher/Nachher:** Ältester und neuester Schwung gleicher Ansicht nebeneinander.

Für aussagekräftige Verläufe: immer ähnlich filmen (gleiche Ansicht, Stativ auf Hüfthöhe,
ca. 3 m Abstand). Die App zeigt das als Hinweis beim Speichern.

## Umsetzung in Etappen (je ein Branch + Pull Request)

| Etappe | Branch | Inhalt | Test |
|---|---|---|---|
| – | `planung-speichern-fortschritt` | Dieses Dokument | Durchlesen 🙂 |
| 7 | `etappe-7-home-app-offline` | Manifest, App-Symbol, Service Worker (offline inkl. Pose-Modell), Speicher-Schutz anfragen | iPhone: Zum Home-Bildschirm, Flugmodus an → Analyse klappt |
| 8 | `etappe-8-schwuenge-speichern` | `speicher.js`, Video kürzen, Schlüsselbilder, „Speichern“ mit Schläger + Notiz, Liste „Meine Schwünge“, Detailansicht, Löschen, Speicheranzeige | Automatische Tests im Browser + iPhone-Test |
| 9 | `etappe-9-sicherung` | Sicherung als ZIP exportieren, wieder einspielen (Handywechsel, Mac) | Export → alles löschen → Import → alles wieder da |
| 10 | `etappe-10-fortschritt` | `fortschritt.js` mit Tests, Verlaufsdiagramme, Trend, Fokus, Meilensteine, Wochenrückblick, Vorher/Nachher | `node --test` + echte Schwünge über mehrere Tage |
| 11 | `etappe-11a-level`, `etappe-11b-coach-claude` | Tipps passend zum Level + Coach-Feedback mit Claude – eigener Plan: `docs/plan-etappe-11-level-und-coach.md` | siehe dort |

**Reihenfolge geändert (27.09.2026): 11 → 10 → 9.** Ursprünglich sollte die Sicherung (9) vor dem
Fortschritt (10) kommen, weil ein Datenverlust das größte Risiko ist. Marcel hat entschieden,
zuerst die Tipps ans Können anzupassen (11) und die Sicherung ans Ende zu stellen. Bis dahin
schützen nur Home-Bildschirm-App und Speicherschutz („Daten geschützt ✓“) vor Datenverlust.

## Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Daten weg (Safari-Daten gelöscht, Handy verloren) | App auf den Home-Bildschirm, `persist()`, regelmäßige Sicherung (App erinnert daran) |
| Daten auf Mac und iPhone getrennt | Gewollt; Übertragung per Sicherungsdatei |
| Video kürzen klappt auf einem Gerät nicht | Rückfall: Originalvideo speichern (größer) und Hinweis anzeigen |
| Speicher voll | Anzeige des Verbrauchs, alte Videos löschen, Kennzahlen behalten |
| Verläufe schwanken wegen unterschiedlicher Kameraposition | Hinweis beim Speichern, Trend erst ab 10 Schwüngen, getrennt nach Ansicht und Schläger |
| Formeln werden später verbessert | Posedaten + `formelVersion` gespeichert → Neuauswertung möglich |

## Später möglich

- Online-Konten (z. B. Supabase oder eigener Server im Dev-Labor), wenn Geräte-übergreifende
  Daten oder Vergleiche unter Freunden gewünscht sind. Das Datenmodell oben lässt sich dafür
  1 : 1 übernehmen.
