import { NodeType } from '../../node.js';
import { Chunk } from '../chunk.js';
import { Expression } from '../index.js';
import { IStatement, StatementType } from '../stat.js';

export class RepeatStatement implements IStatement {
  readonly type = NodeType.Statement;
  readonly statementType = StatementType.RepeatBlockEnd;
  readonly isLastStatement = false;

  constructor(body: Chunk, condition: Expression) {
    this.children = [body, condition];
  }

  get body() {
    return this.children[0];
  }

  get condition() {
    return this.children[1];
  }

  children: [Chunk, Expression];
}
