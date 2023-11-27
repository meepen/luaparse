import { NodeType } from '../../node.js';
import { IExpression, ExpressionType } from '../exp.js';

export class StringExpression implements IExpression {
  readonly expressionType = ExpressionType.StringExpression;
  readonly type = NodeType.Expression;
  readonly children = [];

  constructor(
    public raw: string,
    public value: string,
  ) {}
}
