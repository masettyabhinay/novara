const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getFiles('src');
const lucide = require('lucide-react');
const lucideSet = new Set(Object.keys(lucide));

let missingTotal = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Collect all imports in file
  const fileImports = new Set();
  const importRegex = /import\s+(?:(\w+)|\{([^}]+)\}|(?:\*\s+as\s+(\w+)))\s+from\s+['"][^'"]+['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    if (match[1]) fileImports.add(match[1].trim());
    if (match[2]) {
      match[2].split(',').forEach(part => {
        const item = part.trim().split(/\s+as\s+/);
        const importedName = (item[1] || item[0]).trim();
        if (importedName) fileImports.add(importedName);
      });
    }
    if (match[3]) fileImports.add(match[3].trim());
  }

  // Find all JSX tags
  const jsxTagRegex = /<([A-Z][A-Za-z0-9]+)(?=[\s/>])/g;
  let tagMatch;
  while ((tagMatch = jsxTagRegex.exec(content)) !== null) {
    const tag = tagMatch[1];
    if (lucideSet.has(tag) && !fileImports.has(tag)) {
      // Check if defined in file (const X =, function X, class X)
      const defRegex = new RegExp(`\\b(?:const|let|var|function|class)\\s+${tag}\\b`);
      if (!defRegex.test(content)) {
        console.log(`[MISSING LUCIDE ICON] ${file}: <${tag}> is used but NOT imported or defined!`);
        missingTotal++;
      }
    }
  }
}

console.log(`Scan completed. Total missing lucide icons found: ${missingTotal}`);
