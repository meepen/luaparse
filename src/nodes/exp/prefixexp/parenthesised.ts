import { NodeType } from '../../../node.js';
import { ExpressionType } from '../../exp.js';
import { Expression } from '../../types.js';
import { IPrefixExpression, PrefixExpressionType } from '../prefix-expression.js';

export class ParenthesisedPrefixExpression implements IPrefixExpression {
  readonly prefixExpressionType = PrefixExpressionType.ParenthesizedExpression;
  readonly expressionType = ExpressionType.PrefixExpression;
  readonly type = NodeType.Expression;

  constructor(expression: Expression) {
    this.children = [expression];
  }

  get expression() {
    return this.children[0];
  }

  children: [Expression];
}
