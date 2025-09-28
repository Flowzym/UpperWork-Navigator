# Förder-Navigator OÖ 2025

Eine moderne Web-Anwendung zur Navigation durch Förderprogramme in Oberösterreich mit KI-Unterstützung.

## Aktueller Implementierungsstand

### ✅ Implementiert (Prompt 1, 2, 3, 4 & 5)

**UI-Grundgerüst:**
- Sticky Topbar mit Provider-/Modus-Segmenten und Toggles
- Einklappbare Filter-Sidebar mit 8 Chip-Kategorien
- Responsive Kartenraster für Förderprogramme
- Einklappbares KI-Panel mit Kontext-Buttons und Chat-Interface
- Sticky Vergleichs-Tray (erscheint bei Auswahl)

**Steckbrief-System:**
- 6 realistische Förderprogramme mit vollständigen Datenstrukturen
- Erweiterte Programmkarten mit Status-Badges, Teaser und Infozeilen
- Detailansicht mit 8 strukturierten Sektionen
- 5-Schritte-Checkliste für jedes Programm
- 1-Pager-Vorschau zum Kopieren
- Status-Warnbanner für ausgesetzte/endende Programme

**Suche & Autovervollständigung:**
- Fehlertolerante Suche mit Fuzzy-Matching (Tippfehler, Umlaute)
- Synonym-Erkennung für Programme und Facetten
- Live-Vorschläge in 3 Kategorien (Programme, Themen, Begriffe)
- Trefferanzeige mit Lösch-Funktion
- Keine-Ergebnisse-Karte mit Tipps
- Spezial-Hinweise für entfallene Programme

**Filter als Chips:**
- 8 Facetten-Gruppen mit funktionsfähigen Chips
- OR-Logik innerhalb Gruppen, AND-Logik zwischen Gruppen
- Filter wirken zusätzlich zur Suche (Schnittmenge)
- ActiveFiltersBar zeigt gewählte Filter als entfernbare Pills
- Max. 6 Chips pro Gruppe sichtbar, „Mehr…" klappt weitere auf
- „Alle zurücksetzen" leert komplette Filterauswahl

**Programmkarten & Detail Feinschliff:**
- Konsistente Kartenhöhen mit strukturiertem Layout
- Overflow-Menüs mit Vergleichen, Chat, 1-Pager, E-Mail, Merken
- Compare-State mit Live-Counter im Tray
- Sticky Actionbar in Detailansicht
- Modals für Checkliste, 1-Pager und E-Mail-Text
- Toast-System für Feedback
- Esc-Verhalten für alle Modals

**Programmkarten & Detail Feinschliff:**
- Konsistente Kartenhöhen mit strukturiertem Layout
- Overflow-Menüs mit Vergleichen, Chat, 1-Pager, E-Mail, Merken
- Compare-State mit Live-Counter im Tray
- Sticky Actionbar in Detailansicht
- Modals für Checkliste, 1-Pager und E-Mail-Text
- Toast-System für Feedback
- Esc-Verhalten für alle Modals

**Programmkarten & Detail Feinschliff:**
- Konsistente Kartenhöhen mit strukturiertem Layout
- Overflow-Menüs mit Vergleichen, Chat, 1-Pager, E-Mail, Merken
- Compare-State mit Live-Counter im Tray
- Sticky Actionbar in Detailansicht
- Modals für Checkliste, 1-Pager und E-Mail-Text
- Toast-System für Feedback
- Esc-Verhalten für alle Modals

**Datenstruktur:**
- Erweiterte Typen: Status, Frist, FörderHöhe
- Vollständige Program-Objekte mit Zielgruppe, Förderart, Voraussetzungen
- "Passt wenn/Passt nicht wenn"-Kriterien
- Quellenangaben mit Seitenzahl und Stand

**Provider-Presets & Schalter:**
- Jeder Provider hat eigenen Stil (ChatGPT: präzise, Mistral: kompakt, Claude: ausführlich, etc.)
- "Nur Broschüre"-Schalter fügt Hinweistext zu Dummy-Antworten hinzu
- "Quellen anfügen"-Schalter fügt Quelle-Badge mit Seitenzahl hinzu
- Preset-Anzeige zeigt aktuelle Provider-Einstellungen
- Beide Schalter standardmäßig aktiviert

**Antwortformat mit Quellen & Warnungen:**
- Einheitliches Format: Header (Titel/Provider/Zeit) → Warnung → Text → Quellen → Footer
- WarningBanner bei problematischen Programmstatus (ausgesetzt/endet am)
- SourceBadge mit Broschüren-Referenz wenn "Quellen anfügen" aktiv
- Löschen-Button pro Antwort, Kopieren-Funktion
- Dummy-Warnungen in 30% der Fälle für Demo-Zwecke

**Wizard "Welche Förderung passt?":**
- 6-Schritt-Wizard mit Vollbild-Modal und Fortschrittsbalken
- Chip-Auswahl pro Schritt (Status, Ziel, Budget, Arbeitgeber, Thema, Timing)
- Navigation: Zurück/Überspringen/Weiter mit klarer Steuerung
- Automatisches Mapping zu FilterState aus Wizard-Antworten
- Ergebnisbanner mit Wizard-Kennzeichnung und Reset-Option
- Spezielle Keine-Ergebnisse-Karte für Wizard-Ergebnisse

**Profil-Matching:**
- 5 Sektionen: Kundenprofil, Hintergrund, Problemlage, Wunschperspektive, Voraussetzungen/Rahmen
- Tab-Navigation zwischen Sektionen mit Chip-Zählern
- Dummy-Scoring-Algorithmus mit 5 Kategorien (max. 100 Punkte)
- Top-3-Ergebnisse als MatchResultCards mit Score-Balken und 3 Gründen
- "Alle Ergebnisse anzeigen" filtert normale ProgramGrid nach Matches
- Eigenes Ergebnisbanner und spezielle Keine-Ergebnisse-Tipps

**Export-Funktionen (Dummy):**
- 1-Pager Export aus Detail/Checkliste/1-Pager-Ansicht
- Vergleichstabelle Export aus CompareModal
- E-Mail-Kurztext Export aus Detail/MatchResultCard
- ExportPreviewModal mit druckfreundlichem A4-Layout
- Dummy-Funktionen: nur Toasts, keine echten PDF-Generierung
- CopyButton-Komponente für Zwischenablage-Funktionen

**Leere-/Fehlerzustände & UI-Politur:**
- EmptyState-Komponente für 5 Szenarien (Suche, Wizard, Profil-Matching, Vergleich, Fehler)
- Tooltip-System mit 300ms Delay für Chips, Icons und Buttons
- Typisierte Toasts (info/success/warning/error) mit Farbkodierung
- Kontextspezifische Tipps und Aktionen in Leere-Zuständen
- Verbessertes UX-Feedback für alle Interaktionen

**Navigation & Layout-System:**
- AppShell mit NavBar, Content-Bereich und FooterBar
- Tab-Navigation: Explorer, Wizard, Profil-Matching, Hilfe
- SettingsDrawer mit Provider/Presets, Schaltern und Darstellungsoptionen
- HelpModal mit 5 Tabs: Schnellstart, Tipps, Tastenkürzel, Changelog, Kontakt
- Karten-Dichte (Komfort/Kompakt) und Kontrast-Modi (Standard/Hoch)
- "Als Startoverlay zeigen" Toggle für Hilfe-Modal
- Dezente Infozeile im Explorer mit Nutzungstipps

**Merkzettel & Verlauf:**
- Stern-Icon (☆/★) in Karten und Detail zum Merken von Programmen
- BookmarkBar zeigt max. 6 gemerkte Programme als Pills mit Status-Badges
- "Alle ansehen" Button filtert Grid auf gemerkte Programme
- Verlaufs-Panel (🕑) erfasst Aktionen: Detail, Checkliste, Vergleich, Chat, 1-Pager, E-Mail
- History gruppiert nach Tagen (Heute, Gestern, Datum)
- "Alles löschen" leert Verlauf mit Toast-Feedback
- Alles lokal, keine Persistenz über Reload

**Finalisierung v0.1:**
- ErrorBoundary fängt UI-Fehler ab und zeigt benutzerfreundliche Fehlermeldung
- Loader-Komponente für Ladevorgänge mit verschiedenen Größen
- useDummyApi Hook als zentrale API-Schnittstelle für künftige Backend-Integration
- Konsistente UI-Komponenten: Buttons, Chips, Badges, Toasts einheitlich gestaltet
- Responsive Design: Sidebar/KI-Panel werden auf mobilen Geräten als Modals angezeigt
- Verbesserte Animationen und Übergänge für flüssigere UX
- Zentrale Farbpalette und Spacing-System für konsistentes Design
- Vorbereitung für API-Anbindung ohne Breaking Changes

**Erste echte API-Integration (ChatGPT):**
- ChatGPT über OpenAI API (gpt-4o-mini) integriert
- API-Key über .env konfigurierbar (VITE_OPENAI_API_KEY)
- Provider-spezifische Logik: ChatGPT = echt, andere = Dummy
- Fehlerbehandlung für API-Calls mit Loading States
- Sichere Key-Verwaltung (.env nicht im Repo)
- Fallback zu Dummy-Antworten ohne API-Key

**Weitere API-Integrationen:**
- **Mistral:** Über OpenRouter API (mistralai/mistral-7b-instruct:free)
- **Claude:** Über Anthropic API (claude-3-haiku-20240307)
- **Lokal:** Ollama/LocalAI über OpenAI-kompatible Endpoints
- **Custom:** Frei konfigurierbare OpenAI-kompatible Endpoints

## Suchfunktion - Testbeispiele

1. **"bildungskonto"** → Findet "Bildungskonto OÖ" (Top-Treffer)
2. **"bildunskonto"** → Findet trotz Tippfehler "Bildungskonto OÖ"
3. **"QBN"** → Findet "QBN - Qualifizierungsförderung" über Synonym
4. **"deutsch b1"** → Findet Programme mit Sprachbezug über Facetten-Synonyme
5. **"weiterbildungsgeld"** → Zeigt Hinweis "Programm entfallen"

## Filter-System - Testbeispiele

1. **Status: "Aktiv"** → Zeigt nur aktive Programme
2. **Zielgruppe: "Beschäftigte" + "Arbeitsuchende"** → OR-Verknüpfung
3. **Status: "Aktiv" + Förderart: "Kurskosten"** → AND zwischen Gruppen
4. **Kombination mit Suche:** "bildung" + Filter "Budget: ≤1k" → Schnittmenge
5. **ActiveFiltersBar:** Zeigt alle aktiven Filter als entfernbare Pills

## Compare-State & Modals - Testbeispiele

1. **Vergleichen:** Klick auf ⋯ → "Vergleichen" toggelt Compare-State, Tray erscheint
2. **Compare-Tray:** Zeigt Live-Counter, "Vergleichstabelle" (kommt nächster Schritt)
3. **Overflow-Menü:** An Chat öffnet KI-Panel, 1-Pager/E-Mail öffnen Modals
4. **Modals:** Checkliste, 1-Pager, E-Mail mit Kopieren-Funktion
5. **Toast-System:** Alle Aktionen geben visuelles Feedback
6. **Esc-Verhalten:** Schließt alle Modals und Detailansicht

## Compare-State & Modals - Testbeispiele

1. **Vergleichen:** Klick auf ⋯ → "Vergleichen" toggelt Compare-State, Tray erscheint
2. **Compare-Tray:** Zeigt Live-Counter, "Vergleichstabelle" (kommt nächster Schritt)
3. **Overflow-Menü:** An Chat öffnet KI-Panel, 1-Pager/E-Mail öffnen Modals
4. **Modals:** Checkliste, 1-Pager, E-Mail mit Kopieren-Funktion
5. **Toast-System:** Alle Aktionen geben visuelles Feedback
6. **Esc-Verhalten:** Schließt alle Modals und Detailansicht

## Compare-State & Modals - Testbeispiele

1. **Vergleichen:** Klick auf ⋯ → "Vergleichen" toggelt Compare-State, Tray erscheint
2. **Compare-Tray:** Zeigt Live-Counter, "Vergleichstabelle" (kommt nächster Schritt)
3. **Overflow-Menü:** An Chat öffnet KI-Panel, 1-Pager/E-Mail öffnen Modals
4. **Modals:** Checkliste, 1-Pager, E-Mail mit Kopieren-Funktion
5. **Toast-System:** Alle Aktionen geben visuelles Feedback
6. **Esc-Verhalten:** Schließt alle Modals und Detailansicht

## Manuelle Tests

1. **Navigation:** Alle Panels ein-/ausklappbar, Auto-Collapse funktioniert
2. **Programmkarten:** Status-Badges, Teaser, Overflow-Menüs funktional
3. **Detailansicht:** Alle 8 Sektionen sichtbar, Warnbanner bei kritischen Status
4. **Checkliste:** 5 Schritte mit programmspezifischen Details
5. **Toast-Feedback:** Alle Buttons lösen sichtbare Rückmeldungen aus
6. **Suche:** Eingabe ab 2 Zeichen zeigt Vorschläge, Klick filtert Karten
7. **Fuzzy-Search:** Tippfehler werden toleriert, Synonyme erkannt
8. **Filter-Chips:** Klick aktiviert/deaktiviert, Zähler-Badges bei aktiven Gruppen
9. **Filter-Kombination:** OR innerhalb Gruppen, AND zwischen Gruppen
10. **ActiveFiltersBar:** Erscheint bei aktiven Filtern/Suche, Pills entfernbar
11. **Compare-State:** Vergleichen toggelt, Tray zeigt Counter, "Leeren" funktioniert
12. **Overflow-Menüs:** Alle Aktionen funktional, schließen automatisch
13. **Modals:** Öffnen/Schließen, Kopieren-Funktion, Esc-Verhalten
14. **Toast-System:** Erscheint rechts unten, verschwindet automatisch
11. **Compare-State:** Vergleichen toggelt, Tray zeigt Counter, "Leeren" funktioniert
12. **Overflow-Menüs:** Alle Aktionen funktional, schließen automatisch
13. **Modals:** Öffnen/Schließen, Kopieren-Funktion, Esc-Verhalten
14. **Toast-System:** Erscheint rechts unten, verschwindet automatisch
11. **Compare-State:** Vergleichen toggelt, Tray zeigt Counter, "Leeren" funktioniert
12. **Overflow-Menüs:** Alle Aktionen funktional, schließen automatisch
13. **Modals:** Öffnen/Schließen, Kopieren-Funktion, Esc-Verhalten
14. **Toast-System:** Erscheint rechts unten, verschwindet automatisch
15. **Vergleichstabelle:** "Vergleich öffnen" zeigt Modal mit strukturierter Tabelle
16. **Tabellen-Features:** Max. 4 Programme, horizontale Scroll, 11 Vergleichskriterien
17. **Tabellen-Navigation:** ESC schließt, Export/Chat nur Stubs
18. **KI-Panel:** Provider/Modus/Kontext wählbar, Schnell-Aktionen, Dummy-Antworten
19. **Answer-Cards:** Meta-Info, Kopieren-Funktion, chronologische Liste
20. **Panel-Steuerung:** Leeren/Schließen funktional, Eingabe mit Antwort-Generierung
21. **Provider-Presets:** Jeder Provider hat eigenen Stil/Länge/Kreativität
22. **Toggle-Schalter:** "Nur Broschüre" & "Quellen anfügen" beeinflussen Dummy-Antworten
23. **Preset-Anzeige:** Aktuelle Provider-Einstellungen sichtbar unter Schaltern
24. **Antwortformat:** Header mit Titel/Meta, WarningBanner, SourceBadge, Löschen-Button
25. **Warnhinweise:** Gelb/rot Banner bei problematischen Programmstatus
26. **Quellen-Badges:** Graue Pills mit Broschüren-Referenz unter Antworttext
27. **Wizard-Modal:** Vollbild-Modal mit 6 Schritten und Fortschrittsbalken
28. **Wizard-Navigation:** Zurück/Überspringen/Weiter mit klarer Steuerung
29. **Chip-Auswahl:** Große, klickbare Chips mit Mehrfachauswahl
30. **Wizard-Mapping:** Automatische FilterState-Generierung aus Antworten
31. **Ergebnisbanner:** Wizard-Ergebnisse klar markiert mit Reset-Option
32. **Keine-Ergebnisse:** Spezielle Tipps für Wizard-Ergebnisse
33. **Profil-Matching:** 5 Sektionen mit Chip-Auswahl für personalisierte Empfehlungen
34. **Match-Scoring:** Dummy-Algorithmus mit 5 Kategorien (Zielgruppe, Themen, Formal, Budget, Praktikabilität)
35. **Top-3-Ergebnisse:** MatchResultCards mit Score-Balken, 3 Gründen und Action-Buttons
36. **Profil-Ergebnisse:** Eigenes Banner und spezielle Keine-Ergebnisse-Tipps
37. **Tab-Navigation:** Zwischen 5 Profil-Sektionen mit Chip-Zählern
38. **Export-Buttons:** In Detail, Checkliste, 1-Pager, Vergleich, MatchResultCard
39. **Export-Vorschau:** A4-Layout mit Serifenschrift, druckfreundlich
40. **Dummy-Exporte:** PDF-Export und Kopieren erzeugen nur Toasts
41. **Copy-Funktionalität:** Einheitlicher CopyButton mit Fallback für ältere Browser
42. **EmptyState-Komponente:** 5 Szenarien mit Icons, Tipps und kontextspezifischen Aktionen
43. **Tooltip-System:** Hover-Tooltips für Chips, Icons und Buttons mit 300ms Delay
44. **Typisierte Toasts:** 4 Typen (info/success/warning/error) mit Farbkodierung
45. **Leere-Zustände:** Spezielle Behandlung für Suche, Wizard, Profil-Matching, Vergleich
46. **UI-Politur:** Verbesserte UX-Kommunikation und visuelles Feedback
47. **Vergleichskorb-Hinweis:** Dezenter Hinweis wenn noch keine Programme gewählt

48. **NavBar-Navigation:** Tab-System mit Explorer, Wizard, Profil-Matching, Hilfe
49. **Settings-Drawer:** Zahnrad öffnet rechten Drawer mit Provider/Schalter/Darstellung
50. **Karten-Dichte:** Komfort/Kompakt-Modus ändert Card-Padding und Schriftgrößen
51. **Kontrast-Modus:** Standard/Hoch für bessere Lesbarkeit
52. **HelpModal-Tabs:** 5 Bereiche mit Schnellstart, Tipps, Shortcuts, Changelog, Kontakt
53. **Startoverlay-Toggle:** "Als Startoverlay zeigen" für Hilfe beim App-Start
54. **FooterBar-Links:** Changelog/Kontakt öffnen entsprechende Hilfe-Tabs
55. **Explorer-Infozeile:** Dezenter Tipp unter NavBar für neue Nutzer
56. **Settings-Synchronisation:** Zentrale Settings wirken auf alle UI-Bereiche
57. **Auto-Navigation:** Wizard/Profil-Matching-Buttons wechseln Tab und öffnen Modal
58. **Akkordeon-Settings:** Einklappbare Sektionen im Settings-Drawer
59. **Zurücksetzen-Funktion:** "Alle Einstellungen auf Standard" mit Toast-Feedback
60. **Responsive NavBar:** Brand-Logo, Tab-Navigation und Action-Buttons
61. **Merkzettel-System:** Stern-Icon toggelt Programme in BookmarkBar
62. **BookmarkBar-Pills:** Max. 6 Programme mit Status-Badges, horizontales Scrollen
63. **"Alle ansehen":** Filtert Grid auf gemerkte Programme
64. **Verlaufs-Erfassung:** Detail, Checkliste, Vergleich, Chat, 1-Pager, E-Mail
65. **History-Panel:** Gruppierung nach Tagen, Klick öffnet Detail
66. **Verlauf löschen:** "Alles löschen" mit Toast-Feedback
67. **NavBar-Verlaufs-Icon:** 🕑 öffnet/schließt HistoryPanel
68. **Lokaler State:** Merkzettel und Verlauf ohne Persistenz

## Nächste Schritte

- **Prompt 6:** Vergleichstabelle für ausgewählte Programme ✅
- **Prompt 7:** KI-Panel Grundfunktionen (Provider/Modus/Kontext, Dummy-Antworten) ✅
- **Prompt 8:** Provider-Presets & Schalter (Standardwerte, "Nur Broschüre" & "Quellen anfügen") ✅
- **Prompt 9:** Antwortformat mit Quellen-Badges & Warnhinweisen ✅
- **Prompt 10:** Wizard "Welche Förderung passt?" (6 Schritte, Chip-Auswahl, Ergebnisliste) ✅
- **Prompt 11:** Profil-Matching (Kundenprofil, Hintergrund, Problemlage, Wunsch, Voraussetzungen) ✅
- **Prompt 12:** Export-Funktionen (1-Pager, Vergleichstabelle, E-Mail-Kurztext, Dummy lokal) ✅
- **Prompt 13:** Leere-/Fehlerzustände & Tooltips/Toasts (lokal, UI-Politur) ✅
- **Prompt 14:** Navigation, Layout-Politur, Settings & Hilfe (ohne Backend, lokal) ✅
- **Prompt 15:** Merkzettel & Verlauf (Programme merken, Aktionen-Log, lokal) ✅
- **Prompt 16:** Finalisierung & Review (UI-Politur, Konsistenz, API-Vorbereitung) ✅

## API-Integration Vorbereitung

Die App ist strukturell für echte API-Integration vorbereitet:

**Aktuelle API-Integration:**
- **ChatGPT:** Echte OpenAI API-Integration (gpt-4o-mini)
- **Mistral:** Echte OpenRouter API-Integration (mistralai/mistral-7b-instruct:free)
- **Claude:** Echte Anthropic API-Integration (claude-3-haiku-20240307)
- **Lokal:** Echte Ollama/LocalAI-Integration (OpenAI-kompatibel)
- **Custom:** Echte Custom-Endpoint-Integration (OpenAI-kompatibel)
- **RAG-System:** Alle Provider nutzen Broschüren-Chunks im "Nur Broschüre"-Modus

**Setup für alle Provider:**
1. `.env` Datei aus `.env.example` erstellen
2. Broschüre ingestieren: `npm run ingest` (erzeugt RAG-Chunks)
3. API-Keys eintragen:
   - `VITE_OPENAI_API_KEY=sk-...` für ChatGPT
   - `VITE_OPENROUTER_API_KEY=sk-or-...` für Mistral
   - `VITE_ANTHROPIC_API_KEY=sk-ant-...` für Claude
   - `VITE_LOCAL_OPENAI_BASEURL=http://localhost:11434/v1` für Lokal
   - `VITE_CUSTOM_OPENAI_BASEURL=https://your-endpoint.com/v1` für Custom
4. Settings öffnen → Provider-Tabs → Verbindung testen
5. Alle Provider im KI-Panel nutzen!
6. "Nur Broschüre"-Modus aktivieren für quellenbasierte Antworten

**RAG-System Testbeispiele:**
1. **Build-Time Ingestion:** `npm run ingest` → erzeugt `public/rag/chunks.json` mit ~50-100 Chunks
2. **Freie Frage:** "Welche Nachweise beim Bildungskonto?" → RAG liefert Voraussetzungen-Chunks von S. 13-14
3. **Programm-Kontext:** QBN + "Checkliste" → RAG liefert Frist/eAMS/Voraussetzungen-Chunks
4. **Nicht belegte Frage:** "Förderung für Haustiere?" → "Keine relevanten Inhalte gefunden"
5. **Vergleich:** QBN vs. Innovative Skills → RAG liefert Förderhöhe/Antrag/Frist beider Programme
6. **Warnungen:** Frage zu "Innovative Skills" → Warnung "Programm endet am 15.03.2026"

**Metriken-System Testbeispiele:**
1. **Search CTR:** Suche "bildung" → Klick auf Ergebnis → CTR steigt
2. **RAG-Abdeckung:** "Nur Broschüre" aktiviert → Citations pro Antwort gemessen
3. **Provider-Latenz:** ChatGPT/Mistral/Claude → p50/p90 Antwortzeiten erfasst
4. **Fehlerrate:** API-Key entfernen → Fehlerrate steigt, wird in Metriken angezeigt
5. **Modus-Verteilung:** Verschiedene Modi nutzen → Balkendiagramm zeigt Verteilung
6. **Nicht-belegt-Quote:** Fragen ohne RAG-Treffer → Quote steigt in RAG-Tab
Die App hat jetzt vollständige API-Integration für alle 5 Provider-Typen! 🚀

**Aktuelle API-Integration:**
- **ChatGPT:** Echte OpenAI API-Integration (gpt-4o-mini)
- **Andere Provider:** Noch Dummy-Responses (Mistral, Claude, Lokal, Custom)

**Setup für ChatGPT:**
1. `.env` Datei erstellen (basierend auf `.env.example`)
2. `VITE_OPENAI_API_KEY=sk-your-key-here` eintragen
3. ChatGPT Provider im KI-Panel auswählen
4. Echte API-Antworten erhalten

**Aktuelle API-Integration:**
- **ChatGPT:** Echte OpenAI API-Integration (gpt-4o-mini)
- **Andere Provider:** Noch Dummy-Responses (Mistral, Claude, Lokal, Custom)

**Setup für ChatGPT:**
1. `.env` Datei erstellen (basierend auf `.env.example`)
2. `VITE_OPENAI_API_KEY=sk-your-key-here` eintragen
3. ChatGPT Provider im KI-Panel auswählen
4. Echte API-Antworten erhalten

## RAG-System & Broschüren-Integration

**Build-Time PDF-Ingestion:**
- PDF-Broschüre wird mit `npm run ingest` vorab verarbeitet
- Erzeugt `public/rag/chunks.json` und `public/rag/stats.json`
- Heuristiken erkennen Sektionen (Zielgruppe, Förderhöhe, Voraussetzungen, etc.)
- ~800-Zeichen-Chunks mit 140-Zeichen-Overlap für optimale Retrieval-Qualität
- Beim App-Start werden die vorverarbeiteten Chunks geladen und indexiert

**"Nur Broschüre"-Modus:**
- KI-Provider erhalten relevante PDF-Chunks als Kontext (max. 1500 Zeichen)
- Antworten basieren ausschließlich auf Broschüren-Inhalten
- Echte Quellenangaben mit präzisen Seitenzahlen
- Warnungen bei ausgesetzten/endenden Programmen
- "Keine Inhalte gefunden"-Hinweis bei irrelevanten Fragen

**Retrieval-Strategien:**
- **Query-basiert:** Freie Fragen → relevante Chunks aller Programme
- **Programm-spezifisch:** Kontext "Aktuelle Karte" → Chunks des gewählten Programms
- **Topic-fokussiert:** Checkliste/Vergleich → spezifische Sektionen (Voraussetzungen, Frist, etc.)
- **Sektion-Filter:** Gezielte Suche in Förderhöhe, Antragsweg, Voraussetzungen

**Technische Details:**
- In-Memory DocumentStore ohne externe Abhängigkeiten
- Normalisierung für Umlaute, ß, Diakritika
- Programm-Metadaten aus `src/data/programMeta.ts`
- Chunk-Validierung und Qualitätsprüfung
- Simulierte PDF-Extraktion (da echte PDF-Libs in WebContainer nicht verfügbar)

**useDummyApi Hook (`src/hooks/useDummyApi.ts`):**
- `useFetchPrograms()` - Lädt Förderprogramme (aktuell: statische Daten)
- `useChatResponse()` - Generiert KI-Antworten (aktuell: Dummy-Responses)
- `useSearch()` - Führt Programmsuche durch (aktuell: lokale Filterung)
- `useExport()` - Exportiert zu PDF/E-Mail (aktuell: Console-Logs)

**useChatApi Hook (`src/hooks/useChatApi.ts`):**
- `askChatGPT()` - Echte OpenAI API-Calls für ChatGPT Provider
- Loading States und Error Handling
- Fallback zu Dummy bei fehlendem API-Key
- Modus-spezifische Prompts (Fakten, Checkliste, Vergleich, E-Mail)

**useChatApi Hook (`src/hooks/useChatApi.ts`):**
- `askChatGPT()` - Echte OpenAI API-Calls für ChatGPT Provider
- Loading States und Error Handling
- Fallback zu Dummy bei fehlendem API-Key
- Modus-spezifische Prompts (Fakten, Checkliste, Vergleich, E-Mail)

**Für echte API-Integration:**
1. Weitere Provider in `useChatApi.ts` implementieren (Claude, etc.)
2. Bestehende Komponenten bleiben unverändert
3. Loading/Error States sind bereits implementiert
4. Provider-spezifische Logik erweitern

**Lokale und Custom Provider:**
- **Verbindungstests:** "Verbindung testen" Button in Settings
- **ConnectionBadge:** Zeigt Verbindungsstatus (grün/rot) mit Fehlermeldungen
- **Timeout-Handling:** 12s für Requests, 8s für Health Checks
- **CORS-Hinweise:** Klare Fehlermeldungen bei CORS-Problemen
- **Sicherheitsschalter:** "Keine externen Provider zulassen" für Datenschutz
- **Fallback-Logik:** Dummy-Antworten bei nicht erreichbaren Endpoints

**RAG-System & Broschüren-Grounding:**
- **PDF-Ingestion:** Automatische Extraktion und Chunking der Förderbroschüre
- **Intelligente Segmentierung:** Erkennung von Programm-Sektionen (Zielgruppe, Förderhöhe, etc.)
- **BM25-Suche:** Relevante Textabschnitte mit Fuzzy-Matching für Tippfehler
- **Echte Quellenangaben:** Präzise Seitenzahlen und Stand-Informationen
- **"Nur Broschüre"-Modus:** KI-Antworten basieren ausschließlich auf PDF-Inhalten
- **Warnungen:** Automatische Erkennung problematischer Programme (ausgesetzt/endet)
- **Kontext-Integration:** RAG-Chunks werden als Kontext an alle API-Provider übergeben

## Technischer Stack

- React 18 + TypeScript + Vite
- Tailwind CSS für Styling
- Lokale State-Verwaltung ohne externe Libraries
- Responsive Design mit Mobile-First-Ansatz
- Eigene Suchlogik mit Fuzzy-Matching und Synonymen
- ErrorBoundary für robuste Fehlerbehandlung
- Zentrale API-Abstraktion für einfache Backend-Integration
- Konsistentes Design-System mit CSS Custom Properties
- RAG-System mit lokaler Dokumenten-Indexierung
- BM25-basierte Textsuche ohne externe Abhängigkeiten

## Echte Broschüre laden

### Echte Broschüre laden (statt Simulation)

1. Lege die generierten Dateien unter **`public/rag/`** ab:
   - `public/rag/chunks.json`
   - `public/rag/stats.json`
   - `public/rag/programMeta.json`

2. Commit & Build. Im Browser müssen diese URLs **200** liefern:
   - `<BASE_URL>/rag/stats.json`
   - `<BASE_URL>/rag/chunks.json`

3. Falls bereits Daten im Browser-Cache: In **Settings → Broschüren** „Cache leeren & neu laden" klicken.

> **Hinweis:** Bei Deploy unter Subpfad wird `BASE_URL` automatisch berücksichtigt. Die App lädt immer über `<BASE_URL>/rag/*`.

**Ohne diese Dateien:** Simulationsdaten mit rotem Error-Toast "Broschürendaten fehlen".

## Offline/Cache

- IndexedDB-Cache für RAG-Chunks (buildId-basiert)
- Automatische Cache-Bereinigung bei neuen Versionen
- Offline-Funktionalität nach erstem Laden
- Cache-Status wird in Toast-Nachrichten angezeigt