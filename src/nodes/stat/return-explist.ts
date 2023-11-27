import { NodeType } from '../../node.js';
import { ExpressionList } from '../explist.js';
import { IStatement, StatementType } from '../stat.js';

export class ReturnStatement implements IStatement {
  readonly statementType = StatementType.ReturnStatement;
  readonly type = NodeType.Statement;
  readonly isLastStatement = true;

  constructor(expressions: ExpressionList) {
    this.children = [expressions];
  }

  get expressions() {
    return this.children[0];
  }

  children: [ExpressionList];
}
