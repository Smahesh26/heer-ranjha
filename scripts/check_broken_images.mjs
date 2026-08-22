import fs from 'fs';
import path from 'path';

function findJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findJsFiles(filePath));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = [...findJsFiles('components'), ...findJsFiles('app')];
const imgRegex = /\/images\/[a-zA-Z0-9_\-\.\/]+/g;

console.log('Checking image references across all JSX/JS files...');
let brokenCount = 0;

files.forEach(file => {
  if (file.includes('products.json')) return;
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(imgRegex);
  if (matches) {
    matches.forEach(m => {
      const clean = m.replace(/['"`].*/, '');
      const full = path.join(process.cwd(), 'public', clean);
      if (!fs.existsSync(full)) {
        console.log(`BROKEN LINK in ${file}: ${clean}`);
        brokenCount++;
      }
    });
  }
});

console.log(`Check complete. Broken links found: ${brokenCount}`);
