<?php

declare(strict_types=1);

namespace Drupal\Tests\mercury\Functional;

use Drupal\Component\Serialization\Yaml;
use Drupal\Core\Extension\ThemeInstallerInterface;
use Drupal\Tests\BrowserTestBase;
use Drupal\views\Entity\View;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests that Mercury properly applies snapping classes to certain views.
 */
#[Group('mercury')]
#[CoversFunction('mercury_preprocess_views_view')]
#[CoversFunction('mercury_preprocess_views_view_unformatted')]
final class ViewsSnapTest extends BrowserTestBase {

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'node',
    'views',
    // Mercury module dependencies.
    'twig_field_value',
    'twig_tweak',
  ];

  /**
   * Tests that Mercury adds snapping classes to certain views.
   */
  public function testSnapClassesAreAdded(): void {
    $this->container->get(ThemeInstallerInterface::class)->install(['mercury']);
    $this->config('system.theme')->set('default', 'mercury')->save();

    $view = file_get_contents(__DIR__ . '/../../fixtures/views.view.snap_test.yml');
    $view = Yaml::decode($view);
    $view = View::create($view);
    $view->save();
    // Rebuild the router so that we can visit the view.
    $this->container->get('router.builder')->rebuild();

    $node_type = $this->drupalCreateContentType()->id();
    /** @var \Drupal\node\NodeInterface[] $content */
    $content = [];
    for ($i = 0; $i < 3; $i++) {
      $content[] = $this->drupalCreateNode(['type' => $node_type]);
    }

    // Ensure all the content appears in the view.
    $this->drupalGet('/snap-test');
    $assert_session = $this->assertSession();
    $assert_session->statusCodeEquals(200);
    foreach ($content as $node) {
      $assert_session->linkExists($node->getTitle());
    }

    // The view container should have the view-snap class. We don't care about
    // the additional Tailwind utility classes; they are not relevant to this
    // test. If the view-snap class is present, we know the template's logic is
    // correct. Each item should have the correct classes too, relative to their
    // position in the list.
    $items = $assert_session->elementExists('css', '.view-content.view-snap')
      ->findAll('css', '.views-row.snap-start');
    $this->assertCount(3, $items);
    $this->assertTrue($items[0]->hasClass('snap-first'));
    $this->assertFalse($items[1]->hasClass('snap-first'));
    $this->assertFalse($items[1]->hasClass('snap-last'));
    $this->assertTrue($items[2]->hasClass('snap-last'));

    // If the view is removed from the list of views that should snap, all those
    // classes should be gone.
    $view->set('tag', '')->save();
    $this->getSession()->reload();
    $assert_session->elementNotExists('css', '.view-snap');
    $assert_session->elementNotExists('css', '.snap-start');
    // Confirm that the non-snapping wrapper is there.
    $assert_session->elementsCount('css', '.view-content.container.mx-auto .views-row', 3);
  }

}
