/**
 * @file
 * Hell/Dunkel-Umschalter für Besucher.
 *
 * Die Wahl liegt im localStorage. Das Inline-Skript in html.html.twig setzt sie
 * schon vor dem ersten Zeichnen; ohne Wahl gilt das Farbschema aus den
 * Theme-Einstellungen.
 */
((Drupal, once) => {
  const STORAGE_KEY = "sommertheater-scheme";

  const syncButtons = () => {
    const isDark = document.documentElement.classList.contains("dark");
    document.querySelectorAll("[data-scheme-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", isDark ? "true" : "false");
    });
  };

  Drupal.behaviors.sommertheaterSchemeToggle = {
    attach(context) {
      once("scheme-toggle", "[data-scheme-toggle]", context).forEach((button) => {
        button.addEventListener("click", () => {
          const isDark = !document.documentElement.classList.contains("dark");
          document.documentElement.classList.toggle("dark", isDark);
          try {
            window.localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
          } catch (error) {
            // Ohne localStorage (z. B. gesperrt) gilt die Wahl nur für diese Seite.
            console.warn("Farbschema konnte nicht gespeichert werden", error);
          }
          syncButtons();
        });
      });
      syncButtons();
    },
  };
})(Drupal, once);
