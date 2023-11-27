import { IExpression, ExpressionType } from '../exp.js';

export enum PrefixExpressionType {
  Variable = 'Variable',
  FunctionCall = 'FunctionCall',
  ParenthesizedExpression = 'ParenthesizedExpression',
}

export interface IPrefixExpression extends IExpression {
  prefixExpressionType: PrefixExpressionType;
  expressionType: ExpressionType.PrefixExpression;
}
