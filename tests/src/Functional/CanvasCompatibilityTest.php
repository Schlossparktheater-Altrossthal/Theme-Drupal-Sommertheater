<?php

declare(strict_types=1);

namespace Drupal\Tests\sommertheater\Functional;

use Drupal\canvas\ComponentIncompatibilityReasonRepository;
use Drupal\Core\Theme\ComponentPluginManager;
use Drupal\Tests\BrowserTestBase;
use Drupal\Tests\sommertheater\Traits\SommertheaterTestTrait;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests Sommertheater's compatibility with Canvas.
 */
#[Group('sommertheater')]
#[RunTestsInSeparateProcesses]
class CanvasCompatibilityTest extends BrowserTestBase {

  use SommertheaterTestTrait;

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['canvas'];

  /**
   * Tests that all Sommertheater SDCs are compatible with Canvas.
   */
  public function testSommertheaterComponentsAreCompatibleWithCanvas(): void {
    $this->setUpSommertheater();

    $component_manager = $this->container->get(ComponentPluginManager::class);
    assert($component_manager instanceof ComponentPluginManager);
    // Make Canvas update all component entities. If there are any invalid SDCs,
    // this should fail hard.
    $component_manager->clearCachedDefinitions();
    // Only consider SDCs from Sommertheater.
    $definitions = array_filter(
      $component_manager->getDefinitions(),
      fn (array $definition): bool => $definition['provider'] === 'sommertheater',
    );

    $why_not = $this->container->get(ComponentIncompatibilityReasonRepository::class)
      ->getReasons();
    $this->assertArrayNotHasKey('sdc', $why_not);
  }

}
