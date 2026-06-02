<?php

namespace Drupal\Tests\mercury\Functional;

use Drupal\Tests\BrowserTestBase;
use Drupal\Tests\mercury\Traits\MercuryTestTrait;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests overriding Mercury's CSS in the UI.
 */
#[Group('mercury')]
#[RunTestsInSeparateProcesses]
class OverrideCssTest extends BrowserTestBase {

  use MercuryTestTrait;

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  public function testCssEditInUi(): void {
    $this->setUpMercury();

    $directory = $this->siteDirectory . '/css';
    mkdir($directory);
    $this->assertDirectoryIsWritable($directory);

    chmod($directory, 0000);
    $this->assertDirectoryIsNotWritable($directory);

    $account = $this->createUser(['administer themes']);
    $this->drupalLogin($account);
    $this->drupalGet('/admin/appearance/settings/mercury');

    $assert_session = $this->assertSession();
    $assert_session->statusCodeEquals(200);
    $assert_session->pageTextContains("Disabled because the $directory directory is not writable.");
    $assert_session->fieldNotExists('theme_css');
    $assert_session->fieldNotExists('fonts_css');

    chmod($directory, 0777);
    $this->assertDirectoryIsWritable($directory);
    $session = $this->getSession();
    $session->reload();

    $page = $session->getPage();
    $page->fillField('theme_css', '/* My theme.css override */');
    $page->fillField('fonts_css', '/* My fonts.css override */');
    $page->pressButton('Save configuration');
    $assert_session->statusCodeEquals(200);
    $this->assertFileExists($directory . '/theme.css');
    $this->assertFileExists($directory . '/fonts.css');
    $assert_session->fieldValueEquals('theme_css', '/* My theme.css override */');
    $assert_session->fieldValueEquals('fonts_css', '/* My fonts.css override */');

    // Nothing should have leaked into configuration.
    $settings = $this->config('mercury.settings');
    $this->assertNull($settings->get('theme_css'));
    $this->assertNull($settings->get('fonts_css'));
  }

}
