import { describe, it } from 'node:test';
import { ExpressionList } from './explist.js';
import { TrueExpression } from './exp/true-expression.js';
import assert from 'node:assert';

describe('ExpressionList', () => {
  it('should return the expressions', () => {
    const expressions = [new TrueExpression()];
    const explist = new ExpressionList(expressions);
    assert.equal(explist.expressions, expressions);
  });
});
