import { INode, NodeType } from '../node.js';

export enum FieldType {
  ExpressionExpression = 'ExpressionExpression',
  NameExpression = 'NameExpression',
  Expression = 'Expression',
}

export interface IField extends INode {
  type: NodeType.Field;
  fieldType: FieldType;
}
