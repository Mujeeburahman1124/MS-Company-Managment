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

    // Fix overflow-y-hidden
    if (content.includes('overflow-y-hidden')) {
        content = content.replace(/overflow-y-hidden/g, 'overflow-y-auto');
        changed = true;
    }

    // Fix flex-1 overflow-x-auto missing overflow-y-auto
    const regex = /className="([^"]*flex-1[^"]*overflow-x-auto[^"]*)"/g;
    content = content.replace(regex, (match, p1) => {
        if (!p1.includes('overflow-y-auto')) {
            changed = true;
            return `className="${p1} overflow-y-auto"`;
        }
        return match;
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Patched ${file}`);
        count++;
    }
});
console.log(`Finished patching ${count} files.`);
