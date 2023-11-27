import { INode, NodeType } from '../../../node.js';
import { Chunk, Expression } from '../../index.js';

export class ElseIfClause implements INode {
  readonly type = NodeType.ElseIfClause;

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
