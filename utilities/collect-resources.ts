import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export async function collectLuaFiles() {
  // read ./lua directory and return all .lua files as an array of strings
  const baseDir = resolve(join(import.meta.dirname, '../resources/lua'));

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
