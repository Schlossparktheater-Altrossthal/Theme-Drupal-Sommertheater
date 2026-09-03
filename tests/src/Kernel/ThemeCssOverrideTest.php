<?php

declare(strict_types=1);

namespace Drupal\Tests\sommertheater\Kernel;

use Drupal\Core\Asset\LibraryDiscoveryInterface;
use Drupal\Core\Cache\CacheCollectorInterface;
use Drupal\Core\Extension\ThemeExtensionList;
use Drupal\KernelTests\KernelTestBase;
use Drupal\sommertheater\Hook\ThemeHooks;
use Drupal\Tests\sommertheater\Traits\SommertheaterTestTrait;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\TestWith;

/**
 * Tests overriding Sommertheater's theme.css.
 */
#[Group('sommertheater')]
#[CoversMethod(ThemeHooks::class, 'alterLibraryInfo')]
#[RunTestsInSeparateProcesses]
final class ThemeCssOverrideTest extends KernelTestBase {

  use SommertheaterTestTrait;

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['system'];

  /**
   * Tests that Sommertheater's CSS can be overridden.
   */
  #[TestWith(['theme.css'])]
  #[TestWith(['fonts.css'])]
  public function testThemeCssCanBeOverridden(string $file_name): void {
    $this->setUpSommertheater();
    $original_css = $this->container->get(ThemeExtensionList::class)->getPath('sommertheater') . '/src/' . $file_name;
    $this->assertFileExists($original_css);

    $discovery = $this->container->get(LibraryDiscoveryInterface::class);
    assert($discovery instanceof LibraryDiscoveryInterface && $discovery instanceof CacheCollectorInterface);

    // Ensure that the original theme.css is loaded by default.
    $libraries = $discovery->getLibrariesByExtension('sommertheater');
    $all_css = array_column($libraries['global']['css'], 'data');
    $this->assertNotContains($file_name, $all_css);
    $this->assertContains($original_css, array_column($libraries['global']['css'], 'data'));

    // Put an override file in the "web root".
    $property = new \ReflectionProperty(ThemeHooks::class, 'appRoot');
    $property->setValue(NULL, 'public://');
    touch("public://$file_name");
    $discovery->clear();

    // Confirm that the override is now used.
    $libraries = $discovery->getLibrariesByExtension('sommertheater');
    $all_css = array_column($libraries['global']['css'], 'data');
    $this->assertContains($file_name, $all_css);
    $this->assertNotContains($original_css, $all_css);
  }

}
