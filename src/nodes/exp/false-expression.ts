import { NodeType } from '../../node.js';
import { IExpression, ExpressionType } from '../exp.js';

export class FalseExpression implements IExpression {
  readonly children = [];
  readonly expressionType = ExpressionType.FalseExpression;
  readonly type = NodeType.Expression;
}
