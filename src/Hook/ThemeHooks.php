<?php

declare(strict_types=1);

namespace Drupal\mercury\Hook;

use Drupal\Component\Utility\NestedArray;
use Drupal\Core\Breadcrumb\ChainBreadcrumbBuilderInterface;
use Drupal\Core\Cache\CacheCollectorInterface;
use Drupal\Core\Controller\TitleResolverInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Extension\ThemeExtensionList;
use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Messenger\MessengerTrait;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\mercury\RenderCallbacks;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\node\NodeInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Contains hook implementations for Mercury.
 */
final class ThemeHooks {

  use MessengerTrait;
  use StringTranslationTrait;

  /**
   * The directory where overridden CSS should go.
   *
   * @var string
   */
  public readonly string $cssDirectory;

  public function __construct(
    private readonly ThemeSettingsProvider $themeSettings,
    private readonly RequestStack $requestStack,
    private readonly ThemeExtensionList $themeList,
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly RouteMatchInterface $routeMatch,
    private readonly TitleResolverInterface $titleResolver,
    private readonly ChainBreadcrumbBuilderInterface $breadcrumb,
    private readonly ModuleHandlerInterface $moduleHandler,
    #[Autowire(service: 'library.discovery')] private readonly CacheCollectorInterface $libraryDiscovery,
    private readonly FileSystemInterface $fileSystem,
    #[Autowire(param: 'site.path')] string $siteDirectory,
  ) {
    $directory = $siteDirectory;
    if (drupal_valid_test_ua()) {
      $directory .= '/css';
    }
    $this->cssDirectory = $directory;
  }

  /**
   * Implements hook_element_info_alter().
   */
  #[Hook('element_info_alter')]
  public function alterElementInfo(array &$info): void {
    $info['component']['#pre_render'][] = [RenderCallbacks::class, 'preRenderComponent'];
  }

  /**
   * Implements hook_library_info_alter().
   */
  #[Hook('library_info_alter')]
  public function alterLibraryInfo(array &$libraries, string $extension): void {
    $override = static function (string $name, string $replacement) use (&$libraries): void {
      $old_parents = ['global', 'css', 'theme', $name];
      $new_parents = [...array_slice($old_parents, 0, -1), $replacement];
      $css_settings = NestedArray::getValue($libraries, $old_parents);
      NestedArray::setValue($libraries, $new_parents, $css_settings);
      NestedArray::unsetValue($libraries, $old_parents);
    };
    if ($extension === 'mercury') {
      if (file_exists($this->cssDirectory . '/theme.css')) {
        $override('src/theme.css', '/' . $this->cssDirectory . '/theme.css');
      }
      // For backwards compatibility, also check for overrides in the web root.
      // @todo Deprecate for removal in Mercury 2.x.
      elseif (file_exists('theme.css')) {
        $override('theme.css', '/theme.css');
      }

      if (file_exists($this->cssDirectory . '/fonts.css')) {
        $override('src/fonts.css', '/' . $this->cssDirectory . '/fonts.css');
      }
      // For backwards compatibility, also check for overrides in the web root.
      // @todo Deprecate for removal in Mercury 2.x.
      elseif (file_exists('fonts.css')) {
        $override('fonts.css', '/fonts.css');
      }
    }
  }

  /**
   * Implements hook_form_FORM_ID_alter().
   */
  #[Hook('form_system_theme_settings_alter')]
  public function themeSettingsFormAlter(array &$form): void {
    $form['scheme'] = [
      '#type' => 'radios',
      '#title' => t('Color scheme'),
      '#default_value' => $this->themeSettings->getSetting('scheme'),
      '#options' => [
        'light' => t('Light'),
        'dark' => t('Dark'),
      ],
    ];

    $form['css'] = [
      '#type' => 'details',
      '#title' => $this->t('Edit CSS (advanced)'),
    ];

    $library = $this->libraryDiscovery->getLibraryByName('mercury', 'global');
    if ($library && is_writable($this->cssDirectory)) {
      foreach ($library['css'] ?? [] as ['data' => $file]) {
        if (basename($file) === 'theme.css') {
          $form['css']['theme_css'] = [
            '#type' => 'textarea',
            '#title' => $this->t('Colors'),
            '#default_value' => file_get_contents($file),
            '#rows' => 15,
            '#description' => $this->t('This will be saved to <code>@dir/theme.css</code>.', ['@dir' => $this->cssDirectory]),
          ];
        }
        elseif (basename($file) === 'fonts.css') {
          $form['css']['fonts_css'] = [
            '#type' => 'textarea',
            '#title' => $this->t('Fonts'),
            '#default_value' => file_get_contents($file),
            '#rows' => 15,
            '#description' => $this->t('This will be saved to <code>@dir/fonts.css</code>.', ['@dir' => $this->cssDirectory]),
          ];
        }
      }
      $form['actions']['submit']['#submit'][] = $this->saveCss(...);
    }
    else {
      $form['css']['#description'] = $this->t('Disabled because the <code>@dir</code> directory is not writable.', ['@dir' => $this->cssDirectory]);
    }

    $message = $this->t("See <code>@path</code> to learn how to customize Mercury's fonts, colors, and components.", [
      '@path' => $this->themeList->getPath('mercury') . '/CUSTOMIZING.md',
    ]);
    $this->messenger()->addMessage($message, 'info');
  }

  /**
   * Submit handler for the CSS editing textareas.
   */
  public function saveCss(array &$form, FormStateInterface $form_state): void {
    $files = [
      'theme_css' => $this->cssDirectory. '/theme.css',
      'fonts_css' => $this->cssDirectory . '/fonts.css',
    ];
    // If any of these files don't exist already, we'll need a cache clear.
    $clear_cache = array_any($files, fn (string $f): bool => !file_exists($f));

    foreach ($files as $form_key => $path) {
      print_r($form_state->getValue($form_key));
      file_put_contents($path, $form_state->getValue($form_key));
      // For safety's sake, always make the file non-executable.
      $this->fileSystem->chmod($path, 0644);
    }
    if ($clear_cache) {
      $this->libraryDiscovery->clear();
    }
    // We don't want these bleeding into configuration.
    $form_state->unsetValue('theme_css')->unsetValue('fonts_css');
  }

  /**
   * Implements template_preprocess_image_widget().
   */
  #[Hook('preprocess_image_widget')]
  public function preprocessImageWidget(array &$variables): void {
    $data = &$variables['data'];

    // This prevents image widget templates from rendering preview container
    // HTML to users that do not have permission to access these previews.
    // @todo revisit in https://drupal.org/node/953034
    // @todo revisit in https://drupal.org/node/3114318
    if (isset($data['preview']['#access']) && $data['preview']['#access'] === FALSE) {
      unset($data['preview']);
    }
  }

  /**
   * Implements template_preprocess_html().
   */
  #[Hook('preprocess_html')]
  public function preprocessHtml(array &$variables): void {
    $variables['scheme'] = $this->themeSettings->getSetting('scheme');
    // Get the theme base path for font preloading.
    $variables['mercury_path'] = $this->requestStack->getCurrentRequest()->getBasePath() . '/' . $this->themeList->getPath('mercury');
  }

  /**
   * Implements template_preprocess_page().
   */
  #[Hook('preprocess_page')]
  public function preprocessPage(array &$variables): void {
    // @see \Drupal\Core\Block\Plugin\Block\PageTitleBlock::build()
    $variables['title'] = [
      '#type' => 'page_title',
      '#title' => $variables['page']['#title'] ?? $this->titleResolver->getTitle(
        $this->requestStack->getCurrentRequest(),
        $this->routeMatch->getRouteObject(),
      ),
    ];

    // @see \Drupal\system\Plugin\Block\SystemBreadcrumbBlock::build()
    $variables['breadcrumb'] = $this->breadcrumb->build($this->routeMatch)
      ->toRenderable();

    $route_name = $this->routeMatch->getRouteName();
    if ($route_name === 'entity.canvas_page.canonical' || str_starts_with($this->routeMatch->getRouteObject()?->getPath() ?? '', '/canvas/')) {
      $variables['rendered_by_canvas'] = TRUE;
    }
    elseif ($route_name === 'entity.node.canonical' && $this->moduleHandler->moduleExists('canvas')) {
      $node = $this->routeMatch->getParameter('node');
      assert($node instanceof NodeInterface);

      $variables['rendered_by_canvas'] = (bool) $this->entityTypeManager->getStorage('content_template')
        ->getQuery()
        ->accessCheck(FALSE)
        ->count()
        ->condition('content_entity_type_id', 'node')
        ->condition('content_entity_type_bundle', $node->getType())
        ->condition('content_entity_type_view_mode', 'full')
        ->condition('status', TRUE)
        ->execute();
    }
    else {
      $variables['rendered_by_canvas'] = FALSE;
    }
  }

}
