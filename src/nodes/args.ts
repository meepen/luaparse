import { INode, NodeType } from '../node.js';

export enum ArgumentsType {
  ExpressionList = 'ExpressionList',
  TableConstructor = 'TableConstructor',
  String = 'String',
}

export interface IArguments extends INode {
  type: NodeType.Arguments;
  argumentsType: ArgumentsType;
}
