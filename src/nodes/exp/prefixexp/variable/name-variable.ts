import { NodeType } from '../../../../node.js';
import { ExpressionType } from '../../../exp.js';
import { Name } from '../../../name.js';
import { PrefixExpressionType } from '../../prefix-expression.js';
import { IVariablePrefixExpression, VariablePrefixExpressionType } from '../variable.js';

export class NameVariable implements IVariablePrefixExpression {
  readonly type = NodeType.Expression;
  readonly expressionType = ExpressionType.PrefixExpression;
  readonly prefixExpressionType = PrefixExpressionType.Variable;
  readonly variablePrefixExpressionType = VariablePrefixExpressionType.Name;

  constructor(name: Name) {
    this.children = [name];
  }

  get name() {
    return this.children[0];
  }

  children: [Name];
}
