const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.tsx') && !p.includes('LoginPage')) {
      let content = fs.readFileSync(p, 'utf8');
      let newContent = content
        .replace(/className="space-y-6 animate-page-enter"/g, 'className="space-y-6"')
        .replace(/className="space-y-8 animate-page-enter"/g, 'className="space-y-8"')
        .replace(/className="fixed inset-0 z-50 flex flex-col overflow-y-auto animate-page-enter"/g, 'className="fixed inset-0 z-50 flex flex-col overflow-y-auto"');
      if (content !== newContent) {
        fs.writeFileSync(p, newContent, 'utf8');
        console.log('Fixed:', p);
      }
    }
  });
}

walk('src/features');
