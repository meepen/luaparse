import { NodeType } from '../../node.js';
import { Chunk } from '../chunk.js';
import { ExpressionList } from '../explist.js';
import { NameList } from '../namelist.js';
import { IStatement, StatementType } from '../stat.js';

export class ForInStatement implements IStatement {
  readonly type = NodeType.Statement;
  readonly statementType = StatementType.ForInBlockEnd;
  readonly isLastStatement = false;

  constructor(nameList: NameList, expressionList: ExpressionList, body: Chunk) {
    this.children = [nameList, expressionList, body];
  }

  get nameList() {
    return this.children[0];
  }

  get expressionList() {
    return this.children[1];
  }

  get body() {
    return this.children[2];
  }

  children: [NameList, ExpressionList, Chunk];
}
