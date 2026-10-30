# Pin Map

Ein lokales Reisetagebuch mit React Native, Expo und TypeScript.

## Funktionen

- Reisen mit mehreren Standorten erstellen, bearbeiten und loeschen.
- Reisen suchen, filtern und auf einer Karte ansehen.
- Tagebucheintraege und Fotos den Reiseorten zuordnen.
- Fotos mit Kamera oder Galerie hinzufuegen.
- Den aktuellen Standort auf Wunsch als Vorschlag uebernehmen.
- Reisen lokal speichern; drei Beispielreisen dienen zum Ausprobieren.

## Starten

Node.js und npm werden benoetigt. Im Projektordner:

```powershell
npm.cmd ci
npm.cmd start
```

Den angezeigten QR-Code mit einer passenden Expo-Go-Version oeffnen. Fuer die Browser-Vorschau:

```powershell
npm.cmd run web
```

Falls die Verbindung ueber das lokale Netz nicht funktioniert:

```powershell
npm.cmd run start:tunnel
```

## Pruefungen

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
```

Die Unit-Tests pruefen Hilfsfunktionen fuer Datumsangaben, Validierung, Suche, Fotos und Standortzuordnung. Kamera, Berechtigungen, native Karten und gespeicherte Daten nach einem Neustart muessen zusaetzlich auf echten Geraeten geprueft werden.

## Hinweise

Die Daten werden lokal gespeichert und nicht zwischen Geraeten synchronisiert. Beim Deinstallieren koennen sie verloren gehen. Die Browser-Vorschau verwendet Browser-Speicher; die Smartphone-App verwendet SQLite. Karten und Ortsnamensuche koennen eine Internetverbindung benoetigen. Es gibt keine Hintergrundortung.

Fuer eine eigenstaendige Android-App muss die Google-Maps-Konfiguration mit einem eigenen API-Schluessel eingerichtet werden. Ein eigenstaendiger App-Build ist nicht Bestandteil dieses Projektpakets.

Die Umsetzung wurde mit KI-Unterstuetzung erstellt.

## Beispielbilder

Die vier lokal eingebundenen Beispielbilder stammen von Unsplash:

- https://images.unsplash.com/photo-1539037116277-4db20889f2d4
- https://images.unsplash.com/photo-1502602898657-3e91760cbb34
- https://images.unsplash.com/photo-1486406146926-c627a92ad1ab
- https://images.unsplash.com/photo-1499856871958-5b9627545d1a


## Datumsvorschlag

Neue Reisen und Tagebucheintraege starten mit dem lokalen heutigen Datum. Beim Bearbeiten bleibt das gespeicherte Datum erhalten. Eintraege muessen weiterhin innerhalb des Reisezeitraums liegen.

## Lizenzhinweis zur Expo-Vorlage

The MIT License (MIT)

Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
