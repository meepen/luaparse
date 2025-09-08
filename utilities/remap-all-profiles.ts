import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { remapProfile } from './speed-html.js';

// Using import.meta.dirname (Node 22+) to resolve relative paths

// (Types intentionally inferred from yargs; explicit interface removed for simplicity)

// Top-level execution (ESM supports top-level await in Node >= 14.8)
const argv = await yargs(hideBin(process.argv))
  .scriptName('remap-all-profiles')
  .usage('$0 [options] Remap V8 CPU profiles to source-mapped versions')
  .option('dir', {
    alias: 'd',
    type: 'string',
    describe: 'Directory containing .cpuprofile files',
    default: path.join(import.meta.dirname, '..', 'coverage', 'speed'),
  })
  .option('pattern', {
    alias: 'p',
    type: 'string',
    describe: 'Glob-like suffix or regex for matching profile files',
    default: '.cpuprofile',
  })
  .option('suffix', {
    alias: 's',
    type: 'string',
    describe: 'Suffix to append before extension for remapped files',
    default: 'sourcemapped',
  })
  .help()
  .version()
  .parse();

// Extract only required properties with explicit types to avoid any leakage
const {
  dir: argvDir,
  pattern: argvPattern,
  suffix: argvSuffix,
} = argv as {
  dir: string;
  pattern: string;
  suffix: string;
};

const speedDir = argvDir;

let entries: string[] = [];
try {
  entries = await fs.readdir(speedDir);
} catch {
  console.error(`Directory not found: ${speedDir}`);
  process.exit(1);
}

let matcher: (name: string) => boolean;
if (argvPattern.startsWith('/') && argvPattern.endsWith('/')) {
  const body = argvPattern.slice(1, -1);
  const re = new RegExp(body, 'i');
  matcher = (n) => re.test(n);
} else if (argvPattern.startsWith('regex:')) {
  const body = argvPattern.slice('regex:'.length);
  const re = new RegExp(body, 'i');
  matcher = (n) => re.test(n);
} else {
  // treat as simple suffix
  matcher = (n) => n.endsWith(argvPattern);
}

const profiles = entries.filter(matcher);
if (profiles.length === 0) {
  console.error(`No profile files matched pattern '${argvPattern}' in ${speedDir}`);
  process.exit(1);
}

for (const p of profiles) {
  const inPath = path.join(speedDir, p);
  const outPath = inPath.replace(/\.cpuprofile$/i, `.${argvSuffix}.cpuprofile`);
  try {
    await remapProfile(inPath, outPath);
    console.log(`Remapped: ${p} -> ${path.basename(outPath)}`);
  } catch (err) {
    console.warn(`Failed to remap ${p}:`, err);
  }
}

// speedscope integration removed
