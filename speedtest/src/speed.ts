import { Bench } from 'tinybench';
import { createParser, LuaVersion } from '../../src/index.js';
import luaparse from 'luaparse';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const bench = new Bench({
  name: 'Lua Parser speed test',
});

async function collectLuaFiles() {
  // read ./lua directory and return all .lua files as an array of strings
  const baseDir = resolve(join(import.meta.dirname, '../../resources/lua'));

  const files = await readdir(baseDir);
  return await Promise.all(
    files
      .map((file) => join(baseDir, file))
      .filter((file) => file.endsWith('.lua'))
      .sort((a, b) => (a < b ? -1 : 1))
      .map(async (file) => ({
        name: file.split('/').pop()!,
        content: await readFile(file, 'utf-8'),
      })),
  );
}
const luaSource = await collectLuaFiles();

bench.add('luaparse', () => {
  for (const file of luaSource) {
    console.log(`luaparse: Parsing ${file.name}`);
    luaparse.parse(file.content, { luaVersion: '5.1', comments: false, scope: false, locations: false, ranges: false });
  }
});

bench.add('@meepen/luaparse', async () => {
  for (const file of luaSource) {
    console.log(`@meepen/luaparse: Parsing ${file.name}`);
    await createParser(LuaVersion.PUCRio_v5_1, file.content).parse();
  }
});

await bench.run();

console.table(bench.table());
