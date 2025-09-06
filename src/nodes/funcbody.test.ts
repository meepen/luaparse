import assert from 'node:assert';
import { ParameterList } from './parlist.js';
import { NameList } from './namelist.js';
import { Chunk } from './chunk.js';
import { FuncBody } from './funcbody.js';

describe('FuncBody', () => {
  const parameterList = new ParameterList(new NameList([]), false);
  const body = new Chunk([]);
  const funcBody = new FuncBody(parameterList, body);

  it('should return the parameterList', () => {
    assert.equal(funcBody.parameterList, parameterList);
  });
  it('should return the body', () => {
    assert.equal(funcBody.body, body);
  });
});
