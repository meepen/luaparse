import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Chunk } from '../chunk.js';
import { ParameterList } from '../parlist.js';
import { NameList } from '../namelist.js';
import { FunctionExpression } from './function-expression.js';
import { FuncBody } from '../funcbody.js';

describe('FunctionExpression', () => {
  const parameterList = new ParameterList(new NameList([]), false);
  const block = new Chunk([]);
  const body = new FuncBody(parameterList, block);
  const func = new FunctionExpression(body);

  it('should return the body', () => {
    assert.equal(func.body, body);
  });
});
