# Fremdcode, selbst ausgeliefert (Sicherheitsbefund C1)

Hier liegen die Dateien der Pose-Erkennung, die die App früher bei jedem ersten Start von
`cdn.jsdelivr.net` und `storage.googleapis.com` geladen hat. Seit Version 0.26.0 kommen sie
von derselben Adresse wie die App (GitHub Pages). Warum?

- **Echtheit:** Jede Datei wurde einmal sorgfältig geprüft (siehe unten) und ist seitdem mit
  ihrer SHA-256-Prüfsumme in `tests/vendor.test.mjs` festgeschrieben. Ändert sich auch nur ein
  Byte, schlägt der Test an – lokal und in der automatischen Prüfung beim Pull Request.
- **Weniger Mitwisser:** jsDelivr und Google sehen nicht mehr, wann die App geöffnet wird (V4).
- **Strenge Hausordnung möglich:** Die CSP in `index.html` erlaubt nur noch eigene Dateien (C3).

## Regeln

- Dateien in `vendor/` **nie von Hand ändern**. Eine neue Version kommt in einen **neuen Ordner**
  (z. B. `mediapipe-1.0.1/`). Der Service Worker speichert diese Dateien dauerhaft und fragt nicht
  nach Updates – ein neuer Ordnername ist deshalb der einzige Weg, wie eine neue Version ankommt.
- Jede Datei hier muss in `tests/vendor.test.mjs` stehen (auch die Lizenz). Nur diese README ist ausgenommen.
- Update auf MediaPipe 1.x ist Befund C4 und kommt in einen eigenen Branch.

## Woher die Dateien stammen (geprüft am 01.10.2026)

| Datei | Quelle | Prüfung |
|---|---|---|
| `mediapipe-0.10.14/vision_bundle.mjs` | npm-Paket `@mediapipe/tasks-vision@0.10.14` | siehe unten |
| `mediapipe-0.10.14/wasm/vision_wasm_internal.js` | dasselbe Paket | siehe unten |
| `mediapipe-0.10.14/wasm/vision_wasm_internal.wasm` | dasselbe Paket | siehe unten |
| `mediapipe-0.10.14/LICENSE` | Lizenztext aus dem MediaPipe-Repository, Tag `v0.10.14` | Apache 2.0 |
| `pose-landmarker-full-float16-v1/pose_landmarker_full.task` | `storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/` | MD5 laut Google-Speicher (`x-goog-hash`) stimmt |

**npm-Paket:** Das Paketarchiv (`tasks-vision-0.10.14.tgz`) stimmt mit der Prüfsumme der
npm-Registry überein (`sha512-vOifgZhk…a5e3Q==`), und die digitale Signatur der Registry über
Name, Version und Prüfsumme ist gültig. Die drei Dateien sind unverändert aus dem Archiv kopiert.
Zum Vergleich: Die Dateien, die die App bis 0.25.0 von jsDelivr geladen hat, sind bitgleich
(jsDelivr setzt vor das Modul nur einen Kommentar).

Nicht übernommen: die Variante ohne SIMD (`vision_wasm_nosimd_internal.*`, nur für sehr alte
Browser; Safari kann SIMD ab iOS 16.4), die CommonJS-Fassung und die Source-Maps.

## Lizenz

MediaPipe und das Pose-Modell stehen unter der **Apache License 2.0** (Modell: laut
„Model Card BlazePose GHUM 3D“ von Google). Der Lizenztext liegt in `mediapipe-0.10.14/LICENSE`.
Die Dateien sind unverändert weitergegeben.
