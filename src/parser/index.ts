import { Chunk } from '../nodes/chunk.js';
import { PUCRio_v5_1_Parser } from './versions/puc-rio-5-1.js';

export enum LuaVersion {
  LuaJIT = 'LuaJIT',
  PUCRio_v5_1 = '5.1',
}

export interface AstParser {
  luaVersion: LuaVersion;
  source: string;

  // As to not hoard the CPU when parsing large files, we parse async statement by statement
  // to allow the event loop to do its thing.
  parse(): Promise<Chunk>;
}

export function createParser(luaVersion: LuaVersion, source: string): AstParser {
  switch (luaVersion) {
    case LuaVersion.PUCRio_v5_1:
      return new PUCRio_v5_1_Parser(source);
    default:
      throw new Error(`Unsupported Lua version: ${luaVersion}`);
  }
}
