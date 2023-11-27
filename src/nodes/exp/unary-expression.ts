import { NodeType } from '../../node.js';
import { IExpression, ExpressionType } from '../exp.js';
import { Expression } from '../types.js';

export class UnaryOperationExpression implements IExpression {
  readonly expressionType = ExpressionType.UnaryOperationExpression;
  readonly type = NodeType.Expression;

  constructor(
    public operator: string,
    expression: Expression,
  ) {
    this.children = [expression];
  }

  get expression() {
    return this.children[0];
  }

  set expression(expression) {
    this.children[0] = expression;
  }

  children: [Expression];
}
