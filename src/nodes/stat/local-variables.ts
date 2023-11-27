import { NodeType } from '../../node.js';
import { ExpressionList } from '../explist.js';
import { NameList } from '../namelist.js';
import { IStatement, StatementType } from '../stat.js';

export class LocalVariablesStatement implements IStatement {
  readonly statementType = StatementType.LocalVariableDeclaration;
  readonly type = NodeType.Statement;
  readonly isLastStatement = false;

  constructor(names: NameList, expressions?: ExpressionList) {
    this.children = expressions ? [names, expressions] : [names];
  }

  get names() {
    return this.children[0];
  }

  get expressions() {
    return this.children[1];
  }

  children: [NameList, ExpressionList] | [NameList];
}
