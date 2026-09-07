const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'dist', 'build', 'h5');
const extensions = new Set(['.html', '.js', '.css', '.json']);
let updated = 0;

function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (extensions.has(path.extname(entry.name))) {
      const before = fs.readFileSync(file, 'utf8');
      // The app uses string-based /static/... references for Uni assets.
      // They must be relative when the site is hosted below a repository path.
      const after = before.replace(/(["'(])\/static\//g, '$1./static/');
      if (after !== before) {
        fs.writeFileSync(file, after);
        updated += 1;
      }
    }
  }
}

if (!fs.existsSync(root)) throw new Error(`H5 output not found: ${root}`);
visit(root);
fs.writeFileSync(path.join(root, '.nojekyll'), '');
console.log(`Prepared GitHub Pages output; updated ${updated} files.`);
