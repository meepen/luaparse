import { NodeType } from '../../node.js';
import { IExpression, ExpressionType } from '../exp.js';

export class NilExpression implements IExpression {
  readonly children = [];
  readonly expressionType = ExpressionType.NilExpression;
  readonly type = NodeType.Expression;
}
