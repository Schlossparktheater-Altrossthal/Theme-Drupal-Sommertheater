<?php

declare(strict_types=1);

namespace Drupal\Tests\mercury\Functional;

use Drupal\Core\Extension\ThemeInstallerInterface;
use Drupal\Core\Theme\ComponentPluginManager;
use Drupal\experience_builder\Entity\Component;
use Drupal\Tests\BrowserTestBase;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests Mercury's compatibility with Experience Builder.
 */
#[Group('mercury')]
class XbCompatibilityTest extends BrowserTestBase {

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'experience_builder',
    // Mercury module dependencies.
    'twig_field_value',
    'twig_tweak',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $theme_installer = $this->container->get(ThemeInstallerInterface::class);
    assert($theme_installer instanceof ThemeInstallerInterface);
    $theme_installer->install(['mercury']);
  }

  /**
   * Tests that all Mercury SDCs are compatible with Experience Builder.
   */
  public function testMercuryComponentsAreCompatibleWithXb(): void {
    $component_manager = $this->container->get(ComponentPluginManager::class);
    assert($component_manager instanceof ComponentPluginManager);
    // Make XB update all component entities. If there are any invalid SDCs,
    // this should fail hard.
    $component_manager->clearCachedDefinitions();
    $component_manager->getDefinitions();

    // Confirm that components for Mercury SDCs were generated.
    $mercury_component_entities = array_filter(
      array_keys(Component::loadMultiple()),
      fn (string $id): bool => str_starts_with($id, 'sdc.mercury.'),
    );
    $this->assertNotEmpty($mercury_component_entities);
  }

}
