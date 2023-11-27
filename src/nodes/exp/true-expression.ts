import { NodeType } from '../../node.js';
import { IExpression, ExpressionType } from '../exp.js';

export class TrueExpression implements IExpression {
  readonly children = [];
  readonly expressionType = ExpressionType.TrueExpression;
  readonly type = NodeType.Expression;
}
