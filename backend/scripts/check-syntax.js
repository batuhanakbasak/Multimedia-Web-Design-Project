const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const directoriesToCheck = [path.join(rootDir, 'src'), path.join(rootDir, 'scripts')];

const collectJsFiles = (directory) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  entries.forEach((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectJsFiles(fullPath));
      return;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  });

  return files;
};

const files = directoriesToCheck.flatMap((directory) => collectJsFiles(directory));

files.forEach((filePath) => {
  execFileSync(process.execPath, ['--check', filePath], {
    stdio: 'inherit',
  });
});

console.log(`Syntax check passed for ${files.length} JavaScript files.`);
