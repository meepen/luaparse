import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

export async function collectAllResourcesFromPath(path: string): Promise<{ name: string; content: string }[]> {
  // read ./lua directory and return all .lua files as an array of strings
  const det = await stat(path);
  if (!det.isDirectory()) {
    if (!path.endsWith('.lua')) {
      return [];
    }

    return [
      {
        name: path,
        content: await readFile(path, 'utf-8'),
      },
    ];
  }

  const files = await readdir(path);
  return (
    await Promise.all(
      files
        .map((file) => join(path, file))
        .sort((a, b) => (a < b ? -1 : 1))
        .map(collectAllResourcesFromPath),
    )
  ).flat();
}

export async function collectLuaFiles(filePaths: string[] = ['resources/lua']) {
  return (await Promise.all(filePaths.map(async (path) => collectAllResourcesFromPath(path)))).flat();
}
