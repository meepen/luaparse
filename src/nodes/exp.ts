import { INode, NodeType } from '../node.js';

export enum ExpressionType {
  NilExpression = 'NilExpression',
  FalseExpression = 'FalseExpression',
  TrueExpression = 'TrueExpression',
  NumberExpression = 'NumberExpression',
  StringExpression = 'StringExpression',
  VarargExpression = 'VarargExpression',
  FunctionExpression = 'FunctionExpression',
  PrefixExpression = 'PrefixExpression',
  TableConstructorExpression = 'TableConstructorExpression',
  BinaryOperationExpression = 'BinaryOperationExpression',
  UnaryOperationExpression = 'UnaryOperationExpression',
}

export interface IExpression extends INode {
  type: NodeType.Expression;
  expressionType: ExpressionType;
}
