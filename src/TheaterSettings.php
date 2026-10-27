<?php

declare(strict_types=1);

namespace Drupal\sommertheater;

/**
 * Seitenweite Angaben, die in Drupal änderbar sind (Config sommertheater.settings, Schlüssel "theater").
 *
 * Gepflegt unter Design → Einstellungen → Sommertheater oder per MCP-Tool
 * theater_settings. Fehlende Werte fallen auf DEFAULTS zurück, das ist der
 * Stand vor der Umstellung; so sieht die Seite ohne gespeicherte Config gleich aus.
 */
final class TheaterSettings {

  /**
   * Host, der in gespeicherten Canvas-Props steht und auf member.base_url umgeschrieben wird.
   */
  public const DEFAULT_MEMBER_BASE_URL = 'https://app.sommertheater-altrossthal.de';

  public const DEFAULTS = [
    'organisation' => [
      'alternate_names' => [
        'Schlossparktheater',
        'Schlossparktheater Dresden',
        'Schlossparktheater Altroßthal',
      ],
      'description' => 'Ehrenamtliches Freilichttheater des Beruflichen Schulzentrums für Agrarwirtschaft und Ernährung Dresden, das seit 2009 jeden Sommer ein Stück im Schlosspark Altroßthal spielt.',
      'founding_date' => '2008',
      'email' => 'info@bsz-ae-dd.de',
      'street' => 'Altroßthal 1',
      'postal_code' => '01169',
      'locality' => 'Dresden',
      'region' => 'Sachsen',
      'country' => 'DE',
      'venue_name' => 'Schlosspark Altroßthal',
    ],
    'social' => [
      'instagram_url' => 'https://www.instagram.com/schlossparktheater/',
      'other_profiles' => [],
    ],
    'member' => [
      'base_url' => self::DEFAULT_MEMBER_BASE_URL,
    ],
    'analytics' => [
      'enabled' => TRUE,
      'script_url' => 'https://stats.sommertheater-altrossthal.de/st.js',
      'website_id' => '7017b0eb-c723-4a2f-b750-be503f1283ba',
      'host_url' => '',
      'domains' => 'sommertheater-altrossthal.de',
      'do_not_track' => TRUE,
      'auto_track' => TRUE,
      'performance' => FALSE,
      'exclude_search' => FALSE,
      'exclude_hash' => FALSE,
      'tag' => '',
      // Weitere data-*-Attribute für neue Umami-Funktionen, je Zeile "data-name=wert".
      'extra_attributes' => [],
      // Zusätzliche Skripte (z. B. ein späterer Recorder/Heatmap-Tracker), je mit eigenen Attributen.
      'extra_scripts' => [],
    ],
    'news' => [
      'intro' => 'Was hinter den Kulissen passiert: Aufrufe, Probenluft und Geschichten aus dem Schlosspark.',
      'instagram_hint' => 'Kurzes aus den Proben zeigen wir zuerst auf',
    ],
  ];

  /**
   * Liefert alle Einstellungen, ergänzt um Standardwerte.
   */
  public static function all(): array {
    $stored = \Drupal::config('sommertheater.settings')->get('theater') ?? [];
    return self::merge(self::DEFAULTS, is_array($stored) ? $stored : []);
  }

  /**
   * Liefert einen Bereich, z. B. "analytics".
   */
  public static function get(string $section): array {
    return self::all()[$section] ?? [];
  }

  /**
   * Cache-Tags, damit Seiten nach dem Speichern neu gerendert werden.
   */
  public static function cacheTags(): array {
    return ['config:sommertheater.settings'];
  }

  /**
   * Basis-URL des Mitgliederbereichs ohne Schrägstrich am Ende.
   */
  public static function memberBaseUrl(): string {
    return rtrim((string) (self::get('member')['base_url'] ?? '') ?: self::DEFAULT_MEMBER_BASE_URL, '/');
  }

  /**
   * Schreibt Mitgliederbereichs-URLs auf die eingestellte Basis-URL um.
   */
  public static function rewriteMemberUrl(string $url): string {
    $base = self::memberBaseUrl();
    if ($base !== self::DEFAULT_MEMBER_BASE_URL && str_starts_with($url, self::DEFAULT_MEMBER_BASE_URL . '/')) {
      return $base . substr($url, strlen(self::DEFAULT_MEMBER_BASE_URL));
    }
    return $url;
  }

  /**
   * Führt gespeicherte Werte über die Standardwerte; Listen werden ersetzt, nicht gemischt.
   */
  private static function merge(array $defaults, array $stored): array {
    foreach ($stored as $key => $value) {
      if (is_array($value) && isset($defaults[$key]) && is_array($defaults[$key]) && !array_is_list($defaults[$key]) && $defaults[$key] !== []) {
        $defaults[$key] = self::merge($defaults[$key], $value);
      }
      elseif ($value !== NULL) {
        $defaults[$key] = $value;
      }
    }
    return $defaults;
  }

  /**
   * Setzt Werte (Teilbaum) und speichert; unbekannte Schlüssel werden verworfen.
   *
   * @return array
   *   Die neuen, vollständigen Einstellungen.
   */
  public static function save(array $changes): array {
    $changes = self::filterKnown($changes, self::DEFAULTS);
    $config = \Drupal::configFactory()->getEditable('sommertheater.settings');
    $current = $config->get('theater') ?? [];
    $config->set('theater', self::merge(is_array($current) ? $current : [], $changes))->save();
    return self::all();
  }

  /**
   * Entfernt Schlüssel, die es in DEFAULTS nicht gibt.
   */
  private static function filterKnown(array $values, array $defaults): array {
    $result = [];
    foreach ($values as $key => $value) {
      if (!array_key_exists($key, $defaults)) {
        continue;
      }
      $default = $defaults[$key];
      if (is_array($default) && !array_is_list($default) && $default !== []) {
        $result[$key] = is_array($value) ? self::filterKnown($value, $default) : $default;
      }
      else {
        $result[$key] = $value;
      }
    }
    return $result;
  }

}
