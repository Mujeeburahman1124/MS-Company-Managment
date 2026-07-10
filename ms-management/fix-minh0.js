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
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // find all classNames that contain flex-1 and overflow-y-auto or overflow-auto or overflow-x-auto, and add min-h-0 if missing
    newContent = newContent.replace(/className=\"([^\"]*flex-1[^\"]*overflow-(?:y-auto|x-auto|auto)[^\"]*)\"/g, (match, p1) => {
      if (!p1.includes('min-h-0')) {
        return className=" min-h-0";
      }
      return match;
    });

    // Cleanup double spaces
    newContent = newContent.replace(/className=\"([^\"]*)\s\s+([^\"]*)\"/g, 'className=\"$1 $2\"');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Added min-h-0 in', filePath);
      changedFiles++;
    }
  }
});
console.log('Total fixed via Node:', changedFiles);
