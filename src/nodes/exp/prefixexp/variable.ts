import { IPrefixExpression, PrefixExpressionType } from '../prefix-expression.js';

export enum VariablePrefixExpressionType {
  Name = 'Name',
  Index = 'Index',
  Member = 'Member',
}

export interface IVariablePrefixExpression extends IPrefixExpression {
  variablePrefixExpressionType: VariablePrefixExpressionType;
  prefixExpressionType: PrefixExpressionType.Variable;
}
