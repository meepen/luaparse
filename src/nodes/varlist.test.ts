import { describe, it } from 'node:test';
import assert from 'node:assert';
import { VariableList } from './varlist.js';
import { NameVariable } from './exp/index.js';
import { Name } from './name.js';

describe('VariableList', () => {
  const variable = new NameVariable(new Name('a'));
  const varlist = new VariableList([variable]);
  it('should return the variables', () => {
    assert.deepEqual(varlist.variables, [variable]);
  });
});
