<?php

declare(strict_types=1);

namespace Drupal\Tests\mercury\Kernel;

use Drupal\Core\Asset\LibraryDiscoveryInterface;
use Drupal\Core\Cache\CacheCollectorInterface;
use Drupal\Core\Extension\ThemeExtensionList;
use Drupal\KernelTests\KernelTestBase;
use Drupal\mercury\Hook\ThemeHooks;
use Drupal\Tests\mercury\Traits\MercuryTestTrait;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\TestWith;

/**
 * Tests overriding Mercury's theme.css.
 */
#[Group('mercury')]
#[CoversMethod(ThemeHooks::class, 'alterLibraryInfo')]
#[RunTestsInSeparateProcesses]
final class ThemeCssOverrideTest extends KernelTestBase {

  use MercuryTestTrait;

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['system'];

  /**
   * Tests that Mercury's CSS can be overridden.
   */
  #[TestWith(['theme.css'])]
  #[TestWith(['fonts.css'])]
  public function testThemeCssCanBeOverridden(string $file_name): void {
    $this->setUpMercury();
    $original_css = $this->container->get(ThemeExtensionList::class)->getPath('mercury') . '/src/' . $file_name;
    $this->assertFileExists($original_css);

    $discovery = $this->container->get(LibraryDiscoveryInterface::class);
    assert($discovery instanceof LibraryDiscoveryInterface && $discovery instanceof CacheCollectorInterface);

    // Ensure that the original theme.css is loaded by default.
    $libraries = $discovery->getLibrariesByExtension('mercury');
    $all_css = array_column($libraries['global']['css'], 'data');
    $this->assertNotContains($file_name, $all_css);
    $this->assertContains($original_css, array_column($libraries['global']['css'], 'data'));

    // Put an override file where CSS overrides should go.
    $directory = \Drupal::service(ThemeHooks::class)->cssDirectory;
    mkdir($directory, recursive: TRUE);
    touch($directory . '/' . $file_name);
    $discovery->clear();

    // Confirm that the override is now used.
    $libraries = $discovery->getLibrariesByExtension('mercury');
    $all_css = array_column($libraries['global']['css'], 'data');
    $this->assertContains($file_name, $all_css);
    $this->assertNotContains($original_css, $all_css);
  }

}
