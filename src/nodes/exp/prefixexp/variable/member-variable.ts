import { NodeType } from '../../../../node.js';
import { ExpressionType } from '../../../exp.js';
import { Name } from '../../../name.js';
import { PrefixExpression } from '../../../types.js';
import { PrefixExpressionType } from '../../prefix-expression.js';
import { IVariablePrefixExpression, VariablePrefixExpressionType } from '../variable.js';

export class MemberVariable implements IVariablePrefixExpression {
  readonly type = NodeType.Expression;
  readonly expressionType = ExpressionType.PrefixExpression;
  readonly prefixExpressionType = PrefixExpressionType.Variable;
  readonly variablePrefixExpressionType = VariablePrefixExpressionType.Member;

  constructor(base: PrefixExpression, member: Name) {
    this.children = [base, member];
  }

  get base() {
    return this.children[0];
  }

  get member() {
    return this.children[1];
  }

  children: [PrefixExpression, Name];
}
