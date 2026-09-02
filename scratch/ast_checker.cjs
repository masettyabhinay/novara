const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

function assert(condition, msg) {
  if (!condition) {
    console.error(`❌ AST Check Failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function run() {
  console.log('Running AST & Syntax Sanity Check with Babel across all source files...');

  const srcDir = 'src';
  const serverDir = 'server';

  const getAllFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllFiles(fullPath));
      } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(fullPath);
      }
    });
    return results;
  };

  const files = [...getAllFiles(srcDir), ...getAllFiles(serverDir)];
  assert(files.length > 10, `Found ${files.length} JavaScript/React source files`);

  let scannedCount = 0;
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    assert(content.length > 0, `File ${f} is non-empty`);
    
    try {
      const ast = parser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx']
      });
      assert(ast && ast.type === 'File', `File ${f} compiled into valid AST`);
    } catch (parseErr) {
      assert(false, `File ${f} AST parse error: ${parseErr.message}`);
    }
    scannedCount++;
  }

  assert(scannedCount === files.length, `All ${scannedCount} source files passed Babel AST checks`);
  console.log(`🎉 AST & Syntax Integrity Check Passed (${scannedCount} files verified)!\n`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
