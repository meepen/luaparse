import { NodeType } from '../../node.js';
import { Chunk } from '../chunk.js';
import { IStatement, StatementType } from '../stat.js';
import { Expression } from '../types.js';

export class WhileStatement implements IStatement {
  readonly statementType = StatementType.WhileBlockEnd;
  readonly type = NodeType.Statement;
  readonly isLastStatement = false;

  constructor(condition: Expression, body: Chunk) {
    this.children = [condition, body];
  }

  get condition() {
    return this.children[0];
  }

  get body() {
    return this.children[1];
  }

  children: [Expression, Chunk];
}
