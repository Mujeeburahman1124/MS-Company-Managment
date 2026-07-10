const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let changedFiles = 0;
walkDir('app', (filePath) => {
  if (filePath.endsWith('page.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    newContent = newContent.replace(/className=\"([^\"]*)pb-(?:16|24|32)([^\"]*)\"/g, 'className=\"$1$2\"');
    newContent = newContent.replace(/className=\"([^\"]*)md:pb-12([^\"]*)\"/g, 'className=\"$1$2\"');
    
    newContent = newContent.replace(/className=\"([^\"]*)\s\s+([^\"]*)\"/g, 'className=\"$1 $2\"');
    newContent = newContent.replace(/className=\"\s+([^\"]*)\"/g, 'className=\"$1\"');
    newContent = newContent.replace(/className=\"([^\"]*)\s+\"/g, 'className=\"$1\"');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Fixed', filePath);
      changedFiles++;
    }
  }
});
console.log('Total fixed via Node:', changedFiles);
