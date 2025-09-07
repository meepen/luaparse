import { createParser, LuaVersion } from '../../src/index.js';
import { collectLuaFiles } from './collect-resources.js';

const luaSource = await collectLuaFiles();

const luaVersion = LuaVersion.PUCRio_v5_1;

const results: { result?: unknown; error?: Error; file: { name: string; content: string } }[] = [];
for (const file of luaSource) {
  console.log(`Parsing ${file.name}...`);
  try {
    results.push({
      result: await createParser(luaVersion, file.content).parse(),
      file,
    });
  } catch (error) {
    results.push({ error: error instanceof Error ? error : new Error(String(error)), file });
  }
}

for (const { error, file } of results) {
  if (error) {
    console.error(`Error parsing ${file.name}:`, error);
  } else {
    console.log(`Successfully parsed ${file.name}`);
  }
}
