import { NodeType } from '../../../../node.js';
import { ExpressionType } from '../../../exp.js';
import { Expression, PrefixExpression } from '../../../types.js';
import { PrefixExpressionType } from '../../prefix-expression.js';
import { IVariablePrefixExpression, VariablePrefixExpressionType } from '../variable.js';

export class IndexedVariable implements IVariablePrefixExpression {
  readonly type = NodeType.Expression;
  readonly expressionType = ExpressionType.PrefixExpression;
  readonly prefixExpressionType = PrefixExpressionType.Variable;
  readonly variablePrefixExpressionType = VariablePrefixExpressionType.Index;

  constructor(base: PrefixExpression, index: Expression) {
    this.children = [base, index];
  }

  get base() {
    return this.children[0];
  }

  get index() {
    return this.children[1];
  }

  children: [PrefixExpression, Expression];
}
