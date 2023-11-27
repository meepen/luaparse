import { NodeType } from '../../node.js';
import { IExpression, ExpressionType } from '../exp.js';
import { FuncBody } from '../funcbody.js';

export class FunctionExpression implements IExpression {
  readonly expressionType = ExpressionType.FunctionExpression;
  readonly type = NodeType.Expression;

  constructor(body: FuncBody) {
    this.children = [body];
  }

  get body() {
    return this.children[0];
  }

  children: [FuncBody];
}
