<?php

declare(strict_types=1);

namespace Drupal\Tests\mercury\Functional;

use Drupal\canvas\ComponentIncompatibilityReasonRepository;
use Drupal\Core\Theme\ComponentPluginManager;
use Drupal\Tests\BrowserTestBase;
use Drupal\Tests\mercury\Traits\MercuryTestTrait;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests Mercury's compatibility with Canvas.
 */
#[Group('mercury')]
#[RunTestsInSeparateProcesses]
class CanvasCompatibilityTest extends BrowserTestBase {

  use MercuryTestTrait;

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['canvas'];

  /**
   * Tests that all Mercury SDCs are compatible with Canvas.
   */
  public function testMercuryComponentsAreCompatibleWithCanvas(): void {
    $this->setUpMercury();

    $component_manager = $this->container->get(ComponentPluginManager::class);
    assert($component_manager instanceof ComponentPluginManager);
    // Make Canvas update all component entities. If there are any invalid SDCs,
    // this should fail hard.
    $component_manager->clearCachedDefinitions();
    // Only consider SDCs from Mercury.
    $definitions = array_filter(
      $component_manager->getDefinitions(),
      fn (array $definition): bool => $definition['provider'] === 'mercury',
    );

    ['sdc' => $why_not] = $this->container->get(ComponentIncompatibilityReasonRepository::class)
      ->getReasons();

    // Ignore components that we know are broken.
    unset(
      // These three components are used by the `menu-footer` Twig template, and
      // aren't meant to be used directly in Canvas.
      $definitions['mercury:menu-footer'],
      $definitions['mercury:menu-social'],
      $definitions['mercury:menu-utility'],
      // The `breadcrumb` component is used for styling core's breadcrumb, but
      // isn't meant to be used directly in Canvas.
      $definitions['mercury:breadcrumb'],
      // This is used to render views via templates, but is not meant to be
      // used directly in Canvas.
      $definitions['mercury:pager'],
    );

    foreach ($definitions as ['machineName' => $id]) {
      $key = "sdc.mercury.$id";
      $this->assertArrayNotHasKey($key, $why_not, implode(', ', $why_not[$key] ?? []));
    }
  }

}
