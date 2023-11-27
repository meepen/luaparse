export * from './if/elseif.js';

import { NodeType } from '../../node.js';
import { Chunk } from '../chunk.js';
import { IStatement, StatementType } from '../stat.js';
import { Expression } from '../types.js';
import { ElseIfClause } from './if/elseif.js';

export class IfStatement implements IStatement {
  readonly type = NodeType.Statement;
  readonly statementType = StatementType.IfBlockEnd;
  readonly isLastStatement = false;

  constructor(condition: Expression, body: Chunk, elseIfs: ElseIfClause[], elseBody?: Chunk) {
    this.children = elseBody ? [condition, body, ...elseIfs, elseBody] : [condition, body, ...elseIfs];
  }

  get condition() {
    return this.children[0];
  }

  get body() {
    return this.children[1];
  }

  get elseBody() {
    if (this.children.length < 3) {
      return undefined;
    }
    const body = this.children[this.children.length - 1];

    return body instanceof Chunk ? body : undefined;
  }

  get elseIfs(): ElseIfClause[] {
    return (
      this.elseBody ? this.children.slice(2, this.children.length - 1) : this.children.slice(2)
    ) as ElseIfClause[];
  }

  children: [Expression, Chunk, ...ElseIfClause[], Chunk] | [Expression, Chunk, ...ElseIfClause[]];
}
