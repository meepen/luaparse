import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Name } from './name.js';
import { FuncName } from './funcname.js';

describe('FuncName', () => {
  const name = new Name('name');
  const indexers = [new Name('indexer')];
  const methodName = new Name('methodName');
  const funcname = new FuncName(name, indexers, methodName);
  it('should return the name', () => {
    assert.equal(funcname.name, name);
  });
  it('should return the indexers', () => {
    assert.deepEqual(funcname.indexers, indexers);
  });
  it('should return the methodName', () => {
    assert.equal(funcname.methodName, methodName);
  });
});
