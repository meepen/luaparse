import { Bench } from 'tinybench';
import { createParser, LuaVersion } from '../src/index.js';
import luaparse from 'luaparse';
import { collectLuaFiles } from './collect-resources.js';

const bench = new Bench({
  name: 'Lua Parser speed test',
});

const luaSource = await collectLuaFiles();

for (const file of luaSource) {
  bench.add(`luaparse: ${file.name}`, () => {
    luaparse.parse(file.content, { luaVersion: '5.1', comments: false, scope: false, locations: false, ranges: false });
  });

  bench.add(`@meepen/luaparse: ${file.name}`, async () => {
    await createParser(LuaVersion.PUCRio_v5_1, file.content).parse();
  });
}

await bench.run();

console.table(bench.table());
