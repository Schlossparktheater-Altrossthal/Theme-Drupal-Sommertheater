\*\*\*\*# Release process

## How to do a release

### 1. Triggering the release

1. Go to https://git.drupalcode.org/project/mercury/-/tags/new.
2. Create a new tag from the `1.x` branch.
3. Name the tag according to the new version, prefixed with a `v` (for example,
   `v1.0.4`).
4. Track the resulting pipeline at
   https://git.drupalcode.org/project/mercury/-/pipelines. Make sure it succeeds.

### 2. Publishing on Drupal.org

After the pipeline succeeds, it automatically creates and pushes a new
unprefixed tag (without `v`) to the repository. Drupal.org reads this tag from
the repository and makes it available in the release publish form.

Publish the release following the
[usual instructions](https://www.drupal.org/docs/develop/git/git-for-drupal-project-maintainers/creating-a-project-release#s-publishing-a-release).
