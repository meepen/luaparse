import { IPrefixExpression, PrefixExpressionType } from '../prefix-expression.js';

export enum FunctionCallPrefixExpressionType {
  Normal = 'Normal',
  Method = 'Method',
}

export interface IFunctionCallPrefixExpression extends IPrefixExpression {
  functionCallPrefixExpressionType: FunctionCallPrefixExpressionType;
  prefixExpressionType: PrefixExpressionType.FunctionCall;
}
