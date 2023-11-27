import { NodeType } from '../../node.js';
import { IStatement, StatementType } from '../stat.js';
import { FunctionCallPrefixExpression } from '../types.js';

export class FunctionCallStatement implements IStatement {
  readonly type = NodeType.Statement;
  readonly statementType = StatementType.FunctionCall;
  readonly isLastStatement = false;

  constructor(expression: FunctionCallPrefixExpression) {
    this.children = [expression];
  }

  get expression() {
    return this.children[0];
  }

  children: [FunctionCallPrefixExpression];
}
