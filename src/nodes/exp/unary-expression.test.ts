import { describe, it } from 'node:test';
import assert from 'node:assert';
import { UnaryOperationExpression } from './unary-expression.js';
import { TrueExpression } from './true-expression.js';

describe('UnaryOperationExpression', () => {
  const expr = new TrueExpression();
  const unary = new UnaryOperationExpression('not', expr);

  it('should return the operator', () => {
    assert.equal(unary.operator, 'not');
  });
  it('should return the expression', () => {
    assert.equal(unary.expression, expr);
  });

  it('should set the expression', () => {
    const setUnary = new UnaryOperationExpression('not', expr);
    const newExpr = new TrueExpression();
    setUnary.expression = newExpr;
    assert.equal(setUnary.expression, newExpr);
  });
});
