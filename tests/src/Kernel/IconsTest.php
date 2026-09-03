<?php

declare(strict_types=1);

namespace Drupal\Tests\sommertheater\Kernel;

use Drupal\Core\Extension\ThemeExtensionList;
use Drupal\Core\Theme\Icon\Plugin\IconPackManagerInterface;
use Drupal\KernelTests\KernelTestBase;
use Drupal\Tests\sommertheater\Traits\SommertheaterTestTrait;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that all of Sommertheater's icons are discoverable.
 */
#[Group('sommertheater')]
#[RunTestsInSeparateProcesses]
final class IconsTest extends KernelTestBase {

  use SommertheaterTestTrait;

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['system'];

  /**
   * Tests that all Sommertheater icons are discoverable.
   */
  public function testIconsAreDiscoverable(): void {
    $this->setUpSommertheater();

    $icons = $this->container->get(IconPackManagerInterface::class)
      ->getIcons();

    $icon_dir = implode('/', [
      $this->root,
      $this->container->get(ThemeExtensionList::class)->getPath('sommertheater'),
      'icons/phosphor',
    ]);
    $dir = opendir($icon_dir);
    $this->assertIsResource($dir);

    while ($item = readdir($dir)) {
      if (str_starts_with($item, '.')) {
        continue;
      }
      $this->assertStringEndsWith('.svg', $item);
      $id = 'phosphor:' . substr($item, 0, -4);
      $this->assertSame($icon_dir . '/' . $item, $icons[$id]['absolute_path']);
    }
    closedir($dir);
  }

}
