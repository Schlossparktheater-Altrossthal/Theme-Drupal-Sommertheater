# Designsystem Sommertheater Altfrossthal

Diese Datei ist die verbindliche visuelle Referenz für das Theme und orientiert sich an `mockup/designvorschlag_1.png`.

## Markenbild

- Name: Sommertheater Altfrossthal
- Claim: „Theater unter freiem Himmel. Geschichten, die bleiben."
- Stil: natürlich, ruhig, historisch, theatralisch und warm
- Primäre Oberfläche: tiefes Waldgrün mit Papier-, Messing- und Terrakotta-Akzenten

## Farben

| Farbe           | Hex       | Verwendung                               |
| --------------- | --------- | ---------------------------------------- |
| Waldgrün        | `#0D1715` | Haupthintergrund und tiefe Flächen       |
| Oberfläche      | `#182522` | Karten, Navigation und Panels            |
| Papier-Basis    | `#EBD6B4` | Archivkarten und Papierflächen           |
| Papier-Geleert  | `#C6A77A` | gedämpfte Papierflächen und Sekundärtext |
| CTA-Gold        | `#E58A08` | primäre Aktionen und Fokus               |
| Messing         | `#B68A45` | Linien, Ornamente und sekundäre Akzente  |
| Terrakotta      | `#88452E` | Warnungen, aktive Zustände und Status    |
| Text-Aufhellung | `#F6EBD3` | Haupttext auf dunklen Flächen            |
| Sekundärtext    | `#87968A` | Beschreibungen und Captions              |

Der dunkle Modus ist die primäre Darstellung. Der helle Modus verwendet Papier- und Cremeflächen mit Waldgrün als Textfarbe.

## Typografie

- Display und Überschriften: elegante Display-Serifenschrift, H1 regular/bold, H2 semibold, H3 bold
- Interface und Fließtext: gut lesbare humanistische Sans-Serifenschrift
- Captions: Sans Serif medium
- Keine negative Zeichenweite; Text soll ruhig und großzügig gesetzt sein

## Komponenten

### Sommertheater hero

Der eigenständige Hero liegt in `components/sommertheater-hero/` und kann in Drupal Canvas oder Twig über `sommertheater:sommertheater-hero` verwendet werden. Er füllt die volle Breite und Bildschirmhöhe und bietet eine Diashow aus mehreren Hintergrundbildern (Crossfade alle 8 s), Eyebrow, eine Überschrift in Versalien in einem Glasrahmen, einen Ornament-Trenner, Intro, frei platzierbare Buttons über den Slot `actions` (Fallback: CTA-Link) und eine starke oder weiche Waldgrün-Überlagerung. Der Hero ist in beiden Farbschemata eine dunkle Bühne mit heller Schrift: Im dunklen Schema läuft er unten in die Seite aus, im hellen Schema schließt er mit einer Messinglinie ab. Über `overlap_navbar` beginnt der Hero hinter dem Header (der Header liegt transparent mit hellen Tokens darüber und wird beim Scrollen solide). Das JavaScript steuert Diashow und Scroll-Parallax und respektiert `prefers-reduced-motion`.

- Buttons: primär gold gefüllt, sekundär dunkel mit Messingrahmen, Textlink mit Pfeil, deaktiviert grau-grün
- Karten: Archiv-Papierkarte, dunkle Eventkarte und moderne Glas-Karte
- Navigation: Desktop-Navigation, kompaktes mobiles Menü, Breadcrumb und Pagination
- Badges: Tag-Pills, Datumskarte und Status-Badges
- Formulare: klare Felder, goldener Fokus, Terrakotta-Fehlerzustand, deaktivierte Felder
- Medienrahmen: ornamentaler Archivrahmen und moderner abgerundeter Rahmen
- Ornamente: feine Messinglinien, florale/theatralische Mittelornamente und dezentes Blattmuster
- Icons: feinlinige warme Messingfarbe; bevorzugt Phosphor-Icons

### Canvas-Komponenten (Designsystem)

Die Mockup-Elemente sind als eigenständige Single-Directory-Components umgesetzt und direkt in Drupal Canvas verfügbar:

| Komponente    | Canvas-ID                    | Beschreibung                                                                                                |
| ------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Event-Karte   | `sommertheater:card-event`   | Dunkle Eventkarte mit Bild, Ort, Termin, Zeit, Tag-Pills und Link                                           |
| Archiv-Karte  | `sommertheater:card-archive` | Papierkarte mit Ornament-Rahmen, Monogramm und Link                                                         |
| Glas-Karte    | `sommertheater:card-glass`   | Moderne Glas-Karte mit Statistiken und Link                                                                 |
| Status-Badge  | `sommertheater:status-badge` | Neu / Aktualisiert / Ausverkauft / Abgesagt                                                                 |
| Breadcrumb    | `sommertheater:breadcrumb`   | Breadcrumb-Pfad mit Startseiten-Icon                                                                        |
| Pagination    | `sommertheater:pagination`   | Seitenzahlen mit Vor-/Zurück-Pfeilen                                                                        |
| Formular-Feld | `sommertheater:form-field`   | Text-, E-Mail-, Such-, Select-, Textarea- und Checkbox-Feld mit Fokus-/Fehlerzustand                        |
| Countdown     | `sommertheater:countdown`    | Aktivierbarer Premieren-Countdown mit mehreren Vorstellungen (Datum + Uhrzeit), Live-Ticker und Hinweistext |

Der Header wird vom Theme verwaltet: Der Branding-Block (Seitenname als Text-Link zur Startseite) und der Hauptnavigation-Block gehören in die Region `header`; die optionale Block-Konfiguration liegt in `config/optional/`. Der Hero (`sommertheater:sommertheater-hero`) kann den Header mit `overlap_navbar` hintergreifen – der Header liegt dann transparent darüber und wird beim Scrollen solide (sticky).

## Maße

Spacing-Skala: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`.

Radien: `4px`, `8px`, `16px`, `24px`, `32px`, `48px`; runde Icon-Flächen dürfen vollständig kreisförmig sein.

Schatten: zurückhaltend und warm, damit Karten auf dem dunklen Waldgrün lesbar bleiben.

## Umsetzungsregel

Neue Komponenten verwenden ausschließlich semantische Tokens aus `src/theme.css`. Harte Farben gehören nur in die Token-Definition oder in dokumentierte Bild-Assets. Jede visuelle Änderung wird gegen `mockup/designvorschlag_1.png` geprüft.
