import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createParser, LuaVersion } from '../src/index.js';
import { collectLuaFiles } from './collect-resources.js';

await yargs(hideBin(process.argv))
  .command(
    'test [files..]',
    'Test the parser with Lua files',
    (y) =>
      y.positional('files', {
        describe: 'Lua files to parse',
        type: 'string',
        array: true,
        default: [],
      }),
    async (argv) => {
      console.log('Starting parser tests...');
      const luaSource = await collectLuaFiles(argv.files.length !== 0 ? argv.files : undefined);

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
    },
  )
  .parse();
