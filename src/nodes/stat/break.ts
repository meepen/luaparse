import { NodeType } from '../../node.js';
import { IStatement, StatementType } from '../stat.js';

export class BreakStatement implements IStatement {
  readonly statementType = StatementType.BreakStatement;
  readonly type = NodeType.Statement;
  readonly isLastStatement = true;
  readonly children = [];
}
