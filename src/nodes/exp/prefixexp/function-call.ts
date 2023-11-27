import { IPrefixExpression, PrefixExpressionType } from '../prefix-expression.js';

export const enum FunctionCallPrefixExpressionType {
  Normal = 'Normal',
  Method = 'Method',
}

export interface IFunctionCallPrefixExpression extends IPrefixExpression {
  functionCallPrefixExpressionType: FunctionCallPrefixExpressionType;
  prefixExpressionType: PrefixExpressionType.FunctionCall;
}
