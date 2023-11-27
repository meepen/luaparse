import { NodeType } from '../../../../node.js';
import { ExpressionType } from '../../../exp.js';
import { Name } from '../../../name.js';
import { Arguments, PrefixExpression } from '../../../types.js';
import { PrefixExpressionType } from '../../prefix-expression.js';
import { IFunctionCallPrefixExpression, FunctionCallPrefixExpressionType } from '../function-call.js';

export class MethodFunctionCall implements IFunctionCallPrefixExpression {
  readonly type = NodeType.Expression;
  readonly expressionType = ExpressionType.PrefixExpression;
  readonly prefixExpressionType = PrefixExpressionType.FunctionCall;
  readonly functionCallPrefixExpressionType = FunctionCallPrefixExpressionType.Method;

  constructor(object: PrefixExpression, name: Name, argument: Arguments) {
    this.children = [object, name, argument];
  }

  get object() {
    return this.children[0];
  }

  get name() {
    return this.children[1];
  }

  get argument() {
    return this.children[2];
  }

  children: [PrefixExpression, Name, Arguments];
}
