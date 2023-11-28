import { Node } from './nodes/types.js';

export enum NodeType {
  Chunk = 'Chunk',
  Statement = 'Statement',
  FunctionName = 'FunctionName',
  VariableList = 'VariableList',
  NameList = 'NameList',
  ExpressionList = 'ExpressionList',
  Expression = 'Expression',
  Arguments = 'Arguments',
  Function = 'Function',
  ParameterList = 'ParameterList',
  Field = 'Field',
  FuncBody = 'FuncBody',

  /* Interpreted from the manual but not explicitly stated */
  Name = 'Name',
  ElseIfClause = 'ElseIfClause',
}

export interface INode {
  type: NodeType;
  children: Node[];
}
