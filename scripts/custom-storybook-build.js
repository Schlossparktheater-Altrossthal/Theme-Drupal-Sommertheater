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
    
    // Get all component directories
    const componentDirs = await glob('./components/*/', { 
      ignore: ['node_modules/**'],
    });
    
    // Process each component directory
    for (const componentDir of componentDirs) {
      // Extract component name from path - keep full name without truncation
      const componentName = path.basename(path.resolve(componentDir));
      console.log(`Processing component: ${componentName}`);
      
      // Check if the component has an assets directory
      const assetsDir = path.join(componentDir, 'assets');
      let hasAssets = false;
      
      try {
        const assetsStat = await fs.stat(assetsDir);
        hasAssets = assetsStat.isDirectory();
      } catch (error) {
        // Assets directory doesn't exist, move to next component
        continue;
      }
      
      if (hasAssets) {
        // Create destination directory in public folder
        const destDir = path.join(publicComponentsDir, componentName, 'assets');
        await fs.mkdir(destDir, { recursive: true });
        
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
          console.log(`Copied: ${assetFile} -> ${destPath}`);
        }
      }
    }

    console.log('Custom Storybook build step completed successfully!');
  } catch (error) {
    console.error('Error in custom Storybook build step:', error);
    process.exit(1);
  }
}

run(); 