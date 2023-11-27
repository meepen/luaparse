import { INode, NodeType } from '../node.js';

export enum StatementType {
  Assignment = 'Assignment',
  FunctionCall = 'FunctionCall',
  DoBlockEnd = 'DoBlockEnd',
  WhileBlockEnd = 'WhileBlockEnd',
  RepeatBlockEnd = 'RepeatBlockEnd',
  IfBlockEnd = 'IfBlockEnd',
  ForDoBlockEnd = 'ForDoBlockEnd',
  ForInBlockEnd = 'ForInBlockEnd',
  FunctionDeclaration = 'FunctionDeclaration',
  LocalFunctionDeclaration = 'LocalFunctionDeclaration',
  LocalVariableDeclaration = 'LocalVariableDeclaration',
  // laststat
  ReturnStatement = 'ReturnStatement',
  BreakStatement = 'BreakStatement',
  // Continue patch
  ContinueStatement = 'ContinueStatement',
}

export interface IStatement extends INode {
  type: NodeType.Statement;
  statementType: StatementType;
  isLastStatement: boolean;
}
