import { NodeType } from '../../node.js';
import { IExpression, ExpressionType } from '../exp.js';

export class VarargExpression implements IExpression {
  readonly children = [];
  readonly expressionType = ExpressionType.VarargExpression;
  readonly type = NodeType.Expression;
}
