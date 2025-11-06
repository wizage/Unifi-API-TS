#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Fix relative imports to add .js extension
  const fixedContent = content.replace(
    /from\s+['"](\.[^'"]*?)['"];?/g,
    (match, importPath) => {
      // Don't add .js if it already has an extension
      if (path.extname(importPath)) {
        return match;
      }
      // If it's a directory import, add /index.js
      const fullPath = path.resolve(path.dirname(filePath), importPath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        return match.replace(importPath, importPath + '/index.js');
      }
      return match.replace(importPath, importPath + '.js');
    }
  );
  
  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent);
    console.log(`Fixed imports in: ${filePath}`);
  }
}

function fixImportsInDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      fixImportsInDirectory(itemPath);
    } else if (item.endsWith('.js')) {
      fixImportsInFile(itemPath);
    }
  }
}

// Fix imports in the ESM build
const esmDir = path.join(__dirname, '../dist/esm');
if (fs.existsSync(esmDir)) {
  fixImportsInDirectory(esmDir);
  console.log('ESM imports fixed!');
} else {
  console.log('ESM directory not found');
}