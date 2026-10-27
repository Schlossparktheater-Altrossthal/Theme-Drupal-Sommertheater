<?php

declare(strict_types=1);

namespace Drupal\sommertheater\Hook;

use Drupal\Component\Utility\NestedArray;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Breadcrumb\ChainBreadcrumbBuilderInterface;
use Drupal\Core\Controller\TitleResolverInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Extension\ThemeExtensionList;
use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Messenger\MessengerTrait;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\sommertheater\RenderCallbacks;
use Drupal\sommertheater\TheaterSettings;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\node\NodeInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Contains hook implementations for Sommertheater.
 */
final class ThemeHooks {

  use MessengerTrait;
  use StringTranslationTrait;

  /**
   * The Drupal root.
   */
  private static ?string $appRoot = NULL;

  public function __construct(
    private readonly ThemeSettingsProvider $themeSettings,
    private readonly RequestStack $requestStack,
    private readonly ThemeExtensionList $themeList,
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly RouteMatchInterface $routeMatch,
    private readonly TitleResolverInterface $titleResolver,
    private readonly ChainBreadcrumbBuilderInterface $breadcrumb,
    private readonly ModuleHandlerInterface $moduleHandler,
    private readonly ConfigFactoryInterface $configFactory,
    #[Autowire(param: 'app.root')] string $appRoot,
  ) {
    self::$appRoot ??= $appRoot;
  }

  /**
   * Implements hook_element_info_alter().
   */
  #[Hook('element_info_alter')]
  public function alterElementInfo(array &$info): void {
    // Vor dem Core-Callback, der aus den Props das Template baut; sonst wirken Prop-Änderungen nicht.
    array_unshift($info['component']['#pre_render'], [RenderCallbacks::class, 'preRenderComponent']);
  }

  /**
   * Implements hook_library_info_alter().
   */
  #[Hook('library_info_alter')]
  public function alterLibraryInfo(array &$libraries, string $extension): void {
    $override = static function (string $name, string $replacement) use (&$libraries): void {
      $old_parents = ['global', 'css', 'theme', $name];
      $new_parents = [...array_slice($old_parents, 0, -1), $replacement];
      $css_settings = NestedArray::getValue($libraries, $old_parents);
      NestedArray::setValue($libraries, $new_parents, $css_settings);
      NestedArray::unsetValue($libraries, $old_parents);
    };
    if ($extension === 'sommertheater') {
      if (file_exists(self::$appRoot . '/theme.css')) {
        $override('src/theme.css', '/theme.css');
      }
      if (file_exists(self::$appRoot . '/fonts.css')) {
        $override('src/fonts.css', '/fonts.css');
      }
    }
  }

  /**
   * Implements hook_form_FORM_ID_alter().
   */
  #[Hook('form_system_theme_settings_alter')]
  public function themeSettingsFormAlter(array &$form, FormStateInterface $form_state): void {
    $form['scheme'] = [
      '#type' => 'radios',
      '#title' => t('Color scheme'),
      '#default_value' => $this->themeSettings->getSetting('scheme'),
      '#options' => [
        'light' => t('Light'),
        'dark' => t('Dark'),
      ],
    ];
    $this->addTheaterSettings($form);
    $message = $this->t("See <code>@path</code> to learn how to customize Sommertheater's fonts, colors, and components.", [
      '@path' => $this->themeList->getPath('sommertheater') . '/CUSTOMIZING.md',
    ]);
    $this->messenger()->addMessage($message, 'info');
  }

  /**
   * Formular für die seitenweiten Angaben (TheaterSettings).
   */
  private function addTheaterSettings(array &$form): void {
    $s = TheaterSettings::all();
    $lines = static fn(array $items): string => implode("\n", $items);
    $pairs = static fn(array $items): string => implode("\n", array_map(static fn(array $a): string => $a['name'] . '=' . $a['value'], $items));

    $form['theater_values'] = [
      '#type' => 'container',
      '#tree' => TRUE,
      '#parents' => ['theater'],
      '#weight' => -20,
    ];
    $t = &$form['theater_values'];

    $t['organisation'] = [
      '#type' => 'details',
      '#title' => $this->t('Verein und Spielort'),
      '#description' => $this->t('Für Suchmaschinen (schema.org auf der Startseite).'),
    ];
    $o = $s['organisation'];
    $t['organisation']['alternate_names'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Namensvarianten'),
      '#description' => $this->t('Eine pro Zeile.'),
      '#default_value' => $lines($o['alternate_names']),
      '#rows' => 3,
      '#element_validate' => [[self::class, 'validateLines']],
    ];
    $t['organisation']['description'] = ['#type' => 'textarea', '#title' => $this->t('Beschreibung'), '#default_value' => $o['description'], '#rows' => 3];
    $t['organisation']['founding_date'] = ['#type' => 'textfield', '#title' => $this->t('Gründungsjahr'), '#default_value' => $o['founding_date'], '#size' => 10];
    $t['organisation']['email'] = ['#type' => 'email', '#title' => $this->t('E-Mail'), '#default_value' => $o['email']];
    $t['organisation']['venue_name'] = ['#type' => 'textfield', '#title' => $this->t('Spielort'), '#default_value' => $o['venue_name']];
    $t['organisation']['street'] = ['#type' => 'textfield', '#title' => $this->t('Straße'), '#default_value' => $o['street']];
    $t['organisation']['postal_code'] = ['#type' => 'textfield', '#title' => $this->t('PLZ'), '#default_value' => $o['postal_code'], '#size' => 10];
    $t['organisation']['locality'] = ['#type' => 'textfield', '#title' => $this->t('Ort'), '#default_value' => $o['locality']];
    $t['organisation']['region'] = ['#type' => 'textfield', '#title' => $this->t('Bundesland'), '#default_value' => $o['region']];
    $t['organisation']['country'] = ['#type' => 'textfield', '#title' => $this->t('Land (ISO-Code)'), '#default_value' => $o['country'], '#size' => 4];

    $t['social'] = ['#type' => 'details', '#title' => $this->t('Profile')];
    $t['social']['instagram_url'] = ['#type' => 'url', '#title' => $this->t('Instagram'), '#default_value' => $s['social']['instagram_url']];
    $t['social']['other_profiles'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Weitere Profile'),
      '#description' => $this->t('URLs, eine pro Zeile (für Suchmaschinen).'),
      '#default_value' => $lines($s['social']['other_profiles']),
      '#rows' => 3,
      '#element_validate' => [[self::class, 'validateLines']],
    ];

    $t['member'] = ['#type' => 'details', '#title' => $this->t('Mitgliederbereich')];
    $t['member']['base_url'] = [
      '#type' => 'url',
      '#title' => $this->t('Basis-URL'),
      '#description' => $this->t('Spielplan, Countdown, Kennzahlen und Kartenbuchung laden ihre Daten von hier.'),
      '#default_value' => $s['member']['base_url'],
    ];

    $a = $s['analytics'];
    $t['analytics'] = [
      '#type' => 'details',
      '#title' => $this->t('Besucherstatistik (Umami)'),
      '#description' => $this->t('Wird nur für anonyme Besucher außerhalb von /admin geladen.'),
    ];
    $t['analytics']['enabled'] = ['#type' => 'checkbox', '#title' => $this->t('Statistik aktiv'), '#default_value' => $a['enabled']];
    $t['analytics']['script_url'] = ['#type' => 'url', '#title' => $this->t('Skript-URL'), '#default_value' => $a['script_url']];
    $t['analytics']['website_id'] = ['#type' => 'textfield', '#title' => $this->t('Website-ID'), '#default_value' => $a['website_id']];
    $t['analytics']['host_url'] = ['#type' => 'url', '#title' => $this->t('Host-URL (data-host-url)'), '#description' => $this->t('Leer = Server des Skripts.'), '#default_value' => $a['host_url']];
    $t['analytics']['domains'] = ['#type' => 'textfield', '#title' => $this->t('Domains (data-domains)'), '#description' => $this->t('Kommagetrennt; nur dort wird gezählt.'), '#default_value' => $a['domains']];
    $t['analytics']['tag'] = ['#type' => 'textfield', '#title' => $this->t('Tag (data-tag)'), '#default_value' => $a['tag']];
    $t['analytics']['do_not_track'] = ['#type' => 'checkbox', '#title' => $this->t('„Do Not Track“ des Browsers beachten'), '#default_value' => $a['do_not_track']];
    $t['analytics']['auto_track'] = ['#type' => 'checkbox', '#title' => $this->t('Seitenaufrufe automatisch zählen'), '#default_value' => $a['auto_track']];
    $t['analytics']['performance'] = ['#type' => 'checkbox', '#title' => $this->t('Ladezeiten messen (Web Vitals, data-performance)'), '#default_value' => $a['performance']];
    $t['analytics']['exclude_search'] = ['#type' => 'checkbox', '#title' => $this->t('URL-Parameter nicht erfassen'), '#default_value' => $a['exclude_search']];
    $t['analytics']['exclude_hash'] = ['#type' => 'checkbox', '#title' => $this->t('URL-Hash nicht erfassen'), '#default_value' => $a['exclude_hash']];
    $t['analytics']['extra_attributes'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Weitere Attribute'),
      '#description' => $this->t('Für neue Umami-Funktionen, je Zeile <code>data-name=wert</code>.'),
      '#default_value' => $pairs($a['extra_attributes']),
      '#rows' => 3,
      '#element_validate' => [[self::class, 'validateAttributes']],
    ];
    $t['analytics']['extra_scripts'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Zusätzliche Skripte'),
      '#description' => $this->t('Z. B. Recorder/Heatmap. Je Zeile: <code>https://…/skript.js data-name=wert data-name2=wert2</code>. Gleiche Bedingungen wie das Hauptskript (anonym, Opt-out).'),
      '#default_value' => implode("\n", array_map(static fn(array $x): string => trim($x['src'] . ' ' . implode(' ', array_map(static fn(array $at): string => $at['name'] . '=' . $at['value'], $x['attributes'] ?? []))), $a['extra_scripts'])),
      '#rows' => 3,
      '#element_validate' => [[self::class, 'validateScripts']],
    ];

    $t['news'] = ['#type' => 'details', '#title' => $this->t('Neuigkeiten-Seite')];
    $t['news']['intro'] = ['#type' => 'textarea', '#title' => $this->t('Einleitung'), '#default_value' => $s['news']['intro'], '#rows' => 2];
    $t['news']['instagram_hint'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Instagram-Hinweis'),
      '#description' => $this->t('Dahinter folgt der Instagram-Link. Leer = kein Hinweis.'),
      '#default_value' => $s['news']['instagram_hint'],
    ];
  }

  /**
   * Zeilen in eine Liste umwandeln.
   */
  public static function validateLines(array &$element, FormStateInterface $form_state): void {
    $form_state->setValueForElement($element, self::splitLines((string) $element['#value']));
  }

  /**
   * "data-name=wert"-Zeilen in Attribut-Paare umwandeln.
   */
  public static function validateAttributes(array &$element, FormStateInterface $form_state): void {
    $result = [];
    foreach (self::splitLines((string) $element['#value']) as $line) {
      $pair = self::parseAttribute($line);
      if ($pair === NULL) {
        $form_state->setError($element, t('Ungültiges Attribut „@line“ (erlaubt: data-name=wert).', ['@line' => $line]));
        return;
      }
      $result[] = $pair;
    }
    $form_state->setValueForElement($element, $result);
  }

  /**
   * Skript-Zeilen in URL plus Attribute umwandeln.
   */
  public static function validateScripts(array &$element, FormStateInterface $form_state): void {
    $result = [];
    foreach (self::splitLines((string) $element['#value']) as $line) {
      $parts = preg_split('/\s+/', $line);
      $src = array_shift($parts);
      if (!str_starts_with($src, 'https://')) {
        $form_state->setError($element, t('Skript-URL muss mit https:// beginnen: „@src“.', ['@src' => $src]));
        return;
      }
      $attributes = [];
      foreach ($parts as $part) {
        $pair = self::parseAttribute($part);
        if ($pair === NULL) {
          $form_state->setError($element, t('Ungültiges Attribut „@line“ (erlaubt: data-name=wert).', ['@line' => $part]));
          return;
        }
        $attributes[] = $pair;
      }
      $result[] = ['src' => $src, 'attributes' => $attributes];
    }
    $form_state->setValueForElement($element, $result);
  }

  /**
   * Nicht leere, getrimmte Zeilen.
   */
  private static function splitLines(string $value): array {
    return array_values(array_filter(array_map('trim', preg_split('/\R/', $value)), 'strlen'));
  }

  /**
   * "data-name=wert" zerlegen; nur data-*-Attribute sind erlaubt.
   */
  public static function parseAttribute(string $text): ?array {
    if (!preg_match('/^(data-[a-z0-9-]+)=(.*)$/', trim($text), $m)) {
      return NULL;
    }
    return ['name' => $m[1], 'value' => trim($m[2], '"\'')];
  }

  /**
   * Implements template_preprocess_image_widget().
   */
  #[Hook('preprocess_image_widget')]
  public function preprocessImageWidget(array &$variables): void {
    $data = &$variables['data'];

    // This prevents image widget templates from rendering preview container
    // HTML to users that do not have permission to access these previews.
    // @todo revisit in https://drupal.org/node/953034
    // @todo revisit in https://drupal.org/node/3114318
    if (isset($data['preview']['#access']) && $data['preview']['#access'] === FALSE) {
      unset($data['preview']);
    }
  }

  /**
   * Implements template_preprocess_html().
   */
  #[Hook('preprocess_html')]
  public function preprocessHtml(array &$variables): void {
    $variables['scheme'] = $this->themeSettings->getSetting('scheme');
    $variables['umami_scripts'] = self::umamiScripts();
    $variables['#cache']['tags'] = array_merge($variables['#cache']['tags'] ?? [], TheaterSettings::cacheTags());
    // Get the theme base path for font preloading.
    $variables['sommertheater_path'] = $this->requestStack->getCurrentRequest()->getBasePath() . '/' . $this->themeList->getPath('sommertheater');
  }

  /**
   * Implements template_preprocess_views_view() für die Neuigkeiten.
   */
  #[Hook('preprocess_views_view')]
  public function preprocessViewsView(array &$variables): void {
    if ($variables['view']->id() !== 'neuigkeiten') {
      return;
    }
    $all = TheaterSettings::all();
    $variables['theater_news'] = $all['news'];
    $variables['theater_instagram_url'] = $all['social']['instagram_url'];
    $variables['#cache']['tags'] = array_merge($variables['#cache']['tags'] ?? [], TheaterSettings::cacheTags());
  }

  /**
   * Umami-Skripte als Liste von Attribut-Arrays (Hauptskript zuerst).
   */
  public static function umamiScripts(): array {
    $a = TheaterSettings::get('analytics');
    if (empty($a['enabled']) || empty($a['script_url']) || empty($a['website_id'])) {
      return [];
    }
    $main = [
      'defer' => TRUE,
      'src' => $a['script_url'],
      'data-website-id' => $a['website_id'],
    ];
    $optional = [
      'data-host-url' => $a['host_url'],
      'data-domains' => $a['domains'],
      'data-tag' => $a['tag'],
    ];
    $main += array_filter($optional, 'strlen');
    $flags = [
      'data-do-not-track' => [$a['do_not_track'], 'true'],
      'data-auto-track' => [!$a['auto_track'], 'false'],
      'data-performance' => [$a['performance'], 'true'],
      'data-exclude-search' => [$a['exclude_search'], 'true'],
      'data-exclude-hash' => [$a['exclude_hash'], 'true'],
    ];
    foreach ($flags as $name => [$active, $value]) {
      if ($active) {
        $main[$name] = $value;
      }
    }
    foreach ($a['extra_attributes'] as $pair) {
      $main[$pair['name']] = $pair['value'];
    }
    $scripts = [$main];
    foreach ($a['extra_scripts'] as $extra) {
      $script = ['defer' => TRUE, 'src' => $extra['src']];
      foreach ($extra['attributes'] ?? [] as $pair) {
        $script[$pair['name']] = $pair['value'];
      }
      $scripts[] = $script;
    }
    return $scripts;
  }

  /**
   * Implements template_preprocess_block() for the branding block.
   *
   * The header always shows logo and site name, independent of the block
   * settings (the block is placed via Canvas, where they are not editable).
   */
  #[Hook('preprocess_block__system_branding_block')]
  public function preprocessBrandingBlock(array &$variables): void {
    if (empty($variables['site_name'])) {
      $variables['site_name'] = $this->configFactory->get('system.site')->get('name');
    }
    $variables['sommertheater_logo'] = $this->requestStack->getCurrentRequest()->getBasePath() . '/' . $this->themeList->getPath('sommertheater') . '/images/logo-sommertheater.png?v=' . self::logoVersion();
  }

  /**
   * Version der Logo-Dateien für Cache-Busting (Cloudflare cacht Theme-Dateien bis 30 Tage).
   *
   * logo-version.txt wird beim Ausrollen aus dem Repo Schlossparktheater-Altrossthal/Logo gesetzt.
   */
  public static function logoVersion(): string {
    static $version;
    return $version ??= trim((string) @file_get_contents(dirname(__DIR__, 2) . '/logo-version.txt')) ?: '0';
  }

  /**
   * Implements template_preprocess_page().
   */
  #[Hook('preprocess_page')]
  public function preprocessPage(array &$variables): void {
    // @see \Drupal\Core\Block\Plugin\Block\PageTitleBlock::build()
    $variables['title'] = [
      '#type' => 'page_title',
      '#title' => $variables['page']['#title'] ?? $this->titleResolver->getTitle(
        $this->requestStack->getCurrentRequest(),
        $this->routeMatch->getRouteObject(),
      ),
    ];

    // @see \Drupal\system\Plugin\Block\SystemBreadcrumbBlock::build()
    $variables['breadcrumb'] = $this->breadcrumb->build($this->routeMatch)
      ->toRenderable();

    $route_name = $this->routeMatch->getRouteName();
    if ($route_name === 'entity.canvas_page.canonical' || str_starts_with($this->routeMatch->getRouteObject()?->getPath() ?? '', '/canvas/')) {
      $variables['rendered_by_canvas'] = TRUE;
    }
    elseif ($route_name === 'entity.node.canonical' && $this->moduleHandler->moduleExists('canvas')) {
      $node = $this->routeMatch->getParameter('node');
      assert($node instanceof NodeInterface);

      $variables['rendered_by_canvas'] = (bool) $this->entityTypeManager->getStorage('content_template')
        ->getQuery()
        ->accessCheck(FALSE)
        ->count()
        ->condition('content_entity_type_id', 'node')
        ->condition('content_entity_type_bundle', $node->getType())
        ->condition('content_entity_type_view_mode', 'full')
        ->condition('status', TRUE)
        ->execute();
    }
    else {
      $variables['rendered_by_canvas'] = FALSE;
    }

    // Webform-Seiten haben keinen Canvas-Seitenkopf: Titel selbst ausgeben.
    $webform = $route_name === 'entity.webform.canonical' ? $this->routeMatch->getParameter('webform') : NULL;
    $variables['webform_title'] = $webform?->label();

    $variables['#cache']['contexts'][] = 'route';
  }

}
