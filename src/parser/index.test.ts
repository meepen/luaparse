import { LuaVersion, createParser } from './index.js';
import { PUCRio_v5_1_Parser } from './versions/puc-rio-5-1.js';
import assert from 'node:assert';

describe('createParser', () => {
  it('should create a PUC Rio v5.1 parser', () => {
    const parser = createParser(LuaVersion.PUCRio_v5_1, 'a + b');
    assert(parser instanceof PUCRio_v5_1_Parser);
  });
  it('should throw an error for an unknown version', () => {
    assert.throws(() => createParser('unknown' as LuaVersion, 'a + b'));
  });
});
