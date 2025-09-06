import assert from 'node:assert';
import { NameVariable } from './variable/name-variable.js';
import { ParenthesisedPrefixExpression } from './parenthesised.js';
import { Name } from '../../name.js';

describe('ParenthesisedPrefixExpression', () => {
  const exp = new NameVariable(new Name('a'));
  const parenthesised = new ParenthesisedPrefixExpression(exp);

  it('should return the expression', () => {
    assert.deepEqual(parenthesised.expression, exp);
  });
});
