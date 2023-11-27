import { NodeType } from '../../../../node.js';
import { ExpressionType } from '../../../exp.js';
import { Arguments, PrefixExpression } from '../../../types.js';
import { PrefixExpressionType } from '../../prefix-expression.js';
import { IFunctionCallPrefixExpression, FunctionCallPrefixExpressionType } from '../function-call.js';

export class NormalFunctionCall implements IFunctionCallPrefixExpression {
  readonly type = NodeType.Expression;
  readonly expressionType = ExpressionType.PrefixExpression;
  readonly prefixExpressionType = PrefixExpressionType.FunctionCall;
  readonly functionCallPrefixExpressionType = FunctionCallPrefixExpressionType.Normal;

  constructor(functionExpression: PrefixExpression, argument: Arguments) {
    this.children = [functionExpression, argument];
  }

  get functionExpression() {
    return this.children[0];
  }

  get argument() {
    return this.children[1];
  }

  children: [PrefixExpression, Arguments];
}
