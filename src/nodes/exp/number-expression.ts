import { NodeType } from '../../node.js';
import { IExpression, ExpressionType } from '../exp.js';

export class NumberExpression implements IExpression {
  readonly expressionType = ExpressionType.NumberExpression;
  readonly type = NodeType.Expression;
  readonly children = [];

  constructor(
    public raw: string,
    public value: number,
  ) {}
}
