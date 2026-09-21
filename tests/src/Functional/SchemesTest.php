<?php

declare(strict_types=1);

namespace Drupal\Tests\sommertheater\Functional;

use Drupal\sommertheater\Hook\ThemeHooks;
use Drupal\Tests\BrowserTestBase;
use Drupal\Tests\sommertheater\Traits\SommertheaterTestTrait;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\TestWith;

/**
 * Tests that Sommertheater's color scheme can be changed by a setting.
 */
#[Group('sommertheater')]
#[CoversMethod(ThemeHooks::class, 'preprocessHtml')]
#[CoversMethod(ThemeHooks::class, 'themeSettingsFormAlter')]
#[RunTestsInSeparateProcesses]
class SchemesTest extends BrowserTestBase {

  use SommertheaterTestTrait;

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * Tests toggling Sommertheater into and out of a color scheme.
   */
  #[TestWith(['light', 'Light'])]
  #[TestWith(['dark', 'Dark'])]
  public function testColorScheme(string $scheme, string $label): void {
    $this->setUpSommertheater();

    $this->drupalGet('<front>');
    $assert_session = $this->assertSession();
    $assert_session->statusCodeEquals(200);

    $account = $this->drupalCreateUser(['administer themes']);
    $this->drupalLogin($account);
    $this->drupalGet('/admin/appearance/settings/sommertheater');
    $page = $this->getSession()->getPage();
    $page->findField($label)->selectOption($scheme);
    $page->pressButton('Save configuration');
    $assert_session->statusMessageContains('The configuration options have been saved.');
    $this->drupalGet('<front>');
    $html_element = $page->find('css', 'html');
    $class_attribute = $html_element->getAttribute('class');
    if ($scheme === 'dark') {
      $this->assertStringContainsString(
        'dark',
        $class_attribute,
        'The <html> element should have the dark class when dark scheme is selected.'
      );
    }
    else {
      $this->assertTrue(
        $class_attribute === NULL || !str_contains($class_attribute, 'dark'),
        'The <html> element should not have the dark class when light scheme is selected.'
      );
    }
  }

}
