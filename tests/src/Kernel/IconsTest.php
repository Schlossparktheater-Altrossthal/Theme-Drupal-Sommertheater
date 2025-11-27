<?php

declare(strict_types=1);

namespace Drupal\Tests\mercury\Kernel;

use Drupal\Core\Extension\ThemeExtensionList;
use Drupal\Core\Theme\Icon\Plugin\IconPackManagerInterface;
use Drupal\KernelTests\KernelTestBase;
use Drupal\Tests\mercury\Traits\MercuryTestTrait;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\TestWith;

/**
 * Tests that all of Mercury's icons are discoverable.
 */
#[Group('mercury')]
final class IconsTest extends KernelTestBase {

  use MercuryTestTrait;

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['system'];

  /**
   * Tests that all Mercury icons are discoverable.
   */
  #[TestWith(['phosphor'])]
  public function testIconsAreDiscoverable(string $group): void {
    $this->setUpMercury();

    $icons = $this->container->get(IconPackManagerInterface::class)
      ->getIcons();

    $icon_dir = implode('/', [
      $this->getDrupalRoot(),
      $this->container->get(ThemeExtensionList::class)->getPath('mercury'),
      'icons/' . $group,
    ]);
    $dir = opendir($icon_dir);
    $this->assertIsResource($dir);

    while ($item = readdir($dir)) {
      if (str_starts_with($item, '.')) {
        continue;
      }
      $this->assertStringEndsWith('.svg', $item);
      $id = "$group:" . substr($item, 0, -4);
      $this->assertSame($icon_dir . '/' . $item, $icons[$id]['absolute_path']);
    }
    closedir($dir);
  }

}
