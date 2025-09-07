import { Chunk } from '../nodes/chunk.js';
import { PUCRio_v5_1_Parser } from './versions/puc-rio-5-1.js';

export enum LuaVersion {
  PUCRio_v5_1 = '5.1',
}

export interface AstParser {
  get luaVersion(): LuaVersion;
  get source(): string;

  // As to not hoard the CPU when parsing large files, we parse async statement by statement
  // to allow the event loop to do its thing.
  parse(): Promise<Chunk>;
}

export function createParser(luaVersion: LuaVersion, source: string): AstParser {
  switch (luaVersion as unknown) {
    case LuaVersion.PUCRio_v5_1:
      return new PUCRio_v5_1_Parser(source);
    default:
      throw new Error(`Unsupported Lua version: ${luaVersion}`);
  }
}
