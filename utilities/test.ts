import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createParser, LuaVersion } from '../src/index.js';
import { collectLuaFiles } from './collect-resources.js';

await yargs(hideBin(process.argv))
  .command(
    'test [files..]',
    'Test the parser with Lua files',
    (y) =>
      /** -t <number> */
      y
        .option('times', {
          describe: 'Number of times to run the test',
          alias: 't',
          type: 'number',
          default: 1,
        })
        .positional('files', {
          describe: 'Lua files to parse',
          type: 'string',
          array: true,
          default: [],
        }),
    async (argv) => {
      console.log('Starting parser tests...');
      let luaSource = await collectLuaFiles(argv.files.length !== 0 ? argv.files : undefined);
      const luaVersion = LuaVersion.PUCRio_v5_1;

      // repeat luaSource times
      luaSource = Array<typeof luaSource>(argv.times).fill(luaSource).flat();

      const results: { result?: unknown; error?: Error; file: { name: string; content: string } }[] = [];
      for (const file of luaSource) {
        try {
          results.push({
            result: await createParser(luaVersion, file.content).parse(),
            file,
          });
        } catch (error) {
          results.push({ error: error instanceof Error ? error : new Error(String(error)), file });
        }
      }

      console.log(`Parsed ${results.length} files.`);

      for (const { error, file } of results.filter((r) => r.error)) {
        console.error(`Error parsing ${file.name}:`, error);
      }
    },
  )
  .parse();
