import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import process from 'node:process';
import { glob } from 'glob';

const files = await glob('src/**/*.test.ts');

run({ files }).compose(new spec()).pipe(process.stdout);
