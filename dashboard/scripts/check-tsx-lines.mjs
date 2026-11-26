import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const violations = [];
let count = 0;

async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await check(filename);
    else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      count++;
      const source = await readFile(filename, 'utf8');
      const lines = source.split('\n').length - Number(source.endsWith('\n'));
      if (lines > 100)
        violations.push(`${path.relative(root, filename)}: ${lines} lines`);
    }
  }
}

await check(root);
if (violations.length) {
  console.error(
    'TSX files must not exceed 100 lines:\n' + violations.join('\n'),
  );
  process.exitCode = 1;
} else {
  console.log(`All ${count} dashboard TSX files are within 100 lines.`);
}
