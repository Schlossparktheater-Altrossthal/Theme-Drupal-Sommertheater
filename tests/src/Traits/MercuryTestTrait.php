<?php

declare(strict_types=1);

namespace Drupal\Tests\mercury\Traits;

use Drupal\Core\Extension\ModuleInstallerInterface;
use Drupal\Core\Extension\ThemeInstallerInterface;
use Drupal\KernelTests\KernelTestBase;
use Drupal\Tests\BrowserTestBase;

/**
 * Provides helper methods for Mercury's tests.
 *
 * @internal
 *   This is an internal part of Mercury and may be changed or removed at any
 *   time without warning. External code should not touch this trait.
 */
trait MercuryTestTrait {

  /**
   * Installs Mercury and its dependencies, and makes it the default theme.
   */
  private function setUpMercury(): void {
    assert($this instanceof BrowserTestBase || $this instanceof KernelTestBase);

    $this->container->get(ModuleInstallerInterface::class)->install(['cva']);
    $this->container = $this->container->get('kernel')->getContainer();

    $this->container->get(ThemeInstallerInterface::class)->install(['mercury']);
    $this->container = $this->container->get('kernel')->getContainer();

    $this->config('system.theme')->set('default', 'mercury')->save();
  }

}
