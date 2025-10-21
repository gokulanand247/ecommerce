const fs = require('fs');
const path = require('path');

const replacements = [
  [/pink-50/g, 'red-50'],
  [/pink-100/g, 'red-100'],
  [/pink-200/g, 'red-200'],
  [/pink-300/g, 'red-300'],
  [/pink-400/g, 'red-400'],
  [/pink-500/g, 'red-500'],
  [/pink-600/g, 'red-600'],
  [/pink-700/g, 'red-700'],
  [/pink-800/g, 'red-800'],
  [/pink-900/g, 'red-900'],
  [/#EC4899/g, '#dc2626'],
  [/from-pink-/g, 'from-red-'],
  [/to-pink-/g, 'to-red-'],
  [/bg-pink-/g, 'bg-red-'],
  [/text-pink-/g, 'text-red-'],
  [/border-pink-/g, 'border-red-'],
  [/hover:bg-pink-/g, 'hover:bg-red-'],
  [/hover:text-pink-/g, 'hover:text-red-'],
  [/hover:border-pink-/g, 'hover:border-red-'],
  [/focus:ring-pink-/g, 'focus:ring-red-'],
  [/focus:border-pink-/g, 'focus:border-red-'],
];

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(([pattern, replacement]) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      replaceInFile(filePath);
    }
  });
}

console.log('Starting color replacement...');
walkDir(path.join(__dirname, 'src'));
console.log('Color replacement complete!');
