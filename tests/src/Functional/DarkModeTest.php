<?php

declare(strict_types=1);

namespace Drupal\Tests\mercury\Functional;

use Behat\Mink\Element\ElementInterface;
use Drupal\Core\Extension\ThemeInstallerInterface;
use Drupal\Tests\BrowserTestBase;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests that Mercury can be toggled into and out of dark mode.
 */
#[Group('mercury')]
#[CoversFunction('mercury_preprocess_html')]
#[CoversFunction('mercury_form_system_theme_settings_alter')]
class DarkModeTest extends BrowserTestBase {

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
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

    $this->config('system.theme')->set('default', 'mercury')->save();
  }

  /**
   * Tests toggling Mercury into and out of dark mode.
   */
  public function testDarkMode(): void {
    $this->drupalGet('<front>');
    $assert_session = $this->assertSession();
    $assert_session->statusCodeEquals(200);

    // Dark mode is the default.
    $page = $this->getSession()->getPage();
    $body = $page->find('css', 'body');
    $this->assertInstanceOf(ElementInterface::class, $body);
    $this->assertTrue($body->hasClass('dark'));

    $account = $this->drupalCreateUser(['administer themes']);
    $this->drupalLogin($account);
    $this->drupalGet('/admin/appearance/settings/mercury');
    $page->uncheckField('Enable dark mode');
    $page->pressButton('Save configuration');
    $assert_session->statusMessageContains('The configuration options have been saved.');
    $this->drupalGet('<front>');
    $this->assertTrue($body->hasClass('light'));
    $this->assertFalse($body->hasClass('dark'));
  }

}
