const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git') && file !== 'scratch') {
        results = results.concat(walk(fullPath));
      }
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(/fetch\(\s*[`'"]/g);
        if (matches) {
          // Find all occurrences of fetch and log their surrounding lines
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes('fetch(') && line.includes('/api/')) {
              results.push({
                file: fullPath,
                line: idx + 1,
                content: line.trim()
              });
            }
          });
        }
      }
    }
  });
  return results;
}

const res = walk('.');
console.log(JSON.stringify(res, null, 2));
