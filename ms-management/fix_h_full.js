const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('page.tsx') || file.endsWith('.tsx')) results.push(file);
        }
    });
    return results;
}

const files = walk('./app');

let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace <div className="flex flex-col h-full"> with min-h-full
    if (content.includes('className="flex flex-col h-full"')) {
        content = content.replace(/className="flex flex-col h-full"/g, 'className="flex flex-col min-h-full"');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Patched ${file}`);
        count++;
    }
});
console.log(`Finished patching ${count} files with min-h-full.`);
