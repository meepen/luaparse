import { NodeType } from '../../node.js';
import { ExpressionList } from '../explist.js';
import { IStatement, StatementType } from '../stat.js';
import { VariableList } from '../varlist.js';

export class AssignmentStatement implements IStatement {
  readonly type = NodeType.Statement;
  readonly statementType = StatementType.Assignment;
  readonly isLastStatement = false;

  constructor(variables: VariableList, expressions: ExpressionList) {
    this.children = [variables, expressions];
  }

  get variables() {
    return this.children[0];
  }

  get expressions() {
    return this.children[1];
  }

  children: [VariableList, ExpressionList];
}
