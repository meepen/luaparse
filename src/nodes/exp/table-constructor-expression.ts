import { NodeType } from '../../node.js';
import { IExpression, ExpressionType } from '../exp.js';
import { Field } from '../types.js';

export class TableConstructorExpression implements IExpression {
  readonly expressionType = ExpressionType.TableConstructorExpression;
  readonly type = NodeType.Expression;

  constructor(fields: Field[]) {
    this.children = fields;
  }

  get fields() {
    return this.children;
  }

  children: Field[];
}
