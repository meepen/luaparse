import { NodeType } from '../../node.js';
import { IExpression, ExpressionType } from '../exp.js';
import { Expression } from '../types.js';

export class BinaryOperationExpression implements IExpression {
  readonly expressionType = ExpressionType.BinaryOperationExpression;
  readonly type = NodeType.Expression;

  constructor(
    leftExpression: Expression,
    public operator: string,
    rightExpression: Expression,
  ) {
    this.children = [leftExpression, rightExpression];
  }

  get leftExpression() {
    return this.children[0];
  }

  set leftExpression(expression) {
    this.children[0] = expression;
  }

  get rightExpression() {
    return this.children[1];
  }

  set rightExpression(expression) {
    this.children[1] = expression;
  }

  children: [Expression, Expression];
}
