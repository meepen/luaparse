import assert from 'node:assert';
import { ExpressionList } from '../explist.js';
import { TrueExpression } from '../exp/true-expression.js';
import { ExpressionListArguments } from './expression-list.js';

describe('ExpressionListArguments', () => {
  const expressions = [new TrueExpression()];
  const expressionList = new ExpressionList(expressions);
  const args = new ExpressionListArguments(expressionList);
  it('should return the expressions', () => {
    assert.deepEqual(args.expressions, expressionList);
  });
});
