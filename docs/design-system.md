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

- Buttons: primär gold gefüllt, sekundär dunkel mit Messingrahmen, Textlink mit Pfeil, deaktiviert grau-grün
- Karten: Archiv-Papierkarte, dunkle Eventkarte und moderne Glas-Karte
- Navigation: Desktop-Navigation, kompaktes mobiles Menü, Breadcrumb und Pagination
- Badges: Tag-Pills, Datumskarte und Status-Badges
- Formulare: klare Felder, goldener Fokus, Terrakotta-Fehlerzustand, deaktivierte Felder
- Medienrahmen: ornamentaler Archivrahmen und moderner abgerundeter Rahmen
- Ornamente: feine Messinglinien, florale/theatralische Mittelornamente und dezentes Blattmuster
- Icons: feinlinige warme Messingfarbe; bevorzugt Phosphor-Icons

## Maße

Spacing-Skala: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`.

Radien: `4px`, `8px`, `16px`, `24px`, `32px`, `48px`; runde Icon-Flächen dürfen vollständig kreisförmig sein.

Schatten: zurückhaltend und warm, damit Karten auf dem dunklen Waldgrün lesbar bleiben.

## Umsetzungsregel

Neue Komponenten verwenden ausschließlich semantische Tokens aus `src/theme.css`. Harte Farben gehören nur in die Token-Definition oder in dokumentierte Bild-Assets. Jede visuelle Änderung wird gegen `mockup/designvorschlag_1.png` geprüft.
