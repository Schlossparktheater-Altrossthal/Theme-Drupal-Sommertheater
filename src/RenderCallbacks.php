<?php

declare(strict_types=1);

namespace Drupal\sommertheater;

use Drupal\Core\Security\TrustedCallbackInterface;

/**
 * Implements internal callbacks to help with rendering certain SDCs.
 */
final class RenderCallbacks implements TrustedCallbackInterface {

  /**
   * Pre-render callback for SDC elements.
   *
   * @param array $element
   *   The element being rendered.
   *
   * @return array
   *   The modified element.
   */
  public static function preRenderComponent(array $element): array {
    // In the hero-blog component, convert a UNIX timestamp into a string that
    // can be passed to strtotime() by Twig's date filter.
    if ($element['#component'] === 'sommertheater:hero-blog' && isset($element['#props']['date']) && is_int($element['#props']['date'])) {
      $element['#props']['date'] = date('Y-m-d', $element['#props']['date']);
    }
    // Gespeicherte Daten-URLs (spielplan, countdown, stat, ticket-booking) auf
    // die eingestellte Basis-URL des Mitgliederbereichs umschreiben.
    $default_paths = [
      'sommertheater:spielplan' => '/api/public/saison',
      'sommertheater:ticket-booking' => '/api/public/karten',
    ];
    if (empty($element['#props']['api_url']) && isset($default_paths[$element['#component']])) {
      $element['#props']['api_url'] = TheaterSettings::memberBaseUrl() . $default_paths[$element['#component']];
    }
    if (isset($element['#props']['api_url']) && is_string($element['#props']['api_url'])) {
      $element['#props']['api_url'] = TheaterSettings::rewriteMemberUrl($element['#props']['api_url']);
      $element['#cache']['tags'] = array_merge($element['#cache']['tags'] ?? [], TheaterSettings::cacheTags());
    }
    return $element;
  }

  /**
   * {@inheritdoc}
   */
  public static function trustedCallbacks(): array {
    return ['preRenderComponent'];
  }

}
