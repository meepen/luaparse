import { NodeType } from '../../node.js';
import { Chunk } from '../chunk.js';
import { IStatement, StatementType } from '../stat.js';

export class DoStatement implements IStatement {
  readonly statementType = StatementType.DoBlockEnd;
  readonly type = NodeType.Statement;
  readonly isLastStatement = false;

  constructor(body: Chunk) {
    this.children = [body];
  }

  get body() {
    return this.children[0];
  }

  children: [Chunk];
}
