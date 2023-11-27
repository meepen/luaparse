import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BinaryOperationExpression } from './binary-expression.js';
import { TrueExpression } from './true-expression.js';
import { FalseExpression } from './false-expression.js';

describe('BinaryOperationExpression', () => {
  const left = new TrueExpression();
  const right = new FalseExpression();
  const binaryOperation = 'lol';
  const binop = new BinaryOperationExpression(left, binaryOperation, right);
  it('should return the left expression', () => {
    assert.equal(binop.leftExpression, left);
  });
  it('should return the right expression', () => {
    assert.equal(binop.rightExpression, right);
  });
  it('should return the binary operation', () => {
    assert.equal(binop.operator, binaryOperation);
  });

  it('should set the left expression', () => {
    const setBinop = new BinaryOperationExpression(left, binaryOperation, right);
    const newLeft = new FalseExpression();
    setBinop.leftExpression = newLeft;
    assert.equal(setBinop.leftExpression, newLeft);
  });

  it('should set the right expression', () => {
    const setBinop = new BinaryOperationExpression(left, binaryOperation, right);
    const newRight = new FalseExpression();
    setBinop.rightExpression = newRight;
    assert.equal(setBinop.rightExpression, newRight);
  });
});
