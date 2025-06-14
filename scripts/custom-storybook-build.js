#!/usr/bin/env node

/**
 * Custom build step for Storybook
 *
 * This script runs before the Storybook build process and can perform
 * any pre-processing or additional build steps needed.
 */

console.log('Starting custom Storybook build step...');

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

async function run() {
  try {
    console.log('Copying component assets to public folder...');

    // Create public/components directory if it doesn't exist
    const publicComponentsDir = path.resolve('./public/components');
    await fs.mkdir(publicComponentsDir, { recursive: true });

    // Copy lib folder to public directory
    await copyLibFolder();

    // Get all component directories
    const componentDirs = await glob('./components/*/', {
      ignore: ['node_modules/**'],
    });

    // Process each component directory
    for (const componentDir of componentDirs) {
      // Extract component name from path - keep full name without truncation
      const componentName = path.basename(path.resolve(componentDir));
      console.log(`Processing component: ${componentName}`);

      let componentDestDirCreated = false;

      // Check if the component has an assets directory
      const assetsDir = path.join(componentDir, 'assets');
      let hasAssets = false;

      try {
        const assetsStat = await fs.stat(assetsDir);
        hasAssets = assetsStat.isDirectory();
      } catch (error) {
        // Assets directory doesn't exist, that's fine
      }

      if (hasAssets) {
        // Create destination directory in public folder
        const destDir = path.join(publicComponentsDir, componentName, 'assets');
        await fs.mkdir(destDir, { recursive: true });
        componentDestDirCreated = true;

        // Copy all files from assets directory to public folder
        const assetFiles = await glob(`${assetsDir}/**/*`, {
          nodir: true,
        });

        for (const assetFile of assetFiles) {
          const relativePath = path.relative(assetsDir, assetFile);
          const destPath = path.join(destDir, relativePath);

          // Ensure destination directory exists
          await fs.mkdir(path.dirname(destPath), { recursive: true });

          // Copy the file
          await fs.copyFile(assetFile, destPath);
          console.log(`Copied asset: ${assetFile} -> ${destPath}`);
        }
      }

      // Check for JavaScript files in component directory
      const jsFiles = await glob(path.join(componentDir, '*.js'), {
        nodir: true,
      });

      if (jsFiles.length > 0) {
        // Create component destination directory if not already created
        if (!componentDestDirCreated) {
          const componentDestDir = path.join(
            publicComponentsDir,
            componentName
          );
          await fs.mkdir(componentDestDir, { recursive: true });
        }

        const componentDestDir = path.join(publicComponentsDir, componentName);

        for (const jsFile of jsFiles) {
          const fileName = path.basename(jsFile);
          const destPath = path.join(componentDestDir, fileName);

          // Copy the JS file
          await fs.copyFile(jsFile, destPath);
          console.log(`Copied JS: ${jsFile} -> ${destPath}`);
        }
      }
    }

    console.log('Custom Storybook build step completed successfully!');
  } catch (error) {
    console.error('Error in custom Storybook build step:', error);
    process.exit(1);
  }
}

/**
 * Copy the lib folder to the public directory
 */
async function copyLibFolder() {
  try {
    const libDir = path.resolve('./lib');
    const publicLibDir = path.resolve('./public/lib');

    // Check if lib directory exists
    const libStat = await fs.stat(libDir);
    if (!libStat.isDirectory()) {
      console.log('lib directory not found, skipping...');
      return;
    }

    console.log('Copying lib folder to public directory...');

    // Create public/lib directory
    await fs.mkdir(publicLibDir, { recursive: true });

    // Get all files in lib directory recursively
    const libFiles = await glob(`${libDir}/**/*`, {
      nodir: true,
    });

    // Copy each file
    for (const libFile of libFiles) {
      const relativePath = path.relative(libDir, libFile);
      const destPath = path.join(publicLibDir, relativePath);

      // Ensure destination directory exists
      await fs.mkdir(path.dirname(destPath), { recursive: true });

      // Copy the file
      await fs.copyFile(libFile, destPath);
      console.log(`Copied lib file: ${libFile} -> ${destPath}`);
    }

    console.log('lib folder copied successfully!');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('lib directory not found, skipping...');
    } else {
      console.error('Error copying lib folder:', error);
      throw error;
    }
  }
}

run();
