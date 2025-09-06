import assert from 'node:assert';
import { StringExpression } from '../exp/string-expression.js';
import { StringArguments } from './string.js';

describe('StringArguments', () => {
  const str = new StringExpression('a', 'b');
  const args = new StringArguments(str);
  it('should return the expressions', () => {
    assert.deepEqual(args.string, str);
  });
});
