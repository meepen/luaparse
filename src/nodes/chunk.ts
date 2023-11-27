import { INode, NodeType } from '../node.js';
import { Statement } from './types.js';

export class Chunk implements INode {
  readonly type = NodeType.Chunk;

  constructor(body: Statement[]) {
    this.children = body;
  }

  get body() {
    return this.children;
  }

  children: Statement[];
}
