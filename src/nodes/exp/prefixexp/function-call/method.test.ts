import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MethodFunctionCall } from './method.js';
import { NameVariable } from '../variable/name-variable.js';
import { Name } from '../../../name.js';
import { StringArguments } from '../../../args/string.js';
import { StringExpression } from '../../string-expression.js';

describe('MethodFunctionCall', () => {
  const prefix = new NameVariable(new Name('a'));
  const method = new Name('b');
  const args = new StringArguments(new StringExpression('c', 'd'));
  const call = new MethodFunctionCall(prefix, method, args);

  it('should return the prefix', () => {
    assert.deepEqual(call.object, prefix);
  });
  it('should return the method', () => {
    assert.deepEqual(call.name, method);
  });
  it('should return the args', () => {
    assert.deepEqual(call.argument, args);
  });
});
