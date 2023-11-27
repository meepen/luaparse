import { Node } from './nodes/types.js';

export enum NodeType {
  Chunk = 'Chunk',
  Block = 'Block',
  Statement = 'Statement',
  LastStatement = 'LastStatement',
  FunctionName = 'FunctionName',
  VariableList = 'VariableList',
  Variable = 'Variable',
  NameList = 'NameList',
  ExpressionList = 'ExpressionList',
  Expression = 'Expression',
  FunctionCall = 'FunctionCall',
  Arguments = 'Arguments',
  Function = 'Function',
  FunctionBody = 'FunctionBody',
  ParameterList = 'ParameterList',
  TableConstructor = 'TableConstructor',
  FieldList = 'FieldList',
  Field = 'Field',
  FieldSeperator = 'FieldSeperator',
  BinaryOperation = 'BinaryOperation',
  UnaryOperation = 'UnaryOperation',
  FuncBody = 'FuncBody',

  /* Interpreted from the manual but not explicitly stated */
  Name = 'Name',
  ElseIfClause = 'ElseIfClause',
}

export interface INode {
  type: NodeType;
  children: Node[];
}
