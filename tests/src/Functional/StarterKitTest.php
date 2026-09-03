<?php

declare(strict_types=1);

namespace Drupal\Tests\sommertheater\Functional;

use Composer\InstalledVersions;
use Drupal\Core\Extension\ExtensionDiscovery;
use Drupal\Core\Extension\ThemeInstallerInterface;
use Drupal\Core\Theme\ComponentPluginManager;
use Drupal\Tests\BrowserTestBase;
use Drupal\Tests\sommertheater\Traits\SommertheaterTestTrait;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\IgnoreDeprecations;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use Symfony\Component\Finder\Finder;
use Symfony\Component\Finder\SplFileInfo;
use Symfony\Component\Process\PhpExecutableFinder;
use Symfony\Component\Process\Process;

/**
 * Tests that Sommertheater can be used as a starter kit.
 */
#[Group('sommertheater')]
#[IgnoreDeprecations]
#[RunTestsInSeparateProcesses]
final class StarterKitTest extends BrowserTestBase {

  use SommertheaterTestTrait;

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * Tests using Sommertheater as a starter kit with the `generate-theme` command.
   */
  public function testGenerateThemeFromSommertheater(): void {
    $this->setUpSommertheater();

    $path = uniqid($this->siteDirectory . '/themes/theme_');
    $theme_name = basename($path);

    // Prefer Composer's `dr` binary. When invoked from core, it can fail to
    // resolve the autoloader depending on the project layout.
    ['install_path' => $project_root] = InstalledVersions::getRootPackage();
    $dr = $project_root . '/vendor/bin/dr';
    $this->assertFileExists($dr);
    $command = [
      (new PhpExecutableFinder())->find(),
      $dr,
      'generate-theme',
      $theme_name,
      '--starterkit=sommertheater',
      '--path=' . dirname($path),
      '--no-interaction',
    ];
    $process = new Process($command, $this->getDrupalRoot());
    $process->mustRun();

    // We just effectively added a new extension, so reset ExtensionDiscovery's
    // internal static cache or the generated theme won't be found.
    $reflector = new \ReflectionProperty(ExtensionDiscovery::class, 'files');
    $reflector->setValue(NULL, []);

    // We should be able to install the theme without errors.
    $this->container->get(ThemeInstallerInterface::class)
      ->install([$theme_name]);
    // All of Sommertheater's SDCs should be available in the new theme, copied into
    // its own namespace.
    $component_manager = $this->container->get(ComponentPluginManager::class);
    $component_manager->clearCachedDefinitions();
    $component_definitions = $component_manager->getDefinitions();

    $finder = Finder::create()
      ->files()
      ->name('*.component.yml')
      ->in(__DIR__ . '/../../../components');

    $this->assertGreaterThan(0, count($finder));

    foreach ($finder as $file) {
      assert($file instanceof SplFileInfo);
      $name = $file->getBasename('.component.yml');
      $this->assertArrayHasKey("$theme_name:$name", $component_definitions);
    }

    // Confirm the NPM lock file doesn't have any unexpected name collisions.
    $package_lock = file_get_contents($path . '/package-lock.json');
    $this->assertIsString($package_lock);
    $this->assertSame(2, substr_count($package_lock, $theme_name));

    // The generated theme should not itself be a starter kit.
    $this->assertFileDoesNotExist("$path/$theme_name.starterkit.yml");
    // And it shouldn't include our CI configuration, or tests.
    $this->assertFileDoesNotExist("$path/.gitlab-ci.yml");
    $this->assertDirectoryDoesNotExist("$path/tests");
  }

}
